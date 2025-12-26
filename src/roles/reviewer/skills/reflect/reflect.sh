#!/usr/bin/env bash
######################################################################
# .what = shell wrapper for reviewer.reflect skill
#
# .why  = enables direct invocation from command line
#         - extracts rules from feedback files
#         - proposes rules into target directory
#         - blends proposals with prior rules
#
# usage:
#   reflect.sh --source /path/to/feedback/repo --target /path/to/rules/dir
#   reflect.sh --source . --target ./briefs/practices --mode hard
#   reflect.sh --source . --target ./briefs/practices --force
#
# guarantee:
#   - validates source directory exists and has feedback
#   - validates target directory exists (or creates with --force)
#   - creates draft directory with pure/, sync/, manifest.json
#   - fail-fast on errors
######################################################################

set -euo pipefail

# resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# find repo root (go up until we find package.json)
REPO_ROOT="$SCRIPT_DIR"
while [[ ! -f "$REPO_ROOT/package.json" ]]; do
  REPO_ROOT="$(dirname "$REPO_ROOT")"
  if [[ "$REPO_ROOT" == "/" ]]; then
    echo "⛈️ error: could not find package.json in parent directories"
    exit 1
  fi
done

# execute typescript skill via npx tsx
exec npx tsx "$SCRIPT_DIR/reflect.ts" "$@"
