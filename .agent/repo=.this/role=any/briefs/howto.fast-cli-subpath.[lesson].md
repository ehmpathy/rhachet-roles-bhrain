# fast cli subpath pattern

## what

shell skills import from `rhachet-roles-bhrain/cli` instead of the main package export.

```bash
# fast - 2s
exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.review())" -- "$@"

# slow - 4s
exec node -e "import('rhachet-roles-bhrain').then(m => m.cli.review())" -- "$@"
```

## why

the main package export (`rhachet-roles-bhrain`) loads heavy modules at import time:
- `getRoleRegistry` → loads all roles → loads `skillAct` → loads brain plugins
- `stepReview` / `stepReflect` → loads rhachet stitch infrastructure

this adds ~2s overhead before any user code runs.

the `/cli` subpath exports only:
- `cli.review` - the review cli entrypoint
- `cli.reflect` - the reflect cli entrypoint

these cli modules:
1. parse args first (pure js, fast)
2. validate required args before any expensive imports
3. only load heavy modules (brain, stepReview) after validation passes

## performance

| import path | load time | what loads |
|-------------|-----------|------------|
| `rhachet-roles-bhrain` | ~4s | all roles, all skills, all operations |
| `rhachet-roles-bhrain/cli` | ~2s | cli entrypoints, rhachet brain utils |

the `/cli` path is 2x faster because it skips:
- role registry initialization (~2s)
- skill definitions with heavy plugin imports
- domain operations that aren't needed for arg validation

## when to use

**use `/cli` for:**
- shell skill entrypoints (`review.sh`, `reflect.sh`)
- any invocation where fast startup matters
- ci/cd pipelines, git hooks, interactive shells

**use main package for:**
- programmatic sdk usage
- when you need `getRoleRegistry` for introspection
- when you need `stepReview`/`stepReflect` directly

## implementation

package.json exports:
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./cli": "./dist/contract/cli/index.js"
  }
}
```

cli/index.ts:
```ts
import { reflect } from './reflect';
import { review } from './review';

export const cli = {
  review,
  reflect,
};
```

shell skill (review.sh):
```bash
exec node -e "import('rhachet-roles-bhrain/cli').then(m => m.cli.review())" -- "$@"
```
