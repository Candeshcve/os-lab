import io
import json
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from cleanup_lab import cli  # noqa: E402

READY = {
    "engine": {"name": "cleanup-lab", "version": "0.1.0", "python": "3.12.1", "mode": "stdlib"},
    "state": "ready",
    "platform": {"id": "macos", "label": "macOS", "supported": True},
    "home": "/home/ada",
    "stateDir": "/home/ada/Library/Application Support/os-lab/cleanup",
    "requirements": [
        {"id": "platform", "label": "Supported operating system", "found": True,
         "required": True, "hint": "Runs on macOS, Linux and Windows.", "detail": "macOS"},
    ],
    "capabilities": [
        {"id": "detectors", "label": "Detector catalog", "found": False, "detail": "No detector catalog yet"},
    ],
    "reasons": [],
    "checkedAt": 1.0,
}


class CliTest(unittest.TestCase):
    def run_cli(self, argv, report=None):
        stream = io.StringIO()
        with mock.patch.object(cli, "probe", return_value=report or READY):
            code = cli.main(argv, stream=stream)
        return code, stream.getvalue()

    def test_status_exit_codes_follow_the_state(self):
        self.assertEqual(self.run_cli(["status"])[0], 0)
        needs_setup = dict(READY, state="needs-setup", reasons=["Set OSLAB_CLEANUP_STATE to a writable folder."])
        code, text = self.run_cli(["status"], needs_setup)
        self.assertEqual(code, 1)
        self.assertIn("What to fix:", text)
        self.assertIn("Set OSLAB_CLEANUP_STATE", text)

    def test_json_is_machine_readable(self):
        code, text = self.run_cli(["doctor", "--json"])
        self.assertEqual(code, 0)
        self.assertEqual(json.loads(text)["state"], "ready")

    def test_doctor_lists_paths_and_hints(self):
        code, text = self.run_cli(["doctor"])
        self.assertEqual(code, 0)
        self.assertIn("Paths:", text)
        self.assertIn("/home/ada", text)
        self.assertIn("Hints:", text)

    def test_unknown_subcommand_is_a_usage_error(self):
        stream = io.StringIO()
        with mock.patch.object(cli, "probe") as probe, mock.patch("sys.stderr", stream):
            with self.assertRaises(SystemExit) as raised:
                cli.main(["scan"], stream=io.StringIO())
        self.assertEqual(raised.exception.code, 2)
        probe.assert_not_called()

    def test_no_subcommand_prints_help_and_returns_usage(self):
        stream = io.StringIO()
        with mock.patch.object(cli, "probe") as probe:
            code = cli.main([], stream=stream)
        self.assertEqual(code, 2)
        self.assertIn("status|doctor", stream.getvalue())
        probe.assert_not_called()


if __name__ == "__main__":
    unittest.main()
