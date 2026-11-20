#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for route.fulcrum.rule skill
#
# .why = the one human lever that rules a disputed fulcrum: it writes
#        the yaml verdict and the ledger row that proves a human wrote it
#
# usage:
#   ./route.fulcrum.rule.sh --case F44 --as upheld
#   ./route.fulcrum.rule.sh --case F44 --as conceded --route .behavior/my-feature
#
# options:
#   --case    the fulcrum case id, e.g. F44 (required)
#   --as      upheld | conceded (required)
#   --route   path to route directory (uses bound route if absent)
######################################################################
set -euo pipefail

exec node -e "import('rhachet-roles-bhrain/cli/route').then(m => m.routeFulcrumRule())" -- "$@"
