# brief: separation of concerns in driver-route-stones

## .what

the driver role enforces a clear separation of concerns between orchestration and evaluation:

- **driver**: orchestrates, computes hashes, manages files, caches results
- **reviews/judges**: pure evaluators that output to stdout, unaware of file locations

## .why

### reviews and judges should not know about file paths

the guard file specifies review and judge commands:

```yaml
reviews:
  - rhx review --rules .agent/**/rules/*.md --paths src/**/*.ts

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone 5.implement --route $route
```

these commands should just:
1. do their evaluation work
2. output results to stdout

they should NOT need to:
- know where to write output files
- know the current artifact hash
- manage `.route/` directory structure

### the driver handles orchestration

the driver (`setStoneAsPassed`) handles:
1. compute artifact hash from guard.artifacts
2. check for cached reviews/judges for this hash
3. execute review commands, capture stdout, write to `.route/`
4. execute judge commands, capture stdout, write to `.route/`
5. parse judge output to determine pass/fail

this separation enables:
- **reusable commands**: review commands work standalone or via driver
- **testable judges**: judge mechanisms can be unit tested with fixture files
- **cache transparency**: commands don't need cache awareness; driver handles it
- **consistent hash computation**: single source of hash computation

## .how

### judges receive review paths from driver

the driver handles hash computation and provides relevant review paths to the judge:

```yaml
# guard file - judge declaration (no hash needed)
judges:
  - rhx route.stone.judge --mechanism reviewed? --stone 5.implement --route $route
```

the flow:
1. driver computes review input hash from guard.artifacts
2. driver runs reviews (or reuses cached)
3. driver computes judge input hash from reviews + approvals
4. driver checks if a cached judge exists for this judge input hash
5. if not cached: driver runs judge with review file paths via `--reviews`
6. judge reads those files, counts blockers/nitpicks, outputs pass/fail to stdout
7. driver captures stdout and writes to `.route/`

the judge:
- receives review file paths (not hashes)
- reads and evaluates reviews
- outputs pass/fail with reason
- does NOT compute hashes

### the driver captures stdout

when the driver runs reviews:

```ts
// driver executes review command
const { stdout } = await execAsync(reviewCommand, { cwd: route });

// driver writes output to .route/
const reviewPath = path.join(route, '.route', `${stone}.guard.review.i${iter}.${hash}.r${n}.md`);
await fs.writeFile(reviewPath, stdout);
```

the review command is blissfully unaware of:
- iteration number
- artifact hash
- output file location

## .hash principle: each component hashes its inputs

the cache model follows a simple principle: **each component hashes its inputs**.

### reviews hash on artifacts

```
artifacts (src/**/*.ts) → hash ABC
                            ↓
                    reviews cached by hash ABC
```

- reviews evaluate artifacts
- driver computes hash from guard.artifacts
- if reviews exist for this artifact hash → reuse
- if no reviews for this hash → run fresh

### judges hash on reviews + approvals

```
reviews + approvals → driver computes judge input hash
                        ↓
              driver runs judge if not cached
```

- judges evaluate reviews and approval markers
- DRIVER computes judge input hash from reviews + approvals
- DRIVER checks for cached judge for this hash
- if no cached judge or prior judge failed → driver runs judge
- judge receives review paths from driver, outputs verdict to stdout

### implementation: artifact hash as proxy

the driver uses artifact hash for both reviews and judges, with a "cache only passed" strategy:

```
cache lookup: artifact hash
cache write: only if judge passed
```

this achieves the principle because:
- reviews are deterministic given artifact hash → same hash = same reviews
- only passed judges are cached → failed judges re-run to check new external state

example: approval flow
1. robot runs `set --as passed` → judge fails (no approval)
2. prior judge is failed → not cached
3. human runs `set --as approved`
4. robot retries `set --as passed` → judge re-runs (not cached) → sees approval → passes

### the cascade

```
artifact content changes
        ↓
artifact hash changes (ABC → DEF)
        ↓
no cached reviews for DEF → fresh reviews run
        ↓
reviews changed → judge sees new input
```

```
artifact unchanged, approval granted
        ↓
artifact hash unchanged (ABC)
        ↓
cached reviews reused (same hash)
        ↓
judge re-runs (approval state = new input)
```

## .benefit

this separation makes the system more:

- **modular**: swap review commands without driver changes
- **testable**: test judges with fixture review files
- **cacheable**: driver handles cache logic transparently
- **debuggable**: each piece has clear responsibility

## .see also

- `usecase.8` + `usecase.9` in `2.1.criteria.blackbox.md`: formalizes this separation
- `setStoneAsPassed.ts`: driver implementation
- `runStoneGuardJudges.ts`: driver computes hashes, judges just evaluate
