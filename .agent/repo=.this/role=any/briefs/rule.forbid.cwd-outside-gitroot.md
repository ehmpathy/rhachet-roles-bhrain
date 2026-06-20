# rule.forbid.cwd-outside-gitroot

## .what

never change cwd outside the git repository root. all subprocess and file operations must use repoRoot as cwd.

## .why

- predictable path resolution from a single known anchor
- avoids path confusion when functions compose
- prevents accidental file access outside repo boundaries
- glob patterns work consistently across all call sites
- **skill resolution depends on cwd** — rhachet looks for `.agent/` relative to cwd, so skills fail if cwd is not gitroot

## .incident: v0.29.6 regression

in v0.29.6, `runStoneGuardReviews` added `cwd: input.route` to execute peer reviews from the route directory. this broke skill resolution:

```
BadRequestError: no skill "review" found with --repo bhrain
```

because `rhx` looked for `.agent/repo=bhrain/` relative to `.behavior/v2026.../` instead of the repo root.

## .pattern

### subprocess execution

```ts
// 👎 bad — changes cwd to subdirectory
const result = await execAsync(cmd, {
  cwd: input.route,  // route dir like .behavior/v2026.../
  env: execEnv,
});

// 👍 good — keep cwd at gitroot
const result = await execAsync(cmd, {
  cwd: repoRoot,  // always git root
  env: execEnv,
});
```

### glob enumeration

```ts
// 👎 bad — changes cwd to subdirectory
const matches = await enumFilesFromGlob({ glob, cwd: input.route });

// 👍 good — expand variables, keep cwd at gitroot
const expandedGlob = glob.replace(/\$route/g, input.route);
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

## .scope

applies to:
- `execAsync` / `execSync` calls
- `enumFilesFromGlob` calls
- `fs` operations
- any function that accepts a `cwd` parameter

## .enforcement

`cwd` parameter that points outside gitroot = **BLOCKER**
