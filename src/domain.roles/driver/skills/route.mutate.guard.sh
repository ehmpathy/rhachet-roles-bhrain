#!/usr/bin/env bash
######################################################################
# .what = pretooluse hook to protect route stones, guards, and metadata
#
# .why = prevents drivers from:
#        - peeking ahead at future stones (defeats bounded focus)
#        - reading guard files (enables gaming review criteria)
#        - mutating passage.jsonl directly (bypasses proper flow)
#
# usage:
#   configured as PreToolUse hook via getDriverRole.ts
#   reads tool input from stdin JSON
#
# exit codes:
#   0 = allowed (not protected, or has privilege)
#   2 = blocked (protected path, no privilege)
#
# protected patterns:
#   - *.stone (instructions)
#   - *.guard (review criteria)
#   - .route/** (metadata, passage)
#
# privilege:
#   human can grant via: rhx route.mutate grant allow
#   creates flag at: $route/.route/.privilege.mutate.flag
######################################################################
set -euo pipefail

# source output functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/route.mutate.guard.output.sh"

######################################################################
# parse stdin
######################################################################

# read JSON from stdin
STDIN_INPUT=$(cat)

# failfast: if no input, allow (edge case)
if [[ -z "$STDIN_INPUT" ]]; then
  exit 0
fi

# extract tool name
TOOL_NAME=$(echo "$STDIN_INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo "")

# skip if not relevant tool
if [[ "$TOOL_NAME" != "Read" && "$TOOL_NAME" != "Write" && "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

# extract file path (for Read/Write/Edit)
FILE_PATH=$(echo "$STDIN_INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

# extract command (for Bash)
COMMAND=$(echo "$STDIN_INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

######################################################################
# find bound route for current branch
######################################################################

# get current branch
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
if [[ -z "$BRANCH" ]]; then
  exit 0
fi

# sanitize branch name (same as sanitizeBranchName.ts)
# replace / with ., other unsafe chars with -, collapse multiples, trim edges
BRANCH_FLAT=$(echo "$BRANCH" | sed -E \
  -e 's|/|.|g' \
  -e 's|[^a-zA-Z0-9._-]|-|g' \
  -e 's|([._-])\1+|\1|g' \
  -e 's|^[._-]+||' \
  -e 's|[._-]+$||')

# find bind flag for this branch (exclude node_modules)
BIND_FLAG=$(find . -path ./node_modules -prune -o -name ".bind.${BRANCH_FLAT}.flag" -type f -print 2>/dev/null | grep '\.route/\.bind\.' | head -n1 || echo "")

# if no bound route for this branch, allow all
if [[ -z "$BIND_FLAG" ]]; then
  exit 0
fi

# derive route path: flag is at $route/.route/.bind.*.flag
ROUTE_DIR=$(dirname "$(dirname "$BIND_FLAG")")
ROUTE_DIR="${ROUTE_DIR#./}"

######################################################################
# check privilege
######################################################################

PRIVILEGE_FLAG="$ROUTE_DIR/.route/.privilege.mutate.flag"
if [[ -f "$PRIVILEGE_FLAG" ]]; then
  # privilege granted, allow all operations on this route
  exit 0
fi

######################################################################
# evaluate protection
######################################################################

TARGET_PATH=""
MATCH_REASON=""

if [[ "$TOOL_NAME" == "Bash" && -n "$COMMAND" ]]; then
  # check if command accesses protected path patterns
  # read commands: cat, head, tail, less, more, bat
  # write commands: echo >, printf >, tee, sed -i

  # check for read commands on protected patterns within route
  if echo "$COMMAND" | grep -qE "(cat|head|tail|less|more|bat)\s"; then
    # check for .stone files
    if echo "$COMMAND" | grep -qE "\.stone(\s|$|\"|\')"; then
      if echo "$COMMAND" | grep -q "$ROUTE_DIR"; then
        TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^ \"']+\.stone" | head -n1)
        MATCH_REASON="*.stone"
      fi
    fi

    # check for .guard files
    if [[ -z "$MATCH_REASON" ]] && echo "$COMMAND" | grep -qE "\.guard(\s|$|\"|\')"; then
      if echo "$COMMAND" | grep -q "$ROUTE_DIR"; then
        TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^ \"']+\.guard" | head -n1)
        MATCH_REASON="*.guard"
      fi
    fi

    # check for .route/ paths
    if [[ -z "$MATCH_REASON" ]] && echo "$COMMAND" | grep -qE "\.route/"; then
      if echo "$COMMAND" | grep -q "$ROUTE_DIR"; then
        TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^ \"']+\.route/[^ \"']*" | head -n1)
        MATCH_REASON=".route/**"
      fi
    fi
  fi

  # check for write commands on protected patterns
  if [[ -z "$MATCH_REASON" ]] && echo "$COMMAND" | grep -qE "(echo.*>|printf.*>|tee|sed\s+-i)"; then
    if echo "$COMMAND" | grep -qE "\.route/"; then
      if echo "$COMMAND" | grep -q "$ROUTE_DIR"; then
        TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^ \"']+\.route/[^ \"']*" | head -n1)
        MATCH_REASON=".route/**"
      fi
    fi
  fi

else
  # file-based tools (Read/Write/Edit)
  if [[ -n "$FILE_PATH" ]]; then
    # check if file is within bound route
    if echo "$FILE_PATH" | grep -q "$ROUTE_DIR"; then
      # check protected patterns
      if echo "$FILE_PATH" | grep -qE "\.stone$"; then
        TARGET_PATH="$FILE_PATH"
        MATCH_REASON="*.stone"
      elif echo "$FILE_PATH" | grep -qE "\.guard$"; then
        TARGET_PATH="$FILE_PATH"
        MATCH_REASON="*.guard"
      elif echo "$FILE_PATH" | grep -qE "\.route/"; then
        TARGET_PATH="$FILE_PATH"
        MATCH_REASON=".route/**"
      fi
    fi
  fi
fi

######################################################################
# allow if not protected
######################################################################

if [[ -z "$MATCH_REASON" ]]; then
  exit 0
fi

######################################################################
# block: log event and print message
######################################################################

# log to guardrail events (no timestamp, deterministic for git)
EVENTS_FILE="$ROUTE_DIR/.route/.guardrail.events.jsonl"

# ensure .route dir exists (it should, since we found bind flag)
if [[ -d "$ROUTE_DIR/.route" ]]; then
  if [[ "$TOOL_NAME" == "Bash" ]]; then
    echo "{\"tool\":\"Bash\",\"command\":\"$(echo "$COMMAND" | head -c 100 | sed 's/"/\\"/g')\",\"verdict\":\"blocked\",\"reason\":\"$MATCH_REASON\"}" >> "$EVENTS_FILE"
  else
    echo "{\"tool\":\"$TOOL_NAME\",\"path\":\"$TARGET_PATH\",\"verdict\":\"blocked\",\"reason\":\"$MATCH_REASON\"}" >> "$EVENTS_FILE"
  fi
fi

# print block message to stderr (claude shows this to the agent)
{
  echo ""
  print_block_message "$ROUTE_DIR" "$TARGET_PATH"
  echo ""
} >&2

exit 2
