# rule.forbid.cwd-outside-gitroot

## .what

never change cwd outside the git repository root. all file operations must use paths relative to gitroot.

## .why

- predictable path resolution from a single known anchor
- avoids path confusion when functions compose
- prevents accidental file access outside repo boundaries
- glob patterns work consistently across all call sites

## .pattern

```ts
// 👎 bad — changes cwd to subdirectory
const matches = await enumFilesFromGlob({ glob, cwd: input.route });

// 👍 good — expand variables, keep cwd at gitroot
const expandedGlob = glob.replace(/\$route/g, input.route);
const matches = await enumFilesFromGlob({ glob: expandedGlob });
```

## .scope

applies to:
- `enumFilesFromGlob` calls
- `fs` operations
- any function that accepts a `cwd` parameter

## .enforcement

`cwd` parameter that points outside gitroot = **BLOCKER**
