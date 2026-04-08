# self-review r9: has-behavior-declaration-coverage

## verdict: pass

## vision requirements coverage

### vision outcome: pattern recognition

| vision requirement | blueprint coverage | line ref |
|-------------------|-------------------|----------|
| recognize `.yield.md` | glob pattern `${stone.name}.yield*` | line 64 |
| recognize `.yield.*` | glob pattern `${stone.name}.yield*` | line 64 |
| recognize `.yield` (extensionless) | glob pattern `${stone.name}.yield*` | line 64 |
| recognize `.v1.i1.md` (backwards compat) | glob pattern `${stone.name}*.md` | line 65 |

### vision outcome: priority resolution

| vision requirement | blueprint coverage | line ref |
|-------------------|-------------------|----------|
| `.yield.md` preferred over `.v1.i1.md` | priority 1 vs priority 4 in `asArtifactByPriority` | lines 83, 86 |
| `.yield.md` preferred over `.yield.*` | priority 1 vs priority 2 | lines 83, 84 |

### vision outcome: backwards compatibility

| vision requirement | blueprint coverage | line ref |
|-------------------|-------------------|----------|
| extant behaviors with `.v1.i1.md` continue | glob includes `*.md`, priority 4 | lines 65, 86 |
| no migration required | dual pattern support | lines 172-179 |

## criteria usecases coverage

### usecase.1 = driver discovers stone artifacts

| criterion | blueprint coverage |
|-----------|-------------------|
| recognizes `{stone}.yield.md` | glob + priority 1 |
| recognizes `{stone}.yield.json` | glob + priority 2 (regex) |
| recognizes `{stone}.yield` (no extension) | glob + priority 3 |
| recognizes `{stone}.v1.i1.md` | glob + priority 4 |

**covered:** yes, in implementation details (lines 58-102)

### usecase.2 = artifact pattern priority

| criterion | blueprint coverage |
|-----------|-------------------|
| prefers `.yield.md` over `.v1.i1.md` | priority array order |
| prefers `.yield.md` over `.yield` | priority 1 > priority 3 |

**covered:** yes, in priority resolution transformer (lines 82-88)

### usecase.3 = new behavior creates yield

| criterion | blueprint coverage |
|-----------|-------------------|
| artifact saved as `{stone}.yield.md` by default | N/A - creation is human/agent action |
| non-markdown outputs as `{stone}.yield.json` | N/A - creation is human/agent action |

**note:** usecase.3 describes CREATION, not DISCOVERY. the blueprint scope is discovery. creation is a human/agent action outside driver code.

**covered:** out of scope (correctly)

### usecase.4 = guard reads artifacts

| criterion | blueprint coverage |
|-----------|-------------------|
| guard reads `.yield.md` if present | integration point: "guard artifact reads — no changes needed" |
| guard reads `.yield.*` if present | same |
| guard reads `.v1.i1.md` if present | same |

**covered:** yes, line 109 notes no changes needed (guards read all matched files)

### usecase.5 = feedback on yield

| criterion | blueprint coverage |
|-----------|-------------------|
| feedback saved as `{stone}.yield.[feedback].*.md` | N/A - feedback is human action |

**covered:** out of scope (correctly) - feedback patterns are not part of artifact discovery

### usecase.6 = stone without artifact

| criterion | blueprint coverage |
|-----------|-------------------|
| stone recognized as incomplete | fallback returns null (line 101) |

**covered:** yes, fallback behavior handles no-match case

### usecase.7 = glob patterns work

| criterion | blueprint coverage |
|-----------|-------------------|
| `*.yield*` matches all new-style yields | glob pattern in blueprint |
| `*.v1.i1.md` matches all legacy yields | glob pattern in blueprint |

**covered:** yes, dual glob patterns support both user queries

## conclusion

all vision requirements are covered. all criteria usecases are addressed:
- usecases 1, 2, 4, 6, 7 directly covered in blueprint
- usecases 3, 5 correctly out of scope (creation, not discovery)

no gaps found.
