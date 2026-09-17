#!/usr/bin/env bash
######################################################################
# .what = a mock reviewer that records its own in-flight window
#
# .why  = concurrency is provable only by OBSERVED overlap. a duration
#         assertion proves naught — a slow machine mimics a serial run and
#         a fast one mimics a concurrent run. so each lane appends its own
#         begin and end, and the test computes max-in-flight from the
#         windows rather than from the clock.
#
# .note = the log is APPENDED, never rewritten, so two lanes that write
#         together interleave lines and neither is lost. this mirrors the
#         meter's own append-only shape.
#
# .note = the clock is read via node rather than `date +%s%N`, because %N
#         is a gnu coreutils extension and prints literally on bsd date.
#         node is present by construction — the harness runs on it.
#
# .note = the HOLD is taken via node for the same reason, never `sleep`. bsd
#         sleep (macos) rejects a fractional argument, so `sleep 0.6` would fail
#         at the FIXTURE on the one platform the note above exists to support —
#         and every concurrency clamp reads its overlap from these windows, so
#         that failure would read as a defect in the feature. raised i002/r1.
#
# usage: mock-window.sh <slug> [hold-seconds]
#
# .note = the hold defaults to 0.6s, which is long enough for a handful of lanes
#         to overlap. a fixture that must observe a WIDE peak passes a longer one,
#         so every admitted lane is still held when the last one begins — else a
#         slow host depresses the peak and a bound-absent arm reads as bounded.
#
# controls, by flag file under .test/:
#   <slug>.pass         emit 0 blockers    (approved)
#   <slug>.constraint   exit 2, 0 blockers (a genuine constraint)
#   <slug>.malfunction  exit 1, no counts  (unreadable — a malfunction)
#   default             emit 1 blocker     (rejected)
######################################################################
set -euo pipefail

SLUG="$1"
HOLD="${2:-0.6}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$SCRIPT_DIR/windows.log"

# stamp BEGAN, hold, then stamp ENDED — all in ONE node process
# .why = node costs ~0.5s to start. a separate process for the hold OR for the
#        ENDED stamp inflates the window by that startup on that side. one
#        process stamps both endpoints from the same clock, so the window is
#        symmetric — start and end each exact — and the overlap a clamp reads is
#        neither inflated nor depressed by process startup. a prior form stamped
#        ENDED via a second `node -e` subprocess, which inflated the end side by
#        ~0.5s and could flip the `l3Peak === 1` clamp red intermittently.
# .note = appendFileSync mirrors the `>>` it replaces — one line, appended, so
#         two lanes that write together interleave and neither is lost. node
#         holds the process alive until the timer fires, so ENDED lands after
#         the full hold, exactly as the sequential echo did.
node -e '
  const fs = require("fs");
  const [log, slug, hold] = process.argv.slice(1);
  fs.appendFileSync(log, `BEGAN ${slug} ${Date.now()}\n`);
  setTimeout(() => {
    fs.appendFileSync(log, `ENDED ${slug} ${Date.now()}\n`);
  }, Math.round(Number(hold) * 1000));
' "$LOG" "$SLUG" "$HOLD"

if [[ -f "$SCRIPT_DIR/$SLUG.malfunction" ]]; then
  echo "$SLUG could not produce a verdict (mock)" >&2
  exit 1
fi

if [[ -f "$SCRIPT_DIR/$SLUG.constraint" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "constraint: the api credential for $SLUG is absent"
  exit 2
fi

if [[ -f "$SCRIPT_DIR/$SLUG.pass" ]]; then
  echo "---"
  echo "blockers: 0"
  echo "nitpicks: 0"
  echo "---"
  echo "$SLUG review passed (mock)"
else
  echo "---"
  echo "blockers: 1"
  echo "nitpicks: 0"
  echo "---"
  echo "$SLUG review failed (mock)"
  echo ""
  echo "## blockers"
  echo "- $SLUG blocker: the mock found an issue"
fi
