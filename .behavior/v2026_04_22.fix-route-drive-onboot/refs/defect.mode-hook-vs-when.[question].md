# question: why does --mode hook still exist?

## .answer

it shouldn't. `route.drive` was never migrated to the `--when` convention.

## .evidence

the achiever role already uses `--when hook.onBoot/onStop`:

```typescript
// src/domain.roles/achiever/getAchieverRole.ts
onBoot: [
  { command: './node_modules/.bin/rhx goal.triage.next --when hook.onBoot', ... },
],
onStop: [
  { command: './node_modules/.bin/rhx goal.triage.infer --when hook.onStop', ... },
  { command: './node_modules/.bin/rhx goal.triage.next --when hook.onStop', ... },
],
```

but the driver role still uses outdated `--mode hook`:

```typescript
// src/domain.roles/driver/getDriverRole.ts (lines 28-30, 52-54)
onBoot: [
  { command: './node_modules/.bin/rhx route.drive --mode hook', ... },
],
onStop: [
  { command: './node_modules/.bin/rhx route.drive --mode hook', ... },
],
```

## .why --when is better

| aspect | --mode hook | --when hook.onBoot/onStop |
|--------|-------------|---------------------------|
| specificity | ambiguous (which hook?) | explicit (onBoot vs onStop) |
| alignment | outdated | matches Claude Code hook names |
| extensibility | limited | supports onTool, onTalk, etc. |

## .fix

1. deprecate `--mode hook` in `route.drive`
2. implement `--when hook.onBoot` and `--when hook.onStop`
3. update `getDriverRole.ts` hooks
4. update `stepRouteDrive` to accept `when` parameter
