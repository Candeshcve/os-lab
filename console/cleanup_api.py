"""Cleanup Lab HTTP contracts (``/api/cleanup/...``).

The console accepts typed, validated calls only: never a command string and never
a free-form path list from the page (``cleanup-lab/README.md``). This task exposes
readiness; the scan job (CLN-03), the plan → clean flow (CLN-13), history
(CLN-15) and the remaining endpoints add their own actions here, each validated
again by the engine's safety guard.

The engine is imported from ``cleanup-lab/engine`` (``cleanup_lab``), which is a
plain standard-library package: the console does not install it.
"""
from __future__ import annotations

import os
import sys


class CleanupError(ValueError):
    """A request the Cleanup Lab refused, with the HTTP status to answer."""

    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def _readiness(root):
    engine = os.path.join(root, "cleanup-lab", "engine")
    if engine not in sys.path:
        sys.path.insert(0, engine)
    try:
        from cleanup_lab import readiness
    except ImportError as exc:  # a lone console copy without the engine
        raise CleanupError(501, "The cleanup engine (cleanup-lab/engine) is not installed") from exc
    return readiness


def _query(query):
    """Reject duplicate or unexpected query parameters instead of guessing."""
    if query:
        raise CleanupError(400, "Unexpected query parameters")


class CleanupAPI:
    # @lat: [[cleanup-lab#Console API]]
    def __init__(self, root):
        self.root = os.path.realpath(root)

    def get(self, path, query):
        if path == "/api/cleanup/status":
            _query(query)
            return _readiness(self.root).probe(self.root)
        raise CleanupError(404, "Cleanup Lab endpoint not found")
