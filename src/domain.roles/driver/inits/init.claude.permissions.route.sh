#!/usr/bin/env bash
######################################################################
# .what = heal the claude permissions that govern the driver's own `.route/`
#
# .why  = a clone that boots with `.route/**` on the deny list cannot add a
#         stone, emit a yield, or archive a seed — the driver is locked out
#         of the one directory it exists to tend. worse, the same repo also
#         carries `.route/**` on the ALLOW list, so the settings read as
#         permitted while the harness refuses every write (deny wins).
#
#         route protection is not dropped by this heal, it is relocated to
#         where the judgment lives: `rhx route.mutate.guard --mode hook`,
#         which can tell a write to an unpassed stone from a rewrite of a
#         passed one. a path glob cannot make that call.
#
# .how  = loads the owned entries from init.claude.permissions.route.jsonc,
#         strips them from `permissions.deny`, findserts them into
#         `permissions.allow`, and leaves every other entry untouched.
#
#         the target is the file rhachet keeps, as in init.claude.status-line.sh:
#           • split layout (rhachet >=1.49) → .claude/settings.of.repo.json,
#             since settings.json there is an arrow rhachet replaces on enroll
#           • old layout → .claude/settings.json
#
# guarantee:
#   ✔ creates the target if absent
#   ✔ preserves every other permission, hook, and config key
#   ✔ removes ONLY the entries this role declares it owns
#   ✔ idempotent: safe to rerun
#   ✔ never fails `rhx init` / `rhx upgrade` on a state a human must fix:
#     a linked target, malformed json, or an absent config each warn, exit 0
#   ✔ a genuine malfunction (jq fault) still exits 1, loud
######################################################################

set -euo pipefail

trap 'echo "💥 MalfunctionError: init.claude.permissions.route.sh failed at line $LINENO" >&2' ERR

GITROOT="$(git rev-parse --show-toplevel)"
CLAUDE_DIR="$GITROOT/.claude"

# pick the target by layout: in the split layout settings.json is an arrow
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
if [[ -L "$CLAUDE_DIR/settings.json" || -e "$CLAUDE_DIR/settings.of.repo.json" ]]; then
  SETTINGS_FILE="$CLAUDE_DIR/settings.of.repo.json"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OWNED_FILE="$SCRIPT_DIR/init.claude.permissions.route.jsonc"

# warn-and-pass: a state a human must fix never fails the init run as a whole
#   usage: warn_not_healed reason="..." fix="..."
warn_not_healed() {
  local reason="" fix=""
  local "$@"
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.permissions.route" >&2
  echo "   ├─ status = not healed" >&2
  echo "   ├─ reason = $reason" >&2
  echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}" >&2
  echo "   └─ fix: $fix" >&2
  exit 0
}

if [[ ! -f "$OWNED_FILE" ]]; then
  warn_not_healed \
    reason="owned-permissions config not found: $OWNED_FILE" \
    fix="reinstall rhachet-roles-bhrain, then rerun the init"
fi

if [[ -L "$SETTINGS_FILE" ]]; then
  warn_not_healed \
    reason="the settings target is a link to $(readlink "$SETTINGS_FILE"), so the init will not write through it" \
    fix="replace the link with a real file, then rerun the init"
fi

# load and parse JSONC (strip comments before jq parse)
# - grep removes standalone // comment lines
# - sed removes // comments only when preceded by whitespace,
#   which preserves :// inside strings
OWNED=$(grep -v '^\s*//' "$OWNED_FILE" | sed 's|[[:space:]]//.*||' | jq -c '.')

mkdir -p "$CLAUDE_DIR"
SEEDED="false"
if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo "{}" > "$SETTINGS_FILE"
  SEEDED="true"
fi

if ! jq empty "$SETTINGS_FILE" >/dev/null 2>&1; then
  warn_not_healed \
    reason="the settings target is not valid json" \
    fix="repair the json in that file, then rerun the init"
fi
if ! jq -e 'type == "object"' "$SETTINGS_FILE" >/dev/null 2>&1; then
  warn_not_healed \
    reason="the settings target is valid json, but not an object" \
    fix="make the file one json object, then rerun the init"
fi

SETTINGS_TMP="$(mktemp "${SETTINGS_FILE}.XXXXXX")"

# strip the owned entries from deny; findsert them into allow; sort for a stable diff
jq --argjson owned "$OWNED" '
  .permissions             //= {}
  | .permissions.allow     //= []
  | .permissions.deny      //= []
  | .permissions.deny   = (.permissions.deny  - $owned.permissions.deny)
  | .permissions.allow  = ((.permissions.allow + $owned.permissions.allow) | unique)
' "$SETTINGS_FILE" > "$SETTINGS_TMP"

# compare before/after — capture jq exit explicitly so a genuine fault is never
# hidden and never masquerades as "changed"
# jq -e exit codes: 0 = equal, 1 = not equal, >1 = error
# .note = the `||` holds the capture: an ERR trap fires on a nonzero exit even under
#         `set +e`, so a bare capture would print a false "failed" on every change
JQ_COMPARE_EXIT=0
jq -e --slurpfile before "$SETTINGS_FILE" --slurpfile after "$SETTINGS_TMP" \
  -n '$before[0].permissions == $after[0].permissions' >/dev/null \
  || JQ_COMPARE_EXIT=$?

if [[ $JQ_COMPARE_EXIT -gt 1 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "💥 MalfunctionError: jq failed to compare settings (exit $JQ_COMPARE_EXIT)" >&2
  echo "" >&2
  echo "🗿 init.claude.permissions.route" >&2
  echo "   ├─ status = malfunction" >&2
  echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}" >&2
  echo "   └─ fix: rerun the init; if it faults again, report the jq exit code above" >&2
  exit 1
fi

if [[ $JQ_COMPARE_EXIT -eq 0 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "🦉 so it is"
  echo ""
  echo "🗿 init.claude.permissions.route"
  echo "   ├─ status = already healed"
  echo "   └─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
  exit 0
fi

# a target this run seeded holds naught to keep, so it earns no backup
BACKUP_LEAF="none"
if [[ "$SEEDED" == "false" ]]; then
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
  BACKUP_FILE="${SETTINGS_FILE%.json}.${TIMESTAMP}.$$.bak.json"
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  BACKUP_LEAF="${BACKUP_FILE#"$GITROOT/"}"
fi
mv "$SETTINGS_TMP" "$SETTINGS_FILE"

echo "🦉 the path is clear"
echo ""
echo "🗿 init.claude.permissions.route"
echo "   ├─ status = healed"
echo "   ├─ what = .route/ is the driver's workspace, no longer denied"
echo "   ├─ guard = rhx route.mutate.guard --mode hook still protects passed stones"
echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
echo "   └─ backup = $BACKUP_LEAF"
