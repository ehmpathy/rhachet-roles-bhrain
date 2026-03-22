#!/usr/bin/env bash
######################################################################
# .what = capture and retrieve experience snapshots
#
# .why  = preserves full agent experience for later reflection:
#         - transcript = conversation history (claude code jsonl)
#         - savepoints = git state at capture time (commit + patches)
#         - annotations = human notes on the timeline
#         - enables reconstruction and review of past work
#
# usage:
#   rhx reflect.snapshot capture                 # capture snapshot
#   rhx reflect.snapshot get                     # list all snapshots
#   rhx reflect.snapshot get --at <timestamp>    # get specific snapshot
#   rhx reflect.snapshot annotate "note text"    # add annotation
#   rhx reflect.snapshot backup                  # backup to cloud
#   rhx reflect.snapshot help                    # show subcommands
#
# guarantee:
#   - snapshots stored as .snap.zip in ~/.rhachet/storage/
#   - capture creates a fresh savepoint automatically
#   - fail-fast on errors
######################################################################
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# source owl vibes
source "$SKILL_DIR/reflect.snapshot/output.sh"

######################################################################
# show usage
######################################################################
show_usage() {
  print_owl_header "know thyself"
  print_tree_start "reflect.snapshot"
  echo "   ├─ subcommands"
  echo "   │  ├─ set        capture snapshot (alias for capture)"
  echo "   │  ├─ capture    capture snapshot (transcript + savepoints)"
  echo "   │  ├─ get        list or retrieve snapshots"
  echo "   │  ├─ annotate   add annotation to timeline"
  echo "   │  ├─ backup     backup snapshots to cloud"
  echo "   │  └─ help       show this usage"
  echo "   └─ examples"
  echo "      ├─ rhx reflect.snapshot set"
  echo "      ├─ rhx reflect.snapshot get"
  echo "      ├─ rhx reflect.snapshot get --at 2026-03-22.143000"
  echo "      ├─ rhx reflect.snapshot annotate \"found defect: hallucinated\""
  echo "      └─ rhx reflect.snapshot backup"
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
  print_tree_start "reflect.snapshot"
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
  set|capture|get|annotate|backup)
    # valid - proceed to dispatch
    ;;
  *)
    print_owl_header "patience, friend..."
    print_tree_start "reflect.snapshot"
    echo "   └─ error: unknown subcommand: $SUBCMD"
    echo ""
    show_usage
    exit 1
    ;;
esac

######################################################################
# dispatch to subskill
######################################################################

# alias: set -> capture
if [[ "$SUBCMD" == "set" ]]; then
  SUBCMD="capture"
fi

exec "$SKILL_DIR/reflect.snapshot/reflect.snapshot.$SUBCMD.sh" "${ARGS[@]}"
