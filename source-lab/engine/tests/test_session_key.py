"""Tests for session HMAC key resolution and bundle trust checks."""

import json
import sys
from pathlib import Path

import pytest

from source_lab.cli import run_detection
from source_lab.evidence.schema import PlatformType, TargetIdentity
from source_lab.evidence.session import (
    ENV_HMAC_KEY,
    ENV_HMAC_KEY_FILE,
    CollectorMetadata,
    SessionBundleReader,
    SessionBundleWriter,
    SessionKeyError,
    SessionMetadata,
    SessionScope,
    load_hmac_key,
)

FIXTURES = Path(__file__).parent / "fixtures" / "injection"


def _meta(session_id: str = "ses_test") -> SessionMetadata:
    return SessionMetadata(
        session_id=session_id,
        platform=PlatformType.BROWSER_EXTENSION,
        target=TargetIdentity(identifier="test/sample"),
        collector=CollectorMetadata(engine="test"),
        scope=SessionScope(),
    )


def _write_bundle(root: Path) -> Path:
    session_dir = root / "ses_test"
    writer = SessionBundleWriter(session_dir, _meta())
    writer.append_event(1.0, "dom_mutation", {"node": "SCRIPT", "src": "content.js"})
    writer.close()
    return session_dir


def _run_cli(target: Path, out: Path, session: Path | None = None) -> int:
    argv = ["run_detection", str(target), "-o", str(out)]
    if session is not None:
        argv += ["--session", str(session)]
    old_argv = sys.argv
    sys.argv = argv
    try:
        return run_detection.main()
    finally:
        sys.argv = old_argv


# @lat: [[source-tests#Runtime sessions#Missing key fails closed]]
def test_missing_key_fails_closed(tmp_path, monkeypatch):
    monkeypatch.delenv(ENV_HMAC_KEY, raising=False)
    monkeypatch.delenv(ENV_HMAC_KEY_FILE, raising=False)

    with pytest.raises(SessionKeyError, match="No session HMAC key configured"):
        SessionBundleWriter(tmp_path / "ses_missing", _meta())
    with pytest.raises(SessionKeyError, match="No session HMAC key configured"):
        SessionBundleReader(tmp_path / "ses_missing")


# @lat: [[source-tests#Runtime sessions#Tampered bundle fails verification]]
def test_tampered_bundle_fails_verification(tmp_path):
    session_dir = _write_bundle(tmp_path)
    events_file = session_dir / "events.jsonl"
    events_file.write_text(
        events_file.read_text(encoding="utf-8") + '{"seq":2,"t_ms":2.0,"type":"injected","data":{}}\n',
        encoding="utf-8",
    )

    result = SessionBundleReader(session_dir).verify_integrity()

    assert result["valid"] is False
    assert any("events.jsonl" in mismatch for mismatch in result["mismatches"])


# @lat: [[source-tests#Runtime sessions#Conflicting key sources]]
def test_conflicting_key_sources_raise(tmp_path, monkeypatch):
    key_file = tmp_path / "session.key"
    key_file.write_text("b" * 32 + "\n", encoding="utf-8")
    key_file.chmod(0o600)
    monkeypatch.setenv(ENV_HMAC_KEY, "a" * 32)
    monkeypatch.setenv(ENV_HMAC_KEY_FILE, str(key_file))

    with pytest.raises(SessionKeyError, match="different keys"):
        load_hmac_key()


# @lat: [[source-tests#Runtime sessions#Short key rejected]]
def test_short_key_rejected(monkeypatch):
    monkeypatch.setenv(ENV_HMAC_KEY, "too-short")
    monkeypatch.delenv(ENV_HMAC_KEY_FILE, raising=False)

    with pytest.raises(SessionKeyError, match="at least 32 bytes"):
        load_hmac_key()


# @lat: [[source-tests#Runtime sessions#Static-only run has no runtime limitation]]
def test_cli_static_run_has_no_runtime_limitation(tmp_path, monkeypatch):
    monkeypatch.delenv(ENV_HMAC_KEY, raising=False)
    monkeypatch.delenv(ENV_HMAC_KEY_FILE, raising=False)

    out = tmp_path / "out"
    assert _run_cli(FIXTURES / "browser_positive", out) == 0

    coverage = json.loads((out / "coverage.json").read_text(encoding="utf-8"))
    assert not any("runtime evidence skipped" in limitation for limitation in coverage["limitations"])


# @lat: [[source-tests#Runtime sessions#CLI skips runtime evidence without a key]]
def test_cli_skips_runtime_evidence_without_key(tmp_path, monkeypatch):
    session_dir = _write_bundle(tmp_path)
    monkeypatch.delenv(ENV_HMAC_KEY, raising=False)
    monkeypatch.delenv(ENV_HMAC_KEY_FILE, raising=False)

    out = tmp_path / "out"
    assert _run_cli(FIXTURES / "browser_positive", out, session_dir) == 0

    coverage = json.loads((out / "coverage.json").read_text(encoding="utf-8"))
    assert "runtime evidence skipped: no session key configured" in coverage["limitations"]
    findings = json.loads((out / "findings.json").read_text(encoding="utf-8"))
    assert all(f["state"] != "correlated_behavior" for f in findings)


# @lat: [[source-tests#Runtime sessions#CLI refuses a tampered session]]
def test_cli_ignores_tampered_session(tmp_path):
    session_dir = _write_bundle(tmp_path)
    events_file = session_dir / "events.jsonl"
    events_file.write_text(
        events_file.read_text(encoding="utf-8") + '{"seq":2,"t_ms":2.0,"type":"injected","data":{}}\n',
        encoding="utf-8",
    )

    out = tmp_path / "out"
    assert _run_cli(FIXTURES / "browser_positive", out, session_dir) == 0

    coverage = json.loads((out / "coverage.json").read_text(encoding="utf-8"))
    limitations = "\n".join(coverage["limitations"])
    assert "Runtime session integrity verification failed" in limitations
    assert "events.jsonl" in limitations
    findings = json.loads((out / "findings.json").read_text(encoding="utf-8"))
    assert all(f["state"] != "correlated_behavior" for f in findings)
