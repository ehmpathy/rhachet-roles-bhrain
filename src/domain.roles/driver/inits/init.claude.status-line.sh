#!/usr/bin/env bash
######################################################################
# .what = bind the driver status line into the repo's Claude settings
#
# .why  = the driver role pins the current stone (🗿 <stone>) at the
#         bottom of the session, so observers glance at the step.
#
#         the target is the file rhachet derives every actor from:
#           • split layout (rhachet >=1.49) → .claude/settings.of.repo.json
#             - .claude links to the repo actor's brain dir; settings.json
#               there is an arrow to the grove settings layer, which rhachet replaces on
#               each enroll — a write there vanishes in silence
#             - each other actor's settings.of.repo.json is derived whole
#               from this file on its enroll, and on `rhx init --hooks`,
#               so the bind reaches every actor derived from this one
#             - bound only when the repo actor holds driver — read at the
#               linked role dir, the source rhachet derives that actor from;
#               our own line is taken back once driver is unlinked
#           • old layout (no split) → .claude/settings.json, as before
#
#         .note = the derivation copies the line to every peer actor, driver
#                 or not — an accepted leak, until rhachet renders a role's
#                 status line per actor (a reseed dream on the route)
#
# .how  = loads the block from init.claude.status-line.jsonc and uses
#         jq to merge it into the target
#         (mirrors the ehmpathy init.claude.permissions.sh mechanism)
#
# guarantee:
#   ✔ writes the derivation source, never an arrow rhachet replaces
#   ✔ never fails `rhx init` / `rhx upgrade` on a state a human must fix:
#     a linked target, malformed json, or an absent config each print a
#     warn with the fix, and exit 0 with no write
#   ✔ a genuine malfunction (jq fault) still exits 1, loud
#   ✔ skips a human's own statusLine — in the target, or the grove settings layer
#     on this machine (the target is committed; a teammate's grove is theirs to read)
#   ✔ preserves other settings (hooks, permissions, other configs)
#   ✔ idempotent: safe to rerun
######################################################################

set -euo pipefail

# fail loud: print what failed
trap 'echo "💥 MalfunctionError: init.claude.status-line.sh failed at line $LINENO" >&2' ERR

GITROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$GITROOT/.claude"

# pick the target by layout: the split layout makes settings.json an arrow
# (or seeds settings.of.repo.json), and its one real file is the derivation source
IS_SPLIT_LAYOUT=false
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [[ -L "$CLAUDE_DIR/settings.json" || -e "$CLAUDE_DIR/settings.of.repo.json" ]]; then
  IS_SPLIT_LAYOUT=true
  SETTINGS_FILE="$CLAUDE_DIR/settings.of.repo.json"
fi
SETTINGS_REL="${SETTINGS_FILE#"$GITROOT/"}"

# the grove settings layer (rhachet's settings.of.grove.json): the human's own claude
# settings, read at its source (never via the brain dir)
GROVE_FILE="$HOME/.claude/settings.json"

# find the status-line config file (relative to this init)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATUS_LINE_FILE="$SCRIPT_DIR/init.claude.status-line.jsonc"

# warn-and-pass: a state a human must fix never fails the init run as a whole.
# the warn rides stderr so the harness surfaces it; exit 0 so `rhx init` and
# `rhx upgrade` carry on with every other init
#   usage: warn_not_configured reason="..." fix="..."
warn_not_configured() {
  local reason="" fix=""
  local "$@"
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.status-line" >&2
  echo "   ├─ status = not configured" >&2
  echo "   ├─ reason = $reason" >&2
  echo "   ├─ settings = $SETTINGS_REL" >&2
  echo "   └─ fix: $fix" >&2
  exit 0
}

# verify status-line config file exists
if [[ ! -f "$STATUS_LINE_FILE" ]]; then
  warn_not_configured \
    reason="status-line config not found: $STATUS_LINE_FILE" \
    fix="reinstall rhachet-roles-bhrain, then rerun the init"
fi

# refuse a linked target: a write through it would land wherever it points
if [[ -L "$SETTINGS_FILE" ]]; then
  warn_not_configured \
    reason="the settings target is a link to $(readlink "$SETTINGS_FILE"), so the init will not write through it" \
    fix="replace the link with a real file, then rerun the init"
fi

# ownership of a statusLine command: ours names the route renderer
# .note = ownership is detected by a literal match on two strings that live in TS:
#         - 'routeStatusLine' = the fn exported by src/contract/cli/route.ts
#         - 'route.status.line' = the skill slug
#         if either is renamed in TS, edit these literals too — else the init would
#         treat its own config as a human's and no longer update it (a quiet
#         regression, not a crash). an accepted v1 tradeoff; a structural marker
#         would need the renderer to emit a machine-readable owner tag.
is_ours_command() {
  local command="$1"
  [[ "$command" == *"routeStatusLine"* || "$command" == *"route.status.line"* ]]
}
is_foreign_command() {
  local command="$1"
  [[ -n "$command" ]] && ! is_ours_command "$command"
}

