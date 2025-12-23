# rule: no-console

## severity: blocker

## description

forbid use of `console.log`, `console.warn`, `console.error` in production code.

## rationale

- console statements pollute logs
- they are often left in by accident
- prefer structured logging via observability tools

## detection

look for patterns:
- `console.log(`
- `console.warn(`
- `console.error(`

## examples

### bad
```ts
console.log('debug:', value);
```

### good
```ts
context.log.debug('value processed', { value });
```
