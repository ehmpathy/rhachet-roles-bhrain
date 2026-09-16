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
# guarantee:
#   ✔ creates .claude/settings.json if absent
#   ✔ preserves every other permission, hook, and config key
#   ✔ removes ONLY the entries this role declares it owns
#   ✔ idempotent: safe to rerun
#   ✔ fail-fast, fail-loud on errors
######################################################################

set -euo pipefail

trap 'echo "❌ init.claude.permissions.route.sh failed at line $LINENO" >&2' ERR

GITROOT="$(git rev-parse --show-toplevel)"
SETTINGS_FILE="$GITROOT/.claude/settings.json"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OWNED_FILE="$SCRIPT_DIR/init.claude.permissions.route.jsonc"

if [[ ! -f "$OWNED_FILE" ]]; then
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.permissions.route" >&2
  echo "   ├─ status = blocked" >&2
  echo "   └─ reason = owned-permissions config not found: $OWNED_FILE" >&2
  exit 2
fi

# load and parse JSONC (strip comments before jq parse)
# - grep removes standalone // comment lines
# - sed removes // comments only when preceded by whitespace,
#   which preserves :// inside strings
OWNED=$(grep -v '^\s*//' "$OWNED_FILE" | sed 's|[[:space:]]//.*||' | jq -c '.')

mkdir -p "$(dirname "$SETTINGS_FILE")"
if [[ ! -f "$SETTINGS_FILE" ]]; then
  echo "{}" > "$SETTINGS_FILE"
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
set +e
jq -e --slurpfile before "$SETTINGS_FILE" --slurpfile after "$SETTINGS_TMP" \
  -n '$before[0].permissions == $after[0].permissions' >/dev/null
JQ_COMPARE_EXIT=$?
set -e

if [[ $JQ_COMPARE_EXIT -gt 1 ]]; then
  rm -f "$SETTINGS_TMP"
  echo "🦉 patience" >&2
  echo "" >&2
  echo "🗿 init.claude.permissions.route" >&2
  echo "   ├─ status = malfunction" >&2
  echo "   └─ reason = jq failed to compare settings (exit $JQ_COMPARE_EXIT)" >&2
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

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
BACKUP_FILE="${SETTINGS_FILE%.json}.${TIMESTAMP}.$$.bak.json"
cp "$SETTINGS_FILE" "$BACKUP_FILE"
mv "$SETTINGS_TMP" "$SETTINGS_FILE"

echo "🦉 the path is clear"
echo ""
echo "🗿 init.claude.permissions.route"
echo "   ├─ status = healed"
echo "   ├─ what = .route/ is the driver's workspace, no longer denied"
echo "   ├─ guard = rhx route.mutate.guard --mode hook still protects passed stones"
echo "   ├─ settings = ${SETTINGS_FILE#"$GITROOT/"}"
echo "   └─ backup = ${BACKUP_FILE#"$GITROOT/"}"
