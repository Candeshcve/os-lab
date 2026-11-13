"""`labctl cleanup status|doctor|catalog [--json]`.

All three read: they print the readiness probe or the detector catalog and change
nothing. The exit code follows the lab CLI contract — ``0`` when the engine is
ready, ``1`` when it needs setup or the platform is unsupported, ``2`` for a usage
error (argparse).
"""
from __future__ import annotations

import argparse
import json
import sys

from .catalog import CatalogError, report as catalog_report
from .readiness import probe, repo_root

USAGE_EXIT = 2


def _colour(text, code, stream):
    if not getattr(stream, "isatty", lambda: False)():
        return text
    return "{0}{1}\033[0m".format(code, text)


def _mark(found, stream):
    if found:
        return _colour("[ok]", "\033[32m", stream)
    return _colour("[--]", "\033[31m", stream)


def _safe(value):
    """Escape control characters so a path or process name cannot rewrite the terminal."""
    return "".join(
        character if character.isprintable() else "\\x{:02x}".format(ord(character))
        for character in str(value)
    )


def _status_lines(report, stream):
    engine = report["engine"]
    lines = [
        "Cleanup Lab {0} · {1} · {2}".format(
            _safe(engine["version"]), _safe(report["platform"]["label"]), _safe(report["state"])
        ),
    ]
    for item in report["requirements"]:
        lines.append(
            "  {0} {1:<32} {2}".format(
                _mark(item["found"], stream), _safe(item["label"]), _safe(item["detail"])
            )
        )
    lines.append("")
    lines.append("Capabilities:")
    for item in report["capabilities"]:
        lines.append(
            "  {0} {1:<32} {2}".format(
                _mark(item["found"], stream), _safe(item["label"]), _safe(item["detail"])
            )
        )
    if report["reasons"]:
        lines.append("")
        lines.append("What to fix:")
        lines.extend("  - {0}".format(_safe(reason)) for reason in report["reasons"])
    return lines


def _doctor_lines(report, stream):
    lines = _status_lines(report, stream)
    lines.append("")
    lines.append("Paths:")
    lines.append("  home        {0}".format(_safe(report["home"])))
    lines.append("  state       {0}".format(_safe(report["stateDir"])))
    lines.append("")
    lines.append("Hints:")
    for item in report["requirements"]:
        marker = "" if item["found"] else " (needs attention)"
        lines.append("  {0}{1}: {2}".format(_safe(item["label"]), marker, _safe(item["hint"])))
    readiness = {
        "ready": "Every readiness check passed; nothing has been scanned yet.",
        "needs-setup": "The engine is installed but something it needs is missing.",
        "unavailable": "This operating system is not supported by Cleanup Lab.",
    }[report["state"]]
    lines.append("  {0}".format(readiness))
    return lines


def _catalog_lines(report, stream):
    entries = report["entries"]
    count = len(entries)
    lines = [
        "Cleanup Lab catalog · {0} · {1} {2}".format(
            report["platform"], count, "entry" if count == 1 else "entries"
        )
    ]
    for entry in entries:
        flag = "pre-selected" if entry["defaultSelected"] else "not pre-selected"
        lines.append(
            "  {0:<22} {1:<26} {2:<11} {3}".format(entry["id"], entry["name"], entry["risk"], flag)
        )
        for path in entry["paths"]:
            if path["path"]:
                lines.append("      {0}".format(path["path"]))
            else:
                lines.append("      {0}  ({1})".format(path["template"], path["reason"]))
    return lines


def build_parser():
    parser = argparse.ArgumentParser(
        prog="labctl cleanup",
        description="Cleanup Lab: inspect readiness (read-only) and, from CLN-19, scan/plan/clean.",
    )
    sub = parser.add_subparsers(dest="command", metavar="status|doctor|catalog")
    for name, text in (
        ("status", "one-screen readiness summary"),
        ("doctor", "every check, path and hint"),
        ("catalog", "detector catalog for this computer, with resolved paths"),
    ):
        command = sub.add_parser(name, help=text, description=text)
        command.add_argument("--json", action="store_true", help="print the probe as JSON")
    return parser


def main(argv=None, stream=None):
    stream = sys.stdout if stream is None else stream
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help(stream)
        return USAGE_EXIT
    try:
        report = probe() if args.command != "catalog" else catalog_report(repo_root())
    except CatalogError as exc:
        sys.stderr.write("cleanup catalog: {0}\n".format(exc))
        return 1
    if args.json:
        stream.write(json.dumps(report, indent=2) + "\n")
    else:
        lines = {
            "status": _status_lines,
            "doctor": _doctor_lines,
            "catalog": _catalog_lines,
        }[args.command](report, stream)
        stream.write("\n".join(lines) + "\n")
    if args.command == "catalog":
        return 0
    return 0 if report["state"] == "ready" else 1


if __name__ == "__main__":  # pragma: no cover - exercised through labctl
    sys.exit(main())
