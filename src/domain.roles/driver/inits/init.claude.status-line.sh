#!/usr/bin/env bash
######################################################################
# .what = bind the driver status line into Claude settings
#
# .why  = the driver role pins the current stone (🗿 <stone>) at the
#         bottom of the session, so observers glance at the step.
#
#         this init manages the statusLine key in .claude/settings.json:
#           • sets statusLine to our route.status.line renderer
#           • preserves all other keys (hooks, permissions, …)
#           • idempotent: safe to rerun
#
# .how  = loads the block from init.claude.status-line.jsonc and uses
#         jq to merge it into .claude/settings.json
#         (mirrors the ehmpathy init.claude.permissions.sh mechanism)
#
# guarantee:
#   ✔ creates .claude/settings.json if absent
#   ✔ preserves other settings (hooks, permissions, other configs)
#   ✔ sets the statusLine key to our renderer
#   ✔ idempotent: safe to rerun
#   ✔ fail-fast on errors
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "❌ init.claude.status-line.sh failed at line $LINENO" >&2' ERR

GITROOT="$(git rev-parse --show-toplevel)"
SETTINGS_FILE="$GITROOT/.claude/settings.json"

# find the status-line config file (relative to this init)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_LINE_FILE="$SCRIPT_DIR/init.claude.status-line.jsonc"

# verify status-line config file exists
if [[ ! -f "$STATUS_LINE_FILE" ]]; then
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.status-line" >&2
  echo "   ├─ status = blocked" >&2
  echo "   └─ reason = status-line config not found: $STATUS_LINE_FILE" >&2
  exit 2
fi

# load and parse JSONC (strip comments before jq parse)
# - grep removes standalone // comment lines
# - sed removes // comments only when preceded by whitespace
#   this preserves :// in strings like 'name://foo' or a url
STATUS_LINE_CONFIG=$(grep -v '^\s*//' "$STATUS_LINE_FILE" | sed 's|[[:space:]]//.*||' | jq -c '.')

# ensure .claude directory exists
mkdir -p "$(dirname "$SETTINGS_FILE")"

# initialize settings file if absent
if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo "{}" > "$SETTINGS_FILE"
fi

# skip-and-warn: never clobber a human's own statusLine (vision Q2)
# - if a statusLine already exists whose command does NOT reference our renderer
#   (neither 'routeStatusLine' nor 'route.status.line'), it is the human's own —
#   leave it intact and exit 0 with an owl-vibed note
# - a statusLine that DOES reference our renderer is ours (any prior form), so we
#   fall through to update it (e.g. to swap an older command for the current one)
#
# .note = ownership is detected by a literal match on two strings that live in TS:
#         - 'routeStatusLine' = the fn exported by src/contract/cli/route.ts
#         - 'route.status.line' = the skill slug
#         if either is renamed in TS, edit these literals too — else the init would
#         treat its own config as a human's and no longer update it (a quiet
#         regression, not a crash). an accepted v1 tradeoff; a structural marker
#         would need the renderer to emit a machine-readable owner tag.
STATUS_LINE_COMMAND_EXTANT=$(jq -r '.statusLine.command // empty' "$SETTINGS_FILE")
if [[ -n "$STATUS_LINE_COMMAND_EXTANT" ]] \
  && [[ "$STATUS_LINE_COMMAND_EXTANT" != *"routeStatusLine"* ]] \
  && [[ "$STATUS_LINE_COMMAND_EXTANT" != *"route.status.line"* ]]; then
  echo "🦉 as leaves fall"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = skipped"
  echo "   ├─ reason = a statusLine you set already exists; left intact to avoid a clobber"
  echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
  echo "   └─ yours = $STATUS_LINE_COMMAND_EXTANT"
  exit 0
fi

# race-safe temp file: mktemp gives each concurrent run its own unique path,
# so two parallel inits never share one `.tmp` and clobber each other (r7)
SETTINGS_TMP="$(mktemp "${SETTINGS_FILE}.XXXXXX")"

# apply the statusLine key (leaves every other key untouched)
jq --argjson sl "$STATUS_LINE_CONFIG" '
  .statusLine = $sl.statusLine
' "$SETTINGS_FILE" > "$SETTINGS_TMP"

# unique backup name (timestamp + pid) so parallel runs never collide (r7)
TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
BACKUP_FILE="${SETTINGS_FILE%.json}.${TIMESTAMP}.$$.bak.json"

# compare the statusLine key before/after — capture jq's exit code explicitly so a
# genuine jq fault is not hidden (no 2>&1) and does not masquerade as "changed" (r2)
# jq -e exit codes: 0 = equal, 1 = not equal, >1 = error
set +e
jq -e --slurpfile before "$SETTINGS_FILE" --slurpfile after "$SETTINGS_TMP" \
  -n '$before[0].statusLine == $after[0].statusLine' >/dev/null
JQ_COMPARE_EXIT=$?
set -e

# jq error (exit >1) → fail fast and loud, never swallow (no failhide)
if [[ $JQ_COMPARE_EXIT -gt 1 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.status-line" >&2
  echo "   ├─ status = malfunction" >&2
  echo "   └─ reason = jq failed to compare settings (exit $JQ_COMPARE_EXIT)" >&2
  exit 1
fi

# statusLine unchanged (exit 0) → no change needed
if [[ $JQ_COMPARE_EXIT -eq 0 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "🦉 so it is"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = already configured"
  echo "   └─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
  exit 0
fi

# statusLine changed (exit 1) → back up, then apply
# create backup before applying change (guards against partial failures)
cp "$SETTINGS_FILE" "$BACKUP_FILE"

# atomic replace
mv "$SETTINGS_TMP" "$SETTINGS_FILE"

echo "🦉 the path is clear"
echo ""
echo "🗿 init.claude.status-line"
echo "   ├─ status = configured"
echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
echo "   └─ backup = ${BACKUP_FILE#"$GITROOT/"}"
