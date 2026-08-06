#!/usr/bin/env bash
# judge that malfunctions (exit 1)
echo "stdout: judge crashed unexpectedly"
echo "stderr: FATAL: judge process failed" >&2
exit 1