# takes our line back out of the target, with a backup, and reports it
remove_our_line() {
  local tmp backup
  tmp="$(mktemp "${SETTINGS_FILE}.XXXXXX")"
  jq 'del(.statusLine)' "$SETTINGS_FILE" > "$tmp"
  backup="${SETTINGS_FILE%.json}.$(date -u +"%Y-%m-%dT%H-%M-%SZ").$$.bak.json"
  cp "$SETTINGS_FILE" "$backup"
  mv "$tmp" "$SETTINGS_FILE"
  echo "🦉 as leaves fall"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = removed"
  echo "   ├─ reason = driver is not linked, so the repo actor does not carry it and the route status line goes"
  echo "   ├─ settings = $SETTINGS_REL"
  echo "   ├─ backup = ${backup#"$GITROOT/"}"
  echo "   ├─ takes effect = at each rhx enroll session's next start; a live session keeps its old settings"
  echo "   └─ peer actors = derived at each one's next rhx enroll, or the next rhx init --hooks"
  exit 0
}

# reports a skip: the repo actor lacks driver, and the target holds no line of ours
skip_for_no_driver() {
  echo "🦉 as leaves fall"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = skipped"
  echo "   ├─ reason = driver is not linked, so the repo actor does not carry it"
  echo "   ├─ settings = $SETTINGS_REL"
  echo "   └─ fix: to bind the route status line, link driver: rhx init --roles driver"
  exit 0
}

# the split layout binds only a repo actor enrolled with driver
# - the repo actor holds the ambient roles, and rhachet derives those from the linked
#   roles; so driver is ambient exactly when its role dir is linked under .agent/
# - read at that source, never the actor's actor.json: rhachet rewrites that record only
#   on a clone enroll, so at `rhx init --roles driver` it still lists the roles from before
#   the link, and a gate on it would skip the very init that links driver
if [[ "$IS_SPLIT_LAYOUT" == "true" ]]; then
  # a line this init wrote while the actor carried driver is ours to take back:
  # else it rides on to every derived actor, which is what the gate forbids
  COMMAND_HELD=""
  if [[ -f "$SETTINGS_FILE" ]]; then
    COMMAND_HELD="$(jq -r '.statusLine.command // empty' "$SETTINGS_FILE" 2>/dev/null || true)"
  fi
  # one decision: no driver → take back our line if held, else skip
  if [[ ! -e "$GITROOT/.agent/repo=bhrain/role=driver" ]]; then
    if is_ours_command "$COMMAND_HELD"; then remove_our_line; fi
    skip_for_no_driver
  fi
fi

# load and parse JSONC (strip comments before jq parse)
# - grep removes standalone // comment lines
# - sed removes // comments only when preceded by whitespace
#   this preserves :// in strings like 'name://foo' or a url
STATUS_LINE_CONFIG="$(grep -v '^\s*//' "$STATUS_LINE_FILE" | sed 's|[[:space:]]//.*||' | jq -c '.')"

# a config with no statusLine key would merge a null into the target; warn rather than write it
if ! jq -e 'has("statusLine") and (.statusLine | type == "object")' <<< "$STATUS_LINE_CONFIG" > /dev/null; then
  warn_not_configured \
    reason="the status-line config holds no statusLine object: $STATUS_LINE_FILE" \
    fix="reinstall rhachet-roles-bhrain, then rerun the init"
fi

# ensure .claude directory exists, and seed the target if absent
mkdir -p "$CLAUDE_DIR"
SEEDED="false"
if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo "{}" > "$SETTINGS_FILE"
  SEEDED="true"
fi

# refuse a target that is not a json object: a merge would fail mid-way, or clobber it
# (valid json such as [] or 1 passes a bare parse, then faults the key read below)
if ! jq empty "$SETTINGS_FILE" >/dev/null 2>&1; then
  warn_not_configured \
    reason="the settings target is not valid json" \
    fix="repair the json in that file, then rerun the init"
fi
if ! jq -e 'type == "object"' "$SETTINGS_FILE" >/dev/null 2>&1; then
  warn_not_configured \
    reason="the settings target is valid json, but not an object" \
    fix="make the file one json object, then rerun the init"
fi

# skip-and-warn: never clobber nor hide a human's own statusLine
# - a statusLine whose command names neither 'routeStatusLine' nor 'route.status.line'
#   is the human's own. the target is checked, and so is the grove settings layer: a
#   clone loads the target at the --settings rank, which outranks that layer, so ours
#   would hide theirs
# - a statusLine that DOES name our renderer is ours (any prior form): fall through
# - an unreadable grove settings layer is the human's file to repair, never a reason to fail the init
#   usage: skip_for_foreign layer="..." file="..." command="..."
skip_for_foreign() {
  local layer="" file="" command=""
  local "$@"
  echo "🦉 as leaves fall"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = skipped"
  echo "   ├─ reason = a statusLine you set already exists; left intact to avoid a clobber"
  echo "   ├─ layer = $layer"
  echo "   ├─ settings = $file"
  echo "   ├─ yours = $command"
  echo "   └─ fix: to use the route status line, remove yours from that file, then rerun the init"
  exit 0
}
COMMAND_IN_TARGET="$(jq -r '.statusLine.command // empty' "$SETTINGS_FILE")"
if is_foreign_command "$COMMAND_IN_TARGET"; then
  skip_for_foreign layer="repo" file="$SETTINGS_REL" command="$COMMAND_IN_TARGET"
