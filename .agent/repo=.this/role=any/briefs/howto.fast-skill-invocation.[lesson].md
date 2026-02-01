# fast skill invocation pattern

## what

skills should invoke compiled javascript via package-level imports, not tsx or local path resolution.

## why

- **no tsx overhead** — `npx tsx` adds ~1-1.5s startup time per invocation
- **no path resolution** — `$(cd ... && pwd)` spawns a subshell
- **module cache** — node caches package imports, faster on repeated calls
- **portable** — works from any directory via node_modules resolution

## pattern

### shell wrapper

```bash
#!/usr/bin/env bash
set -euo pipefail

exec node -e "import('package-name').then(m => m.cli.skillName())" -- "$@"
```

key elements:
- `exec` replaces shell process with node (no extra process)
- `node -e` executes inline javascript
- `import('package-name')` loads precompiled dist/index.js
- `m.cli.skillName()` accesses cli namespace
- `-- "$@"` passes all args to the skill

### package exports (index.ts)

```typescript
// sdk exports for programmatic use
export * from '@src/contract/sdk';
export { stepReview } from '@src/domain.operations/review/stepReview';

// cli entry points for shell invocation
import { review } from '@src/contract/cli/review';
import { reflect } from '@src/contract/cli/reflect';

export const cli = {
  review,
  reflect,
};
```

### cli wrapper (src/contract/cli/review.ts)

```typescript
/**
 * .what = cli entrypoint for review skill
 * .why = enables shell invocation via package-level import
 */
export const review = async (): Promise<void> => {
  // parse args from process.argv
  const options = parseArgs(process.argv);

  // load dependencies
  const brain = loadBrain(options.brain);

  // invoke domain operation
  await stepReview({ ... }, { brain });
};
```

## antipatterns

### path-based import (slow)

```bash
# bad - requires path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node -e "import('$SCRIPT_DIR/review.cli.js').then(m => m.review())" -- "$@"
```

### tsx invocation (slow)

```bash
# bad - tsx adds ~1.5s startup overhead
exec npx tsx -e "import('package-name').then(m => m.cli.reflect())" -- "$@"
```

## directory structure

```
src/
├── contract/
│   ├── cli/
│   │   ├── review.ts      # cli entrypoint for review skill
│   │   └── reflect.ts     # cli entrypoint for reflect skill
│   └── sdk/
│       └── index.ts       # sdk exports
├── domain.roles/
│   └── reviewer/
│       └── skills/
│           ├── review.sh  # shell wrapper (uses cli.review)
│           └── reflect.sh # shell wrapper (uses cli.reflect)
└── index.ts               # exports cli namespace + sdk
```

## performance

| method | cold start |
|--------|------------|
| `npx tsx -e` | ~1500ms |
| `node -e` + path resolution | ~500ms |
| `node -e` + package import | ~200ms |
