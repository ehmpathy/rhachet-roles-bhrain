#!/usr/bin/env bash
######################################################################
# .what = initialize Claude settings for achiever role
#
# .why  = achiever needs UserPromptSubmit hook to accumulate asks.
#         this init dispatches to:
#           • init.claude.hooks.sh — configures UserPromptSubmit hook
#
# .how  = runs all init executables in sequence from the same directory.
#
# guarantee:
#   ✔ backs up settings.json before changes (if exists)
#   ✔ runs hooks initialization
#   ✔ fail-fast on any error
#   ✔ idempotent: safe to rerun
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.claude.sh failed at line $LINENO" >&2' ERR

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITROOT="$(git rev-parse --show-toplevel)"
SETTINGS_FILE="$GITROOT/.claude/settings.json"

echo "🔮 init claude config for achiever role..."
echo ""

# backup extant settings before changes
BACKUP_FILE=""
if [[ -f "$SETTINGS_FILE" ]]; then
  ISODATETIME="$(date -u +%Y-%m-%dT%H-%M-%SZ)"
  BACKUP_FILE="$GITROOT/.claude/settings.$ISODATETIME.bak.json"
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
fi

# initialize hooks
"$SCRIPT_DIR/init.claude.hooks.sh"
echo ""

# report backup status
if [[ -n "$BACKUP_FILE" ]]; then
  if diff -q "$SETTINGS_FILE" "$BACKUP_FILE" >/dev/null 2>&1; then
    # no changes - remove backup
    rm "$BACKUP_FILE"
  else
    # changes made - keep backup
    echo "📦 backed up prior settings to: ${BACKUP_FILE#$GITROOT/}"
  fi
fi

echo "👌 claude config ready"