fi
if [[ -f "$GROVE_FILE" && ! "$GROVE_FILE" -ef "$SETTINGS_FILE" ]]; then
  COMMAND_IN_GROVE="$(jq -r '.statusLine.command // empty' "$GROVE_FILE" 2>/dev/null || true)"
  if is_foreign_command "$COMMAND_IN_GROVE"; then
    skip_for_foreign layer="grove" file="~/.claude/settings.json" command="$COMMAND_IN_GROVE"
  fi
fi

# the reach note: a clone of a peer actor reads its own derived file, so it sees the
# bind only at its next enroll or the next `rhx init --hooks`. compared by identity,
# since CLAUDE_CONFIG_DIR may name the brain dir by its real path
has_reach_note() {
  local config_dir="${CLAUDE_CONFIG_DIR:-}"
  config_dir="${config_dir%/}"
  [[ -n "$config_dir" && ! "$config_dir" -ef "$CLAUDE_DIR" ]]
}
print_reach_note() {
  has_reach_note || return 0
  local config_dir="${CLAUDE_CONFIG_DIR%/}"
  # GITROOT is a real path; a config dir reached through a link must be too, or the
  # prefix strip misses and the leaf prints an absolute path
  config_dir="$(cd "$config_dir" 2>/dev/null && pwd -P || echo "$config_dir")"
  echo "   └─ reach"
  echo "      ├─ this session = ${config_dir#"$GITROOT/"}"
  echo "      └─ picks it up at its next rhx enroll, or the next rhx init --hooks"
}

# the last leaf of each tree is `└─` unless the reach note follows it
LAST_GLYPH="└─"
if has_reach_note; then LAST_GLYPH="├─"; fi

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
# .note = the `||` holds the capture: an ERR trap fires on a nonzero exit even under
#         `set +e`, so a bare capture would print a false "failed" on every change
JQ_COMPARE_EXIT=0
jq -e --slurpfile before "$SETTINGS_FILE" --slurpfile after "$SETTINGS_TMP" \
  -n '$before[0].statusLine == $after[0].statusLine' >/dev/null \
  || JQ_COMPARE_EXIT=$?

# jq error (exit >1) → fail fast and loud, never swallow (no failhide)
if [[ $JQ_COMPARE_EXIT -gt 1 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "💥 MalfunctionError: jq failed to compare settings (exit $JQ_COMPARE_EXIT)" >&2
  echo "" >&2
  echo "🗿 init.claude.status-line" >&2
  echo "   ├─ status = malfunction" >&2
  echo "   ├─ settings = $SETTINGS_REL" >&2
  echo "   └─ fix: rerun the init; if it faults again, report the jq exit code above" >&2
  exit 1
fi

# statusLine unchanged (exit 0) → no change needed
if [[ $JQ_COMPARE_EXIT -eq 0 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "🦉 so it is"
  echo ""
  echo "🗿 init.claude.status-line"
  echo "   ├─ status = already configured"
  if [[ "$IS_SPLIT_LAYOUT" == "true" ]]; then
    # a rerun is where a human looks for why a clone shows no line: its derived file lags
    echo "   ├─ settings = $SETTINGS_REL"
    echo "   $LAST_GLYPH peer actors = derived at each one's next rhx enroll, or the next rhx init --hooks"
  else
    echo "   $LAST_GLYPH settings = $SETTINGS_REL"
  fi
  print_reach_note
  exit 0
fi

# statusLine changed (exit 1) → back up first, so a partial failure leaves the prior file;
# a target this run seeded holds naught to keep, so it earns no backup
BACKUP_LEAF="none"
if [[ "$SEEDED" == "false" ]]; then
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  BACKUP_LEAF="${BACKUP_FILE#"$GITROOT/"}"
fi

# atomic replace
mv "$SETTINGS_TMP" "$SETTINGS_FILE"

echo "🦉 the path is clear"
echo ""
echo "🗿 init.claude.status-line"
echo "   ├─ status = configured"
echo "   ├─ settings = $SETTINGS_REL"
echo "   ├─ backup = $BACKUP_LEAF"
if [[ "$IS_SPLIT_LAYOUT" == "true" ]]; then
  # a plain `claude` outside `rhx enroll` reads the grove arrow alone, never the repo layer
  echo "   ├─ takes effect = at each rhx enroll session's next start; a live session keeps its old settings"
  echo "   $LAST_GLYPH peer actors = derived at each one's next rhx enroll, or the next rhx init --hooks"
else
  echo "   $LAST_GLYPH takes effect = at each session's next start; a live session keeps its old settings"
fi
print_reach_note
