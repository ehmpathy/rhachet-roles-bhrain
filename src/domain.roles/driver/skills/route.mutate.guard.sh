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

  fi

  # check for ANY command that names the metadata subdir, or the verdict ledger, whatever its verb
  # .why = a list of write verbs is a denylist a new verb walks past (jq >, node -e, python -c,
  #        dd of=, a cd into the dir). the driver reaches .route/ only through rhx skills, which
  #        take the route and never name the subdir, so to name it is to reach around them.
  #        the match is `.route` as a path segment anywhere — never anchored to the bound route
  #        dir — so a `cd <route> && … .route/passage.jsonl`, a glob, or a bare `cd <route>/.route`
  #        is caught as surely as the full path (r011 i008 blocker.2). a segment starts at the
  #        start, a space, a slash, a quote, `=`, or `:`, and ends at a slash, a space, a quote, or
  #        the end, so a word like `.routes` or `x.route` reads as no segment
  if [[ -z "$MATCH_REASON" ]] && echo "$COMMAND" | grep -qE "(^|[[:space:]/\"'=:])\.route([/[:space:]\"']|$)|fulcrum\.verdicts\.jsonl"; then
    TARGET_PATH=$(echo "$COMMAND" | grep -oE "[^[:space:]\"']*(\.route|fulcrum\.verdicts\.jsonl)[^[:space:]\"']*" | head -n1)
    MATCH_REASON=".route/**"
  fi

else
  # file-based tools (Read/Write/Edit)
  # the harness sends an absolute file_path; the anchored match below reads a repo-relative one,
  # so derive it relative to the gitroot (this hook's cwd), symlinks followed on both sides, and
  # cut a lead `./`. where realpath cannot relativize, cut the cwd prefix as named
  if [[ "$FILE_PATH" == /* ]]; then
    FILE_PATH_RELATIVE=$(realpath -m --relative-to="$(pwd -P)" "$FILE_PATH" 2>/dev/null || echo "")
    FILE_PATH="${FILE_PATH_RELATIVE:-${FILE_PATH#"$PWD"/}}"
  fi
  FILE_PATH="${FILE_PATH#./}"
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
      elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then
        # match metadata subdir only (not routes located at .route/)
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
