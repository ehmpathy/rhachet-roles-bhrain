#!/usr/bin/env bash
######################################################################
# .what = shell wrapper for reviewer.reflect skill
#
# .why  = enables direct invocation from command line
#         via location-independent package import
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

exec npx tsx -e "import('rhachet-roles-bhrain').then(m => m.cli.reflect())" -- "$@"
