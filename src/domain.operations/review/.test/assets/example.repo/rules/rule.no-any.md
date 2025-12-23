# rule: no-any

## severity: blocker

## description

forbid use of `any` type in TypeScript code.

## rationale

- `any` defeats the purpose of TypeScript's type safety
- it hides potential bugs that would otherwise be caught at compile time
- prefer `unknown` if the type is truly unknown

## detection

look for patterns:
- `: any`
- `<any>`
- `as any`

## examples

### bad
```ts
const value: any = getData();
function process(input: any): any { ... }
```

### good
```ts
const value: unknown = getData();
function process(input: SomeType): ResultType { ... }
```
