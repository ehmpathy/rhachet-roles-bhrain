#!/usr/bin/env bash
######################################################################
# .what = pretooluse hook to block route.stone.set in background mode
#
# .why = route.stone.set drives an interactive guard loop — self-reviews,
#        blockers, next-stone guidance — that the driver must consume live.
#        a background call plus file-poll breaks that loop and wastes tokens.
#        so route.stone.set must only ever run in the foreground.
#
# .how = reads tool input json from stdin, checks:
#        1. tool_name is "Bash"
#        2. tool_input.run_in_background is true
#        3. tool_input.command invokes route.stone.set
#        blocks (exit 2) with owl guidance when all three hold.
#
# usage:
#   configured as PreToolUse hook via getDriverRole.ts
#   reads tool input from stdin json
#
# exit codes:
#   0 = allowed (not a backgrounded route.stone.set)
#   2 = blocked (backgrounded route.stone.set)
######################################################################
set -euo pipefail

# source output functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/route.foreground.guard.output.sh"

# fail loud if jq is not available — the guard cannot parse stdin without it.
# a silent bypass here would let backgrounded route.stone.set slip through
# undetected, so we halt (exit 2) rather than allow-by-default.
if ! command -v jq >/dev/null 2>&1; then
  echo "🦉 route.foreground guard: jq is required but not available — cannot parse tool input" >&2
  exit 2
fi

######################################################################
# parse stdin
######################################################################

# read json from stdin
STDIN_INPUT=$(cat)

# allow if no input (edge case)
if [[ -z "$STDIN_INPUT" ]]; then
  exit 0
fi

# extract tool name.
# note: `// empty` yields "" for a legitimately absent field (fail-open, intended);
# a jq parse failure (malformed json) is a real fault, so we fail loud rather than swallow it.
TOOL_NAME=$(echo "$STDIN_INPUT" | jq -r '.tool_name // empty') || {
  echo "🦉 route.foreground guard: failed to parse tool_name from tool input json" >&2
  exit 1
}

# skip if not the Bash tool
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

# extract run_in_background flag (parse fault fails loud; absent field defaults to false)
RUN_IN_BACKGROUND=$(echo "$STDIN_INPUT" | jq -r '.tool_input.run_in_background // false') || {
  echo "🦉 route.foreground guard: failed to parse run_in_background from tool input json" >&2
  exit 1
}

# skip if not background mode
if [[ "$RUN_IN_BACKGROUND" != "true" ]]; then
  exit 0
fi

# extract command (parse fault fails loud; absent field defaults to empty)
COMMAND=$(echo "$STDIN_INPUT" | jq -r '.tool_input.command // empty') || {
  echo "🦉 route.foreground guard: failed to parse command from tool input json" >&2
  exit 1
}

# skip if empty command
if [[ -z "$COMMAND" ]]; then
  exit 0
fi

######################################################################
# match route.stone.set across the three invocation forms
######################################################################

IS_STONE_SET=false

# form 1: rhx route.stone.set
if [[ "$COMMAND" =~ (^|[[:space:]])rhx[[:space:]]+route\.stone\.set([[:space:]]|$) ]]; then
  IS_STONE_SET=true
fi

# form 2: npx rhachet run --skill route.stone.set
if [[ "$COMMAND" =~ npx[[:space:]]+rhachet[[:space:]]+run[[:space:]].*--skill[[:space:]]+route\.stone\.set([[:space:]]|$) ]]; then
  IS_STONE_SET=true
fi

# form 3: ./node_modules/.bin/rhx route.stone.set
# anchored to node_modules/.bin/rhx so an unrelated path like other/bin/rhx
# does not falsely match — the vision names this exact bin path.
if [[ "$COMMAND" =~ node_modules/\.bin/rhx[[:space:]]+route\.stone\.set([[:space:]]|$) ]]; then
  IS_STONE_SET=true
fi

# allow if the command is not route.stone.set
if [[ "$IS_STONE_SET" != "true" ]]; then
  exit 0
fi

######################################################################
# block: backgrounded route.stone.set
######################################################################

# print block message to stderr (claude shows this to the agent)
{
  echo ""
  print_block_message
  echo ""
} >&2

exit 2
