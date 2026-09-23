#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.mutate skill
#
# .why = manages route protection privileges
#        - grant allow: HUMAN ONLY — the flag it writes lifts EVERY protected write on
#          the route at once, a guard's `budget:` line among them. a non-human caller is
#          refused with exit 2, and that is enforced rather than asked
#        - grant block: revokes the privilege — ungated, since a revoke only narrows
#        - grant get: checks current privilege state — ungated, a status read
#        - guard: pretooluse hook (shell-only, handled by route.mutate.guard.sh)
#
# usage:
#   ./route.mutate.sh grant allow   # grant access privilege (human only)
#   ./route.mutate.sh grant block   # revoke access privilege
#   ./route.mutate.sh grant get     # check privilege state
#   ./route.mutate.sh guard --mode hook  # pretooluse hook (shell-only)
#
# exit codes:
#   0 = success
#   1 = error
#   2 = blocked (guard mode) or refused (grant allow, non-human caller)
######################################################################
set -euo pipefail

# check for guard mode - must be shell-only for performance
if [[ "${1:-}" == "guard" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  exec bash "$SCRIPT_DIR/route.mutate.guard.sh" "${@:2}"
fi

# convert --grant <action> to positional args: grant <action>
# .why = invokeRouteSkill helper uses named args, CLI expects positional
ARGS=()
GRANT_ACTION=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --grant)
      GRANT_ACTION="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

# if --grant was provided, convert to positional
if [[ -n "$GRANT_ACTION" ]]; then
  set -- grant "$GRANT_ACTION" "${ARGS[@]}"
else
  set -- "${ARGS[@]}"
fi

# delegate grant commands to TypeScript CLI
exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeMutateGrant())" -- "$@"
