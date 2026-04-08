#!/usr/bin/env bash
######################################################################
# .what = bind achiever hooks to Claude settings
#
# .why  = the achiever role needs UserPromptSubmit hook to accumulate
#         asks as they arrive. rhachet's Role.build() hooks abstraction
#         only supports onBoot, onTool, onStop — not onTalk.
#
#         this init adds the UserPromptSubmit hook directly to
#         .claude/settings.json, bypasses the rhachet abstraction.
#
# .how  = uses jq to add UserPromptSubmit hook if not already present
#         the hook runs userpromptsubmit.ontalk.sh on each user message
#
# guarantee:
#   ✔ creates .claude/settings.json if absent
#   ✔ preserves extant settings (other hooks, permissions)
#   ✔ idempotent: safe to rerun (checks for extant hook)
#   ✔ fail-fast on errors
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.claude.hooks.sh failed at line $LINENO" >&2' ERR

PROJECT_ROOT="$(git rev-parse --show-toplevel)"
SETTINGS_FILE="$PROJECT_ROOT/.claude/settings.json"

# hook command (relative to project root)
# use rhachet run --init to execute the hook
HOOK_COMMAND="./node_modules/.bin/rhachet run --repo bhrain --role achiever --init claude.hooks/userpromptsubmit.ontalk"
HOOK_AUTHOR="repo=bhrain/role=achiever"

# ensure .claude directory exists
mkdir -p "$(dirname "$SETTINGS_FILE")"

# initialize settings file if it doesn't exist
if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo "{}" > "$SETTINGS_FILE"
fi

# check if hook already exists
HOOK_EXISTS=$(jq --arg cmd "$HOOK_COMMAND" '
  (.hooks.UserPromptSubmit // [])
  | map(.hooks // [])
  | flatten
  | map(select(.command == $cmd))
  | length > 0
' "$SETTINGS_FILE")

if [[ "$HOOK_EXISTS" == "true" ]]; then
  echo "👌 achiever UserPromptSubmit hook already configured"
  echo "   ${SETTINGS_FILE#"$PROJECT_ROOT/"}"
  exit 0
fi

# add the UserPromptSubmit hook
# structure: hooks.UserPromptSubmit[] = { matcher, hooks[] }
jq --arg cmd "$HOOK_COMMAND" --arg author "$HOOK_AUTHOR" '
  # ensure .hooks exists
  .hooks //= {} |

  # ensure .hooks.UserPromptSubmit exists
  .hooks.UserPromptSubmit //= [] |

  # check if matcher "*" entry exists
  if (.hooks.UserPromptSubmit | map(select(.matcher == "*")) | length > 0)
  then
    # append to extant "*" matcher
    .hooks.UserPromptSubmit |= map(
      if .matcher == "*"
      then .hooks += [{
        "type": "command",
        "command": $cmd,
        "timeout": 5,
        "author": $author
      }]
      else .
      end
    )
  else
    # create new "*" matcher entry
    .hooks.UserPromptSubmit += [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": $cmd,
        "timeout": 5,
        "author": $author
      }]
    }]
  end
' "$SETTINGS_FILE" > "$SETTINGS_FILE.tmp"

# atomic replace
mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"

echo "🔮 achiever UserPromptSubmit hook configured!"
echo "   ${SETTINGS_FILE#"$PROJECT_ROOT/"}"
echo ""
echo "✨ hook added:"
echo "   • event: UserPromptSubmit"
echo "   • command: $HOOK_COMMAND"
echo "   • timeout: 5s"
