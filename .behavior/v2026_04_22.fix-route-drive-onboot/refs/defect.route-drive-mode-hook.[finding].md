# defect: route.drive --mode hook exits 2 when bound to route

## .what

`route.drive --mode hook` exits with code 2 (constraint error) when called at onBoot while a route is bound. this causes startup errors in claude code sessions.

## .root-cause

the driver role hooks in `src/domain.roles/driver/getDriverRole.ts` use outdated `--mode hook` syntax:

```typescript
// lines 28-30
onBoot: [
  { command: './node_modules/.bin/npx rhachet roles boot --role driver', timeout: 'PT30S' },
  { command: './node_modules/.bin/rhx route.drive --mode hook', timeout: 'PT5S' },  // BUG
],
// line 52-54
onStop: [
  { command: './node_modules/.bin/rhx route.drive --mode hook', timeout: 'PT5S' },  // BUG
],
```

## .reproduction

1. bind a route: `rhx route.bind.set --route .behavior/some-route`
2. start a session (triggers onBoot hooks)
3. observe: `route.drive --mode hook` exits 2

when unbound (`rhx route.bind.del`), the hook succeeds.

## .new convention

the `--mode hook` flag is ambiguous — it fails to specify which hook context (onBoot vs onStop). the new convention:

- `--when hook.onBoot` for session start
- `--when hook.onStop` for session end

## .files to update

| file | line | change |
|------|------|--------|
| `src/domain.roles/driver/getDriverRole.ts` | 29 | `--mode hook` → `--when hook.onBoot` |
| `src/domain.roles/driver/getDriverRole.ts` | 53 | `--mode hook` → `--when hook.onStop` |
| `src/contract/cli/route.ts` | ~494 | handle `--when` parameter |
| `.claude/settings.json` | 27, 215 | may need update if `--mode hook` present |

## .acceptance criteria

- `route.drive --when hook.onBoot` succeeds when bound to a route
- `route.drive --when hook.onStop` succeeds when bound to a route
- test coverage prevents regression

## .question: why does --mode hook still exist?

see: `defect.mode-hook-vs-when.[question].md`
