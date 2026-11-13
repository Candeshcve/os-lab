"""Cleanup Lab HTTP contracts (``/api/cleanup/...``).

The console accepts typed, validated calls only: never a command string and never
a free-form path list from the page (``cleanup-lab/README.md``). Ready:
readiness (CLN-01), the detector catalog (CLN-02) and the scan job (CLN-03).
The plan → clean flow (CLN-13), history (CLN-15) and the remaining endpoints add
their own actions here, each validated again by the engine's safety guard.

The engine is imported from ``cleanup-lab/engine`` (``cleanup_lab``), which is a
plain standard-library package: the console does not install it.

Long work runs as an in-process console job (CLN-03): ``POST /api/cleanup/scan``
starts one, ``GET /api/cleanup/jobs/<id>`` polls its progress and result, and
``POST /api/cleanup/jobs/<id>/cancel`` stops it. The store keeps the most recent
:data:`MAX_JOBS` jobs; jobs live only in this console process, like the lab jobs.
"""
from __future__ import annotations

import importlib
import os
import sys
import threading
import time
import uuid

MAX_JOBS = 20
MAX_ENTRY_IDS = 200
JOB_KIND = "scan"
#: The only keys a scan request may carry. Paths are deliberately not among
#: them: the scan walks the catalog, never a list the page sends.
SCAN_KEYS = ("entryIds", "workers")


class CleanupError(ValueError):
    """A request the Cleanup Lab refused, with the HTTP status to answer."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def _module(root, name):
    engine = os.path.join(root, "cleanup-lab", "engine")
    if engine not in sys.path:
        sys.path.insert(0, engine)
    try:
        return importlib.import_module("cleanup_lab." + name)
    except ImportError as exc:  # a lone console copy without the engine
        raise CleanupError(501, "The cleanup engine (cleanup-lab/engine) is not installed") from exc


def _query(query):
    """Reject duplicate or unexpected query parameters instead of guessing."""
    if query:
        raise CleanupError(400, "Unexpected query parameters")


class ScanJob:
    """One running (or finished) catalog scan, with its progress and result."""

    def __init__(self, request):
        self.id = uuid.uuid4().hex[:12]
        self.kind = JOB_KIND
        self.state = "running"
        self.request = request
        self.progress = {
            "phase": "queued",
            "pathsDone": 0,
            "pathsTotal": 0,
            "bytesSeen": 0,
            "filesSeen": 0,
            "currentPath": "",
        }
        self.result = None
        self.error = None
        self.startedAt = time.time()
        self.finishedAt = None
        self.cancel = threading.Event()

    def to_dict(self):
        return {
            "id": self.id,
            "kind": self.kind,
            "state": self.state,
            "request": self.request,
            "progress": self.progress,
            "result": self.result,
            "error": self.error,
            "startedAt": self.startedAt,
            "finishedAt": self.finishedAt,
        }


class ScanJobStore:
    """The console's cleanup jobs. One store per console process."""

    def __init__(self):
        self.jobs = {}
        self.lock = threading.Lock()

    def start(self, root, request):
        """Validate the scan request, then run it on a worker thread.

        ``request`` may name ``entryIds`` (catalog ids only) and ``workers``;
        anything else — a path, a command, an unknown key — is refused before a
        thread exists.
        """
        scan = _module(root, "scan")
        catalog = _module(root, "catalog")
        entry_ids = request.get("entryIds")
        if entry_ids is not None:
            if (
                not isinstance(entry_ids, list)
                or not entry_ids
                or any(not isinstance(item, str) or not item for item in entry_ids)
            ):
                raise CleanupError(400, "entryIds must be a list of detector ids")
            if len(set(entry_ids)) != len(entry_ids):
                raise CleanupError(400, "entryIds contains duplicates")
            if len(entry_ids) > MAX_ENTRY_IDS:
                raise CleanupError(400, "Too many detector ids")
            try:
                known = {entry["id"] for entry in catalog.load(root)}
            except catalog.CatalogError as exc:
                raise CleanupError(500, "The detector catalog is invalid: {0}".format(exc)) from exc
            unknown = sorted(set(entry_ids) - known)
            if unknown:
                raise CleanupError(400, "Unknown detector id(s): {0}".format(", ".join(unknown)))
        workers = request.get("workers")
        if workers is not None:
            if not isinstance(workers, int) or isinstance(workers, bool):
                raise CleanupError(400, "workers must be a whole number")
            if not 1 <= workers <= scan.MAX_WORKERS:
                raise CleanupError(400, "workers must be between 1 and {0}".format(scan.MAX_WORKERS))
        job = ScanJob({"entryIds": entry_ids, "workers": workers})
        with self.lock:
            self.jobs[job.id] = job
            self._prune_locked()
        try:
            threading.Thread(
                target=self._run, args=(root, job, entry_ids, workers), daemon=True
            ).start()
        except RuntimeError as exc:
            job.state = "failed"
            job.error = "Could not start the scan worker: {0}".format(exc)
            job.finishedAt = time.time()
        return job

    def _run(self, root, job, entry_ids, workers):
        def update(payload):
            job.progress = dict(payload)

        try:
            result = _module(root, "scan").scan_catalog(
                root, entry_ids, cancel=job.cancel, progress_callback=update, workers=workers
            )
            job.result = result
            job.progress = result["progress"]
            job.state = "cancelled" if result["cancelled"] else "done"
        except Exception as exc:  # the job must answer, never hang in "running"
            job.state = "failed"
            job.error = "{0}: {1}".format(type(exc).__name__, exc)
        finally:
            job.finishedAt = time.time()

    def get(self, job_id):
        with self.lock:
            return self.jobs.get(job_id)

    def list(self):
        with self.lock:
            return [
                job.to_dict()
                for job in sorted(self.jobs.values(), key=lambda j: j.startedAt, reverse=True)
            ]

    def cancel(self, job_id):
        with self.lock:
            job = self.jobs.get(job_id)
            if job is None:
                return None
            job.cancel.set()
            return job

    def _prune_locked(self):
        finished = sorted(
            (j for j in self.jobs.values() if j.state != "running"),
            key=lambda j: j.startedAt,
        )
        for old in finished[:-MAX_JOBS]:
            self.jobs.pop(old.id, None)


