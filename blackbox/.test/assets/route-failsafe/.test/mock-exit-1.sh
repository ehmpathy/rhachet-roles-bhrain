#!/usr/bin/env bash
# reviewer that malfunctions (exit 1)
echo "stdout: reviewer crashed unexpectedly"
echo "stderr: ERROR: fatal crash" >&2
exit 1
