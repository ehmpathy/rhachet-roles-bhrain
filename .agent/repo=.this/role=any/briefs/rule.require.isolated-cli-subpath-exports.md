# rule.require.isolated-cli-subpath-exports

## .what

every cli command must have its own isolated export subpath. no reason to aggregate — isolated exports are safer by design.

## .why

aggregated `/cli` exports are a footgun. import loads all modules — heavy dependencies that aren't needed for the specific operation.

**the OOM problem:**
```
route.bind.set.sh → import('rhachet-roles-bhrain/cli')
                         ↓
                    cli/index.ts imports ALL:
                         ├─ review.ts → rhachet/brains → ML deps (~4GB)
                         ├─ reflect.ts → rhachet/brains → ML deps
                         └─ route.ts → lightweight file ops
```

a simple `route.bind.set` operation that writes a flag file loaded gigabytes of ML infrastructure.

## .fix

add isolated subpath exports in `package.json`:

```json
"exports": {
  ".": "./dist/index.js",
  "./cli": "./dist/contract/cli/index.js",
  "./cli/route": "./dist/contract/cli/route.js",
  "./cli/review": "./dist/contract/cli/review.js",
  "./cli/reflect": "./dist/contract/cli/reflect.js",
  "./package.json": "./package.json"
}
```

update shell scripts to use isolated imports:

```bash
# before (OOM: loads ALL cli modules with ML deps)
exec node -e "import('pkg/cli').then(m => m.cli.route.bind.set())" -- "$@"

# after (fast: loads only route operations)
exec node -e "import('pkg/cli/route').then(m => m.routeBindSet())" -- "$@"
```

## .principle

each cli domain must be independently importable:
- `/cli/route` → file operations, git commands (lightweight)
- `/cli/review` → brain infrastructure, LLM calls (heavy)
- `/cli/reflect` → brain infrastructure, LLM calls (heavy)

operations that don't need heavy deps must never load them.

## .pattern

| operation | needs brain? | import path |
|-----------|--------------|-------------|
| route.bind.set | no | `pkg/cli/route` |
| route.drive | no | `pkg/cli/route` |
| review | yes | `pkg/cli/review` |
| reflect | yes | `pkg/cli/reflect` |

## .symptoms of violation

- OOM errors on simple file operations
- slow startup for lightweight commands
- memory spikes before any real work

## .enforcement

- shell skills must import the most specific subpath available
- cli index must not eagerly import heavy modules
- heavy deps (brain, ML) must be in separate subpaths
- violation = **BLOCKER**