#: One store per console process; the handler instances are per-request.
JOBS = ScanJobStore()


class CleanupAPI:
    # @lat: [[cleanup-lab#Console API]]
    def __init__(self, root):
        self.root = os.path.realpath(root)

    def get(self, path, query):
        if path == "/api/cleanup/status":
            _query(query)
            return _module(self.root, "readiness").probe(self.root)
        if path == "/api/cleanup/catalog":
            _query(query)
            catalog = _module(self.root, "catalog")
            try:
                return catalog.report(self.root)
            except catalog.CatalogError as exc:
                raise CleanupError(500, "The detector catalog is invalid: {0}".format(exc)) from exc
        if path == "/api/cleanup/jobs":
            _query(query)
            return {"jobs": JOBS.list()}
        if path.startswith("/api/cleanup/jobs/"):
            _query(query)
            parts = path.strip("/").split("/")
            if len(parts) == 4 and parts[:3] == ["api", "cleanup", "jobs"]:
                job = JOBS.get(parts[3])
                if job is None:
                    raise CleanupError(404, "Job not found")
                return job.to_dict()
            raise CleanupError(404, "Cleanup Lab endpoint not found")
        raise CleanupError(404, "Cleanup Lab endpoint not found")

    def post(self, path, body):
        """The typed POST surface: start a scan, cancel a job. Nothing else."""
        if path == "/api/cleanup/scan":
            if not isinstance(body, dict):
                raise CleanupError(400, "Expected a JSON object")
            unknown = set(body) - set(SCAN_KEYS)
            if unknown:
                raise CleanupError(400, "Unexpected key(s): {0}".format(", ".join(sorted(unknown))))
            return JOBS.start(self.root, body)
        parts = path.strip("/").split("/")
        if len(parts) == 5 and parts[:3] == ["api", "cleanup", "jobs"] and parts[4] == "cancel":
            if body:
                raise CleanupError(400, "A cancel request carries no body")
            job = JOBS.cancel(parts[3])
            if job is None:
                raise CleanupError(404, "Job not found")
            return job.to_dict()
        raise CleanupError(404, "Cleanup Lab endpoint not found")
