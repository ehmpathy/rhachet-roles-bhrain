# rule.forbid.stdout-on-exit-errors

## .what

when `process.exit(1)` or `process.exit(2)` is used for error conditions, all error/feedback messages must go to `stderr` (`console.error`), not `stdout` (`console.log`).

## .why

- **cli hook visibility**: tools like Claude Code show stderr separately from stdout. messages on stdout may be truncated or hidden when a hook exits non-zero.
- **unix convention**: stderr is for errors and diagnostics; stdout is for program output.
- **pipe safety**: when stdout is piped, error messages on stdout corrupt the data stream.

## .pattern

```typescript
// 👍 good — errors go to stderr
if (blocked) {
  console.error('🦉 patience, friend');
  console.error('   blocked by guard');
  process.exit(2);
}

// 👎 bad — errors go to stdout
if (blocked) {
  console.log('🦉 patience, friend');   // WRONG: goes to stdout
  console.log('   blocked by guard');
  process.exit(2);
}
```

## .scope

applies to all CLI commands that use `process.exit(1)` or `process.exit(2)` for error conditions.

## .enforcement

`console.log` followed by `process.exit(1|2)` = **BLOCKER**

## .exception

normal program output that happens to exit with error code (e.g., judge results like `passed: false`) may use stdout since the exit code communicates success/failure and the output is structured data.
