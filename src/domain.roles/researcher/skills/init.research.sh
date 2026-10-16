#!/usr/bin/env bash
######################################################################
# .what = shell entrypoint for init.research skill
#
# .why = enables direct invocation from CLI, CI/CD, git hooks
#        via location-independent package import
#
# usage:
#   ./init.research.sh --name "consensus-algorithms"
#   ./init.research.sh --name "ddd-patterns" --dir "/path/to/project"
#   ./init.research.sh --name "supply-chain" --open cursor
#
# options:
#   --name   research topic slug (required)
#   --dir    target directory (default: cwd)
#   --open   open wish file in specified editor after init
######################################################################
set -euo pipefail

# the isolated subpath, never the aggregate `cli` index: the index loads review and
# reflect, and their brain imports, before init runs (rule.require.isolated-cli-subpath-exports)
exec node -e "import('rhachet-roles-bhrain/cli/research').then(m => m.researchInit())" -- "$@"
