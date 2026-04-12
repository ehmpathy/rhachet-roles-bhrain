#!/usr/bin/env bash
######################################################################
# .what = UserPromptSubmit hook to accumulate asks for goal triage
#
# .why  = proactively accumulates peer input so no ask is forgotten:
#         - captures each message as it arrives
#         - computes content hash for deduplication
#         - appends to asks.inventory.jsonl
#         - does NOT halt brain — just reminds to consider goals
#
# .how  = invokes goal.triage.infer --when hook.onTalk
#         which accumulates the ask and emits a reminder
#
# usage:
#   configure in .claude/settings.json under hooks.UserPromptSubmit
#
# guarantee:
#   ✔ does not halt: always exits 0
#   ✔ accumulates ask to inventory
#   ✔ graceful fallback: exits silently on error
######################################################################

set -euo pipefail

# invoke triage in onTalk mode
# exits 0 regardless of outcome (does not halt)
./node_modules/.bin/rhx goal.triage.infer --when hook.onTalk || true

exit 0
