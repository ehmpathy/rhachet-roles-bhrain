# rule.forbid.unbounded-recursive-globs

## .what

recursive globs (`**`) must always exclude `node_modules` (and other heavy directories)

## .why

a recursive glob with `cwd: process.cwd()` and no `ignore` traverses the entire file tree - this includes `node_modules`. on a typical npm project:

- 50,000+ files in node_modules
- 10,000+ directories
- memory consumption scales with file count
- causes OOM on large dependency trees

### the OOM chain

```
route.bind.set
  → enumFilesFromGlob({ glob: '**/.route/.bind.*.flag', cwd: process.cwd() })
  → fast-glob traverses node_modules
  → 50k+ stat calls
  → memory exhaustion
```

## .pattern

```ts
// 👎 bad - scans all of node_modules
const files = await enumFilesFromGlob({
  glob: '**/.route/.bind.*.flag',
  cwd: process.cwd(),
  dot: true,
});

// 👍 good - excludes node_modules
const files = await enumFilesFromGlob({
  glob: '**/.route/.bind.*.flag',
  cwd: process.cwd(),
  dot: true,
  ignore: ['**/node_modules/**'],
});
```

## .when

always add `ignore: ['**/node_modules/**']` when:
- `**` recursive glob is used
- `cwd` is `process.cwd()` or repo root
- glob searches for config/flag files

## .exception

explicit scoped globs are fine:
```ts
// ok - cwd is already a specific directory
await enumFilesFromGlob({ glob: '*.md', cwd: input.route });
```

## .enforcement

unbounded `**` glob without ignore = **BLOCKER**
