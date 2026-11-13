"""CLN-03 console contract: typed scan jobs, polling, progress and cancel.

The scan itself is covered by ``cleanup-lab/engine/tests/test_scan.py``; these
tests hold the HTTP-shaped layer to the same rules: no free-form paths, catalog
ids only, a job that always answers, and cancel that reaches the worker.
"""
import json
import os
import sys
import threading
import time
import urllib.request
from http.server import HTTPServer

import pytest

REPO_ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "console"))
sys.path.insert(0, os.path.join(REPO_ROOT, "cleanup-lab", "engine"))

import cleanup_api  # noqa: E402
from cleanup_lab import catalog as catalog_module  # noqa: E402
from cleanup_lab import paths as paths_module  # noqa: E402


def wait_for(job, state=None, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if state is None and job.state != "running":
            return job
        if state is not None and job.state == state:
            return job
        time.sleep(0.01)
    raise AssertionError("job stayed {0!r}".format(job.state))


@pytest.fixture(autouse=True)
def clean_jobs():
    def drain():
        for job in list(cleanup_api.JOBS.jobs.values()):
            job.cancel.set()
        deadline = time.time() + 10
        while time.time() < deadline:
            if not any(job.state == "running" for job in cleanup_api.JOBS.jobs.values()):
                return
            time.sleep(0.01)

    drain()
    cleanup_api.JOBS.jobs.clear()
    yield
    drain()
    cleanup_api.JOBS.jobs.clear()


def catalog_cache_target(tmp_path, monkeypatch):
    """Point HOME at the temp tree and return the catalog's user-cache folder."""
    platform = paths_module.platform_id()
    if platform not in ("macos", "linux"):
        pytest.skip("no catalog path for this test platform")
    monkeypatch.setenv("HOME", str(tmp_path))
    monkeypatch.setenv("USERPROFILE", str(tmp_path))
    if platform == "linux":
        monkeypatch.setenv("XDG_CACHE_HOME", str(tmp_path / ".cache"))
    entry = next(
        item for item in catalog_module.load(REPO_ROOT) if item["id"] == "system.user-caches"
    )
    target = catalog_module.resolve(entry, platform)[0]["path"]
    os.makedirs(target, exist_ok=True)
    return target


def test_a_scan_job_measures_the_catalog_paths(tmp_path, monkeypatch):
    target = catalog_cache_target(tmp_path, monkeypatch)
    with open(os.path.join(target, "one.bin"), "wb") as handle:
        handle.write(b"x" * 64)
    with open(os.path.join(target, "two.bin"), "wb") as handle:
        handle.write(b"y" * 36)

    api = cleanup_api.CleanupAPI(REPO_ROOT)
    job = api.post(
        "/api/cleanup/scan", {"entryIds": ["system.user-caches"], "workers": 1}
    )
    wait_for(job, "done")

    assert job.kind == "scan"
    assert job.request == {"entryIds": ["system.user-caches"], "workers": 1}
    assert job.error is None
    assert job.result["cancelled"] is False
    assert job.result["totals"]["sizeBytes"] == 100
    assert job.result["progress"]["phase"] == "done"
    path_report = job.result["entries"][0]["paths"][0]
    assert path_report["measured"] is True
    assert path_report["sizeBytes"] == 100
    assert job.finishedAt is not None

    polled = api.get("/api/cleanup/jobs/" + job.id, {})
    assert polled["id"] == job.id
    assert polled["state"] == "done"
    listed = api.get("/api/cleanup/jobs", {})
    assert [row["id"] for row in listed["jobs"]] == [job.id]


def test_the_scan_request_accepts_catalog_ids_only():
    api = cleanup_api.CleanupAPI(REPO_ROOT)
    refused = [
        {"path": "/tmp"},
        {"entryIds": ["system.user-caches"], "root": "/tmp"},
        {"entryIds": []},
        {"entryIds": "system.user-caches"},
        {"entryIds": ["nope.entry"]},
        {"entryIds": ["system.user-caches", "system.user-caches"]},
        {"entryIds": [1]},
        {"workers": 0},
        {"workers": cleanup_api._module(REPO_ROOT, "scan").MAX_WORKERS + 1},
        {"workers": True},
        {"workers": "4"},
    ]
    for body in refused:
        with pytest.raises(cleanup_api.CleanupError) as caught:
            api.post("/api/cleanup/scan", body)
        assert caught.value.status == 400, body


def test_unknown_jobs_and_endpoints_are_404():
    api = cleanup_api.CleanupAPI(REPO_ROOT)
    for path in ("/api/cleanup/jobs/nope", "/api/cleanup/jobs/nope/cancel"):
        with pytest.raises(cleanup_api.CleanupError) as caught:
            if path.endswith("/cancel"):
                api.post(path, {})
            else:
                api.get(path, {})
        assert caught.value.status == 404
    with pytest.raises(cleanup_api.CleanupError) as caught:
        api.get("/api/cleanup/jobs/nope/deeper", {})
    assert caught.value.status == 404
    with pytest.raises(cleanup_api.CleanupError) as caught:
        api.post("/api/cleanup/nope", {})
    assert caught.value.status == 404
    with pytest.raises(cleanup_api.CleanupError) as caught:
        api.get("/api/cleanup/jobs", {"x": ["1"]})
    assert caught.value.status == 400


def test_cancel_reaches_a_running_scan(monkeypatch):
    """A fake catalog keeps the job running until cancel; the store maps it honestly."""

    def fake_scan(root, entry_ids, *, cancel, progress_callback, workers):
        progress_callback(
            {
                "phase": "scanning",
                "pathsDone": 0,
                "pathsTotal": 1,
                "bytesSeen": 0,
                "filesSeen": 0,
                "currentPath": "/fake",
            }
        )
        while not cancel.is_set():
            time.sleep(0.01)
        return {
            "cancelled": True,
            "entries": [],
            "totals": {},
            "progress": {"phase": "cancelled", "pathsDone": 0, "pathsTotal": 1},
        }

    class FakeModule:
        MAX_WORKERS = 4
        scan_catalog = staticmethod(fake_scan)

        @staticmethod
        def load(root):
            return [{"id": "fake.entry"}]

    monkeypatch.setattr(cleanup_api, "_module", lambda root, name: FakeModule())
    api = cleanup_api.CleanupAPI(REPO_ROOT)
    job = api.post("/api/cleanup/scan", {"entryIds": ["fake.entry"]})
    deadline = time.time() + 5
    while job.progress["currentPath"] != "/fake" and time.time() < deadline:
        time.sleep(0.01)
    assert job.progress["currentPath"] == "/fake"

    answer = api.post("/api/cleanup/jobs/{0}/cancel".format(job.id), {})
    assert answer["id"] == job.id
    wait_for(job, "cancelled")
    assert job.result["cancelled"] is True
    assert job.progress["phase"] == "cancelled"

    with pytest.raises(cleanup_api.CleanupError) as caught:
        api.post("/api/cleanup/jobs/{0}/cancel".format(job.id), {"force": True})
    assert caught.value.status == 400


def test_the_browser_route_starts_polls_and_cancels(tmp_path, monkeypatch):
    target = catalog_cache_target(tmp_path, monkeypatch)
    with open(os.path.join(target, "blob.bin"), "wb") as handle:
        handle.write(b"z" * 4096)

    from web_ui import LabHttpHandler

    server = HTTPServer(("127.0.0.1", 0), LabHttpHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = "http://127.0.0.1:{0}".format(server.server_address[1])

    def call(path, body=None):
        data = None if body is None else json.dumps(body).encode("utf-8")
        headers = (
            {"Content-Type": "application/json", "X-OSLab": "1"} if body is not None else {}
        )
        request = urllib.request.Request(base + path, data=data, headers=headers)
        with urllib.request.urlopen(request, timeout=10) as answer:
            return answer.status, json.loads(answer.read().decode("utf-8"))

    try:
        status, started = call(
            "/api/cleanup/scan", {"entryIds": ["system.user-caches"], "workers": 1}
        )
        assert status == 202
        assert started["kind"] == "scan"
        deadline = time.time() + 10
        while time.time() < deadline:
            _, polled = call("/api/cleanup/jobs/" + started["id"])
            if polled["state"] != "running":
                break
            time.sleep(0.01)
        assert polled["state"] == "done"
        assert polled["result"]["totals"]["sizeBytes"] == 4096

        status, cancelled = call("/api/cleanup/jobs/{0}/cancel".format(started["id"]), {})
        assert status == 200
        assert cancelled["id"] == started["id"]
    finally:
        server.shutdown()
        server.server_close()
