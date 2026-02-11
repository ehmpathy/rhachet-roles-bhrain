# howto: debug temp directory symlink failures

## .what

when acceptance tests use temp directories with symlinked `node_modules`, subprocess commands may fail due to incomplete symlink chains.

## .root-cause

the `genTempDirForRhachet` setup symlinked `node_modules/.bin` but not the packages those binaries reference:

```ts
symlink: [
  { at: 'node_modules/.bin', to: 'node_modules/.bin' },
  // absent: { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
]
```

when `npx rhx` ran inside the temp directory:
1. it found `node_modules/.bin/rhx` (via symlink)
2. the rhx entrypoint executed `$basedir/../rhachet/bin/rhx`
3. `$basedir` resolved to temp dir's `node_modules/.bin/`
4. so it looked for `<tempdir>/node_modules/rhachet/bin/rhx`
5. that path didn't exist — only `.bin` was symlinked, not `rhachet`

## .symptoms

- judge commands fail with cryptic errors
- approval files exist but judges can't find them
- subprocess output shows path resolution errors:
  ```
  cd: can't cd to /tmp/.../node_modules/.bin/../rhachet/bin
  exec: /run: Permission denied
  ```

## .diagnosis-pattern

### 1. read the judge artifact file

judge output goes to `.route/*.judge.*.md`, not stdout. add a diagnostic assertion:

```ts
then('DEBUG: show judge artifact contents', async () => {
  const routeDir = path.join(scene.tempDir, '.route');
  const files = await fs.readdir(routeDir);
  const judgeFiles = files.filter(f => f.includes('.judge.') && f.endsWith('.md'));

  if (judgeFiles.length > 0) {
    const latest = judgeFiles.sort().pop()!;
    const content = await fs.readFile(path.join(routeDir, latest), 'utf-8');
    console.log('judge artifact:', content);
  }
});
```

### 2. look for path errors

the critical clues are:
- `cd: can't cd to` — directory doesn't exist
- `exec: ... Permission denied` — command path is malformed
- paths like `/../package/` — relative resolution from symlink

### 3. trace the symlink chain

check what the binary references:
```sh
cat node_modules/.bin/rhx
# look for $basedir/../<package> — that package needs to be symlinked
```

## .fix-pattern

symlink all packages referenced by `.bin` entrypoints:

```ts
symlink: [
  { at: 'node_modules/.bin', to: 'node_modules/.bin' },
  // add packages that .bin entrypoints reference via ../
  { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
]
```

## .prevention

when you add new `.bin` symlinks to test fixtures:
1. read the entrypoint files in `.bin/`
2. identify any `$basedir/../package` references
3. add symlinks for those packages

## .see also

- `genTempDirForRhachet` in `blackbox/.test/invokeRouteSkill.ts`
- pnpm bin entrypoint generation pattern
