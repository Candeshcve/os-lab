"""Where the engine's own files live, per operating system.

Pure functions over an ``env`` mapping (``os.environ`` by default), so tests can
pass a generated home tree and never read a real one. Nothing here creates a
directory, moves a file or deletes anything: the readiness probe and the later
history/ledger stores decide for themselves, and only the stores write.

Layout:

===========  ========================================================
macOS        ``~/Library/Application Support/os-lab/cleanup``
Linux        ``$XDG_STATE_HOME/os-lab/cleanup`` (``~/.local/state/...``)
Windows      ``%LOCALAPPDATA%\\os-lab\\cleanup``
===========  ========================================================

``OSLAB_CLEANUP_STATE`` overrides the folder everywhere, which is what the tests
and a portable install use.
"""
from __future__ import annotations

import os
import sys

PLATFORM_BY_SYS = {"darwin": "macos", "linux": "linux", "win32": "windows"}
SUPPORTED_PLATFORMS = ("macos", "linux", "windows")


def platform_id(sys_platform=None):
    """``macos`` / ``linux`` / ``windows`` / ``unsupported`` for a ``sys.platform`` value."""
    value = sys.platform if sys_platform is None else sys_platform
    return PLATFORM_BY_SYS.get(value, "unsupported")


def home_dir(env=None):
    """The user's home folder from ``HOME`` or ``USERPROFILE``."""
    env = os.environ if env is None else env
    for key in ("HOME", "USERPROFILE"):
        value = env.get(key)
        if value:
            return os.path.abspath(value)
    return os.path.expanduser("~")


def state_dir(env=None, platform=None):
    """The private state folder: audit history, ignore rules, schedules, learned profile.

    Never created here. A caller that wants to write checks :func:`is_writable_dir`
    on this path first.
    """
    env = os.environ if env is None else env
    override = env.get("OSLAB_CLEANUP_STATE")
    if override:
        return os.path.abspath(override)
    target = platform or platform_id()
    if target == "windows":
        base = env.get("LOCALAPPDATA") or os.path.join(home_dir(env), "AppData", "Local")
        return os.path.join(base, "os-lab", "cleanup")
    if target == "macos":
        return os.path.join(home_dir(env), "Library", "Application Support", "os-lab", "cleanup")
    base = env.get("XDG_STATE_HOME") or os.path.join(home_dir(env), ".local", "state")
    return os.path.join(base, "os-lab", "cleanup")


def trash_dir(env=None, platform=None):
    """Where this platform's Trash lives, or ``None`` when it is not a folder.

    macOS and Linux use a Trash folder; Windows has the Recycle Bin, which has no
    path the engine may address, so cleaning there asks the shell (CLN-13).
    """
    env = os.environ if env is None else env
    target = platform or platform_id()
    if target == "macos":
        return os.path.join(home_dir(env), ".Trash")
    if target == "linux":
        base = env.get("XDG_DATA_HOME") or os.path.join(home_dir(env), ".local", "share")
        return os.path.join(base, "Trash")
    return None


def nearest_existing(path):
    """The first ancestor of ``path`` that exists, or ``None``."""
    current = os.path.abspath(path)
    while True:
        if os.path.exists(current):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def is_writable_dir(path, env=None):
    """Whether ``path`` (or its nearest existing ancestor) accepts a new entry.

    This is a permission check, not a write: the probe that reports readiness must
    not create the state folder on a machine where the user never cleans anything.
    """
    del env  # kept in the signature so callers can pass the same mapping everywhere
    target = nearest_existing(path)
    if target is None or not os.path.isdir(target):
        return False
    return os.access(target, os.W_OK | os.X_OK)
