"""Source Lab console adapter; engine code runs only in child processes."""
from __future__ import annotations

import json
import os
from pathlib import Path
import subprocess
import sys


def python() -> str:
    return os.environ.get("SOURCE_LAB_PYTHON") or sys.executable


def readiness(root: str) -> dict:
    try:
        result = subprocess.run([python(), str(Path(root) / "source-lab/run.py"), "status", "--json"],
                                capture_output=True, text=True, timeout=8)
        report = json.loads(result.stdout)
        if not isinstance(report, dict) or "storage" not in report:
            raise ValueError()
        return report
    except (OSError, ValueError, subprocess.SubprocessError):
        return {"state": "unavailable", "python": {}, "storage": {}, "optional": {}, "capabilities": []}


def lab_status(root: str, os_name: str) -> dict:
    report = readiness(root) if os_name in ("linux", "macos", "windows") else {}
    installed = (Path(root) / "source-lab/run.py").is_file()
    runnable = bool(report.get("python")) and installed
    writable = report.get("storage", {}).get("writable", False)
    requirements = [
        {"id": "python", "label": "Python 3.11+", "found": runnable, "required": True,
         "hint": "Install Python 3.11+ and set SOURCE_LAB_PYTHON if needed."},
        {"id": "storage", "label": "Writable Source Lab storage", "found": writable, "required": True,
         "hint": "Set SOURCE_LAB_STORAGE to a writable private directory."},
    ]
    for tool in ("git", "node", "tree_sitter", "playwright"):
        requirements.append({"id": tool, "label": tool, "found": bool(report.get("optional", {}).get(tool)),
                             "required": False, "hint": "Optional; static detection does not need this tool."})
    state = "unavailable" if not runnable else "ready" if writable else "needs-setup"
    return {"id": "source", "label": "Source Lab", "summary": "Local source and package analysis across five platforms.",
            "provider": "native-python" if runnable else None, "state": state, "requirements": requirements,
            "reasons": [] if state == "ready" else [r["hint"] for r in requirements if r["required"] and not r["found"]],
            "notes": ["Static analysis needs no VM, KVM, Docker or network downloads."], "installed": installed,
            "capabilities": report.get("capabilities", []),
            "actions": [{"id": a, "label": a.capitalize(), "description": d, "privileged": False} for a, d in
                        (("status", "Read Source Lab readiness."), ("doctor", "Check core and optional tools."),
                         ("setup", "Create private storage directories; no downloads."))] if runnable else []}


def plan(root: str, request: dict) -> dict:
    import oslab
    if set(request) - {"lab", "action"} or request.get("action") not in ("status", "doctor", "setup"):
        raise oslab.PlanError("Unsupported Source Lab action or options")
    if lab_status(root, oslab.host_os())["state"] != "ready":
        raise oslab.PlanError("Source Lab Python or storage is unavailable; run Doctor in a terminal")
    action = request["action"]
    args = [str(Path(root) / "source-lab/run.py"), action]
    return {"lab": "source", "action": action, "provider": "native-python", "workspace": root,
            "program": python(), "args": args, "effects": ["Creates private storage; no downloads." if action == "setup" else "Reads readiness without changing state."],
            "timeoutSec": 30, "privileged": False, "runnable": True, "manualCommand": None, "setup": None,
            "display": " ".join(oslab._quote(p) for p in [python(), *args])}
