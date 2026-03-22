#!/usr/bin/env bash
######################################################################
# .what = capture and retrieve git state savepoints
#
# .why  = preserves git state at a moment for later reconstruction:
#         - commit.hash = git HEAD at capture time
#         - patches = staged + unstaged diffs
#         - enables reconstruction: checkout hash, then apply patches
#
# usage:
#   rhx reflect.savepoint set                    # plan mode (preview)
#   rhx reflect.savepoint set --mode apply       # capture savepoint
#   rhx reflect.savepoint get                    # list all savepoints
#   rhx reflect.savepoint get --at <timestamp>   # get specific savepoint
#   rhx reflect.savepoint help                   # show subcommands
#
# guarantee:
#   - savepoints stored per repo/branch in ~/.rhachet/storage/
#   - patches are full diffs (can apply with git apply)
#   - fail-fast on errors
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# source owl vibes
source "$SKILL_DIR/reflect.savepoint/output.sh"

######################################################################
# show usage
######################################################################
show_usage() {
  print_owl_header "know thyself"
  print_tree_start "reflect.savepoint"
  echo "   ├─ subcommands"
  echo "   │  ├─ set       capture a savepoint (git state)"
  echo "   │  ├─ get       list or retrieve savepoints"
  echo "   │  └─ help      show this usage"
  echo "   └─ examples"
  echo "      ├─ rhx reflect.savepoint set"
  echo "      ├─ rhx reflect.savepoint set --mode apply"
  echo "      ├─ rhx reflect.savepoint get"
  echo "      └─ rhx reflect.savepoint get --at 2026-03-22.143000"
}

######################################################################
# parse arguments
######################################################################
SUBCMD=""
ARGS=()

while [[ $# -gt 0 ]]; do
  case $1 in
    # rhachet passes these - ignore them
    --skill|--repo|--role)
      shift 2
      ;;
    --help|-h)
      show_usage
      exit 0
      ;;
    *)
      # capture subcommand if not yet set
      if [[ -z "$SUBCMD" ]]; then
        SUBCMD="$1"
        shift
        continue
      fi
      # append rest of args after subcommand
      ARGS+=("$1")
      shift
      ;;
  esac
done

######################################################################
# validate subcommand
######################################################################

# guard: subcommand required
if [[ -z "$SUBCMD" ]]; then
  print_owl_header "patience, friend..."
  print_tree_start "reflect.savepoint"
  echo "   └─ error: subcommand required"
  echo ""
  show_usage
  exit 1
fi

# handle help subcommand
if [[ "$SUBCMD" == "help" ]]; then
  show_usage
  exit 0
fi

# guard: valid subcommand
case "$SUBCMD" in
  set|get)
    # valid - proceed to dispatch
    ;;
  *)
    print_owl_header "patience, friend..."
    print_tree_start "reflect.savepoint"
    echo "   └─ error: unknown subcommand: $SUBCMD"
    echo ""
    show_usage
    exit 1
    ;;
esac

######################################################################
# dispatch to subskill
######################################################################
exec "$SKILL_DIR/reflect.savepoint/reflect.savepoint.$SUBCMD.sh" "${ARGS[@]}"
