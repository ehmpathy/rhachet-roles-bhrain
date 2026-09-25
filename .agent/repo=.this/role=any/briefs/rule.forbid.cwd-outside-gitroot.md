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

## .pattern: the agent's own shell

the rule binds the agent's prompt exactly as it binds the code. the shell is already rooted at
gitroot — issue bare commands and repo-relative paths, and leave the cwd alone.

```sh
# 👎 bad — a cd persists, and a later command runs from the wrong anchor
cd .behavior/v2026.../.reviews/peer && rhx route.stone.set …

# 👎 bad — `env -C` is the same violation under a different name. it reads as a workaround for
#          a cwd that should never have moved, and it makes every command unreadable
env -C /abs/path/to/gitroot rhx route.stone.set …

# 👍 good — the shell is at gitroot; say what you mean
rhx route.stone.set --stone 5.1.execution.from_vision --as passed
```

🔴 `Bash(cd:*)` sits in the settings `deny` list for this reason. an `env -C` prefix routes
around that guard rather than honors it — so it is forbidden by the same rule, not permitted
by its silence.

⇒ if a command seems to need a different directory, **the pwd is wrong** — say so and let the
human repair it, rather than a per-command anchor smuggled in past the guard.

## .scope

applies to:
- `execAsync` / `execSync` calls
- `enumFilesFromGlob` calls
- `fs` operations
- any function that accepts a `cwd` parameter
- the agent's own `Bash` invocations — no `cd`, no `pushd`, no `env -C`

## .enforcement

`cwd` parameter that points outside gitroot = **BLOCKER**
