"""Tests for scripts/win_preflight.py (PENT-23).

The probe layer only runs on Windows, so the evaluation is tested by replaying
saved host facts from tests/fixtures/win_preflight/, one file per known
failure scenario. Each scenario has a golden expectation below.
"""

import json
import os
import sys

import pytest

import win_preflight as wp

FIXTURES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures", "win_preflight")


def load(name):
    with open(os.path.join(FIXTURES, name + ".json"), encoding="utf-8") as fh:
        return json.load(fh)


def statuses(report):
    return {c["id"]: c["status"] for c in report["checks"]}


# scenario -> (overall, {check: status}, models, recommended, admin_only_fixes)
GOLDEN = {
    "ready_podman": (
        "ok",
        {"vtx": "ok", "wsl": "ok", "podman": "ok", "execution_policy": "ok", "virtualbox": "info"},
        {"native_userland": "ready", "virtualbox": "not-installed", "podman_wsl2": "ready"},
        "Model 3: Podman/WSL2",
        [],
    ),
    "vtx_disabled_bios": (
        "fail",
        {"vtx": "fail", "virtualbox": "warn", "wsl": "fail"},
        {"native_userland": "ready", "virtualbox": "unavailable", "podman_wsl2": "unavailable"},
        "Model 1: native userland",
        ["vtx"],
    ),
    "hyperv_blocks_virtualbox": (
        "warn",
        {"vtx": "ok", "virtualbox": "warn", "podman": "info"},
        {"native_userland": "ready", "virtualbox": "degraded", "podman_wsl2": "needs-setup"},
        "Model 1: native userland",
        [],
    ),
    "wsl_missing_needs_admin": (
        "warn",
        {"wsl": "warn", "podman": "warn"},
        {"native_userland": "ready", "virtualbox": "not-installed", "podman_wsl2": "needs-setup"},
        "Model 1: native userland",
        ["wsl"],
    ),
    "podman_machine_stopped": (
        "warn",
        {"podman": "warn", "wsl": "ok"},
        {"native_userland": "ready", "virtualbox": "not-installed", "podman_wsl2": "needs-setup"},
        "Model 1: native userland",
        [],
    ),
    "execution_policy_restricted": (
        "warn",
        {"execution_policy": "warn", "ram": "warn", "disk": "warn", "wsl": "warn"},
        {"native_userland": "ready", "virtualbox": "not-installed", "podman_wsl2": "needs-setup"},
        "Model 1: native userland",
        [],
    ),
}


@pytest.mark.parametrize("scenario", sorted(GOLDEN))
def test_scenario_golden(scenario):
    overall, expected_checks, models, recommended, admin = GOLDEN[scenario]
    report = wp.evaluate(load(scenario))
    got = statuses(report)
    for cid, status in expected_checks.items():
        assert got[cid] == status, f"{scenario}: {cid} is {got[cid]}, expected {status}"
    assert report["overall"] == overall
    assert report["models"] == models
    assert report["recommended_model"] == recommended
    assert report["admin_only_fixes"] == admin


def test_every_fixture_has_a_golden_entry():
    names = {f[:-5] for f in os.listdir(FIXTURES) if f.endswith(".json")}
    assert names == set(GOLDEN)


def test_every_non_ok_check_has_a_remediation():
    for scenario in GOLDEN:
        for c in wp.evaluate(load(scenario))["checks"]:
            if c["status"] in ("warn", "fail"):
                assert c["remediation"], f"{scenario}: {c['id']} has no remediation"


def test_hypervisor_hides_vtx_flags_but_counts_as_enabled():
    # Real Windows 11 + Hyper-V host: CIM reports VMX/SLAT False while VT-x is in use.
    facts = load("ready_podman")
    assert facts["cpu"]["vmx_extensions"] is False
    assert wp.evaluate(facts)["vtx_state"] == "hypervisor"


def test_old_virtualbox_under_hyperv_suggests_upgrade():
    report = wp.evaluate(load("hyperv_blocks_virtualbox"))
    vbox = next(c for c in report["checks"] if c["id"] == "virtualbox")
    assert "Upgrade VirtualBox" in vbox["remediation"][0]


def test_restricted_policy_fix_needs_no_admin():
    report = wp.evaluate(load("execution_policy_restricted"))
    ep = next(c for c in report["checks"] if c["id"] == "execution_policy")
    assert "Restricted" in ep["message"]
    assert ep["needs_admin"] is False
    assert any("-Scope CurrentUser" in fix for fix in ep["remediation"])


def test_undefined_policy_on_server_is_remote_signed():
    facts = load("ready_podman")
    facts["execution_policy"] = "Undefined"
    facts["os_caption"] = "Microsoft Windows Server 2022"
    assert statuses(wp.evaluate(facts))["execution_policy"] == "ok"


def test_old_python_fails():
    facts = load("ready_podman")
    facts["python"]["version"] = "3.9.13"
    report = wp.evaluate(facts)
    assert statuses(report)["python"] == "fail"
    assert report["models"]["native_userland"] == "blocked"


def test_non_windows_is_skipped():
    report = wp.evaluate({"platform": "linux", "python": {"version": "3.12.0"}})
    assert [c["status"] for c in report["checks"]] == ["skip"]
    assert report["overall"] == "ok"
    assert report["models"] == {}


