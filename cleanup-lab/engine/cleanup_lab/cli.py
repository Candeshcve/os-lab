"""`labctl cleanup status|doctor [--json]`.

Both commands read: they print the readiness probe and change nothing. The exit
code follows the lab CLI contract — ``0`` when the engine is ready, ``1`` when it
needs setup or the platform is unsupported, ``2`` for a usage error (argparse).
"""
from __future__ import annotations

import argparse
import json
import sys

from .readiness import probe

USAGE_EXIT = 2


def _colour(text, code, stream):
    if not getattr(stream, "isatty", lambda: False)():
        return text
    return "{0}{1}\033[0m".format(code, text)


def _mark(found, stream):
    if found:
        return _colour("[ok]", "\033[32m", stream)
    return _colour("[--]", "\033[31m", stream)


def _status_lines(report, stream):
    engine = report["engine"]
    lines = [
        "Cleanup Lab {0} · {1} · {2}".format(engine["version"], report["platform"]["label"], report["state"]),
    ]
    for item in report["requirements"]:
        lines.append(
            "  {0} {1:<32} {2}".format(_mark(item["found"], stream), item["label"], item["detail"])
        )
    lines.append("")
    lines.append("Capabilities:")
    for item in report["capabilities"]:
        lines.append(
            "  {0} {1:<32} {2}".format(_mark(item["found"], stream), item["label"], item["detail"])
        )
    if report["reasons"]:
        lines.append("")
        lines.append("What to fix:")
        lines.extend("  - {0}".format(reason) for reason in report["reasons"])
    return lines


def _doctor_lines(report, stream):
    lines = _status_lines(report, stream)
    lines.append("")
    lines.append("Paths:")
    lines.append("  home        {0}".format(report["home"]))
    lines.append("  state       {0}".format(report["stateDir"]))
    lines.append("")
    lines.append("Hints:")
    for item in report["requirements"]:
        if not item["found"]:
            lines.append("  {0}: {1}".format(item["label"], item["hint"]))
    readiness = {
        "ready": "The engine can scan and plan on this computer.",
        "needs-setup": "The engine is installed but something it needs is missing.",
        "unavailable": "This operating system is not supported by Cleanup Lab.",
    }[report["state"]]
    lines.append("  {0}".format(readiness))
    return lines


def build_parser():
    parser = argparse.ArgumentParser(
        prog="labctl cleanup",
        description="Cleanup Lab: inspect readiness (read-only) and, from CLN-19, scan/plan/clean.",
    )
    sub = parser.add_subparsers(dest="command", metavar="status|doctor")
    for name, text in (
        ("status", "one-screen readiness summary"),
        ("doctor", "every check, path and hint"),
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
    report = probe()
    if args.json:
        stream.write(json.dumps(report, indent=2) + "\n")
    else:
        lines = _status_lines(report, stream) if args.command == "status" else _doctor_lines(report, stream)
        stream.write("\n".join(lines) + "\n")
    return 0 if report["state"] == "ready" else 1


if __name__ == "__main__":  # pragma: no cover - exercised through labctl
    sys.exit(main())
