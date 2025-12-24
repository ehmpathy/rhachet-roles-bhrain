# tldr

## severity: blocker

never hide errors via blanket try/catch blocks.

hidden errors lead to silent defects and hours of pointless debugging. if an error is thrown, it must be rethrown unless explicitly allowlisted and carefully handled.

---
---
---

# deets

## .what

forbid any scenario where real errors are silently swallowed or hidden, commonly via try/catch blocks that catch all errors without rethrowing unexpected ones.

## .why

- hidden errors cause silent defects that are extremely hard to diagnose
- blanket catch blocks mask the root cause of failures
- debugging becomes exponentially harder when errors don't surface
- fail-fast is impossible when errors are swallowed

## severity: blocker

swallowed exceptions cause silent defects that cost hours or days to diagnose and erode customer trust.

## .when

the only acceptable try/catch pattern:
- the catch has an explicit allowlist of expected errors
- those specific errors are carefully handled
- all other errors are rethrown

## .how

search for patterns:
- `try { ... } catch (e) { }` — empty catch blocks
- `try { ... } catch (e) { return null; }` — swallowing with fallback
- `try { ... } catch (e) { console.log(e); }` — logging without rethrowing

## .examples

### positive

```ts
try {
  await doSomething({ userUuid });
} catch (error) {
  if (!(error instanceof Error)) throw error;

  // only handle specific expected error
  if (error.message.includes('NOT_FOUND')) {
    return null; // expected case: resource doesn't exist
  }

  // rethrow all unexpected errors
  throw error;
}
```

### negative

```ts
// ⛔ blanket catch hides all errors
try {
  await doSomething({ userUuid });
} catch (error) {
  console.log('something went wrong');
  return null;
}
```

```ts
// ⛔ empty catch block
try {
  await riskyOperation();
} catch (e) {
  // silently swallowed
}
```

## .note

this is a mega blocker. any detection of failhide patterns should immediately halt review until resolved.