def test_unknown_vtx_warns():
    facts = load("ready_podman")
    facts["hypervisor_present"] = None
    facts["cpu"] = {"name": None, "virtualization_firmware_enabled": None,
                    "vmx_extensions": None, "slat": None}
    assert statuses(wp.evaluate(facts))["vtx"] == "warn"


# --- parsers -----------------------------------------------------------------

WSL_LIST = (
    "  NAME                   STATE           VERSION\n"
    "* Ubuntu-22.04           Running         2\n"
    "  docker-desktop         Stopped         2\n"
    "  Legacy Debian          Stopped         1\n"
)


def test_parse_wsl_list():
    distros = wp.parse_wsl_list(WSL_LIST)
    assert distros == [
        {"name": "Ubuntu-22.04", "state": "Running", "version": 2, "default": True},
        {"name": "docker-desktop", "state": "Stopped", "version": 2, "default": False},
        {"name": "Legacy Debian", "state": "Stopped", "version": 1, "default": False},
    ]


def test_decode_console_handles_wsl_utf16():
    raw = WSL_LIST.encode("utf-16-le")
    assert wp.parse_wsl_list(wp.decode_console(raw))[0]["name"] == "Ubuntu-22.04"
    assert wp.decode_console(b"") == ""
    assert wp.decode_console("ok".encode()) == "ok"


def test_wsl_not_installed_detection():
    msg = "The Windows Subsystem for Linux is not installed. Run 'wsl.exe --install'."
    assert wp.wsl_not_installed(msg, 1)
    assert not wp.wsl_not_installed(WSL_LIST, 0)


def test_parse_podman_machines():
    text = json.dumps([
        {"Name": "podman-machine-default*", "Running": False, "LastUp": "2 days ago"},
        {"Name": "lab", "Running": True},
    ])
    assert wp.parse_podman_machines(text) == [
        {"name": "podman-machine-default", "running": False},
        {"name": "lab", "running": True},
    ]
    assert wp.parse_podman_machines("not json") == []
    assert wp.parse_podman_machines("{}") == []


def test_parse_version():
    assert wp.parse_version("7.0.20r163906") == "7.0.20"
    assert wp.parse_version("podman version 5.2.1") == "5.2.1"
    assert wp.parse_version("") is None


# --- CLI ---------------------------------------------------------------------

def test_cli_exit_codes(capsys):
    assert wp.main(["--facts", os.path.join(FIXTURES, "vtx_disabled_bios.json")]) == 1
    assert wp.main(["--facts", os.path.join(FIXTURES, "podman_machine_stopped.json")]) == 0
    assert wp.main(["--strict", "--facts", os.path.join(FIXTURES, "podman_machine_stopped.json")]) == 1
    out = capsys.readouterr().out
    assert "[FAIL] vtx" in out and "Overall: WARN" in out


def test_cli_json_and_save_facts(tmp_path, capsys):
    saved = tmp_path / "facts.json"
    rc = wp.main(["--json", "--facts", os.path.join(FIXTURES, "ready_podman.json"),
                  "--save-facts", str(saved)])
    assert rc == 0
    report = json.loads(capsys.readouterr().out)
    assert report["task"] == "PENT-23" and report["overall"] == "ok"
    assert json.loads(saved.read_text(encoding="utf-8"))["platform"] == "windows"


def test_gather_facts_off_windows_is_basic(monkeypatch):
    monkeypatch.setattr(sys, "platform", "linux")
    facts = wp.gather_facts()
    assert facts["platform"] == "linux"
    assert "wsl" not in facts and facts["python"]["version"]


@pytest.mark.skipif(sys.platform != "win32", reason="live probe only on Windows")
def test_gather_facts_live_windows_is_well_formed():
    facts = wp.gather_facts()
    assert facts["platform"] == "windows"
    assert {"wsl", "podman", "virtualbox", "cpu"} <= set(facts)
    report = wp.evaluate(facts)
    assert report["overall"] in ("ok", "warn", "fail")


# --- executable resolution (no binaries from the current/lab directory) -------

def test_which_trusted_rejects_binary_in_current_dir(monkeypatch, tmp_path):
    planted = tmp_path / "podman.exe"
    planted.write_text("")
    monkeypatch.chdir(tmp_path)
    monkeypatch.setattr(wp.shutil, "which", lambda name: str(planted))
    assert wp._which_trusted("podman") is None


def test_which_trusted_rejects_binary_in_lab_dir(monkeypatch):
    monkeypatch.setattr(wp.shutil, "which", lambda name: os.path.join(wp.LAB_DIR, "wsl.exe"))
    assert wp._which_trusted("wsl") is None


def test_which_trusted_accepts_install_dir(monkeypatch, tmp_path):
    install = tmp_path / "Program Files" / "Podman"
    install.mkdir(parents=True)
    exe = install / "podman.exe"
    monkeypatch.setattr(wp.shutil, "which", lambda name: str(exe))
    assert wp._which_trusted("podman") == str(exe)
    monkeypatch.setattr(wp.shutil, "which", lambda name: None)
    assert wp._which_trusted("podman") is None


def test_system_exe_resolves_only_under_system_root(monkeypatch, tmp_path):
    sys32 = tmp_path / "System32"
    sys32.mkdir()
    (sys32 / "wsl.exe").write_text("")
    monkeypatch.setenv("SystemRoot", str(tmp_path))
    assert wp._system_exe("wsl.exe") == os.path.join(str(tmp_path), "System32", "wsl.exe")
    assert wp._system_exe("missing.exe") is None
