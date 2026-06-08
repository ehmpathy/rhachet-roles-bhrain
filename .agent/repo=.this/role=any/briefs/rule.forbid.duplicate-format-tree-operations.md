# rule.forbid.duplicate-format-tree-operations

## .what

forbid duplicate format*Tree operations. reuse shared format functions.

## .why

- duplicate formatters drift over time
- one change must be made in multiple places
- visual inconsistency across outputs
- increased maintenance burden

## .pattern

when format output is needed in multiple contexts:

1. create ONE shared format function with parameters for context differences
2. call the shared function from each context with appropriate parameters

### example

```ts
// good - one shared function
export const formatReviewsMeterLines = (input: {
  meters: GuardPeerMeterStatus[];
  baseIndent?: string;
  headerPrefix?: string;
  headerText?: string;
}): string[] => { ... };

// used in formatGuardTree
const lines = formatReviewsMeterLines({
  meters,
  headerPrefix: '├─',
  headerText: 'reviews',
});

// used in formatRouteDriveExhausted
const lines = formatReviewsMeterLines({
  meters,
  headerPrefix: '',
  headerText: '🦉 peer reviewers',
});
```

```ts
// bad - duplicate functions
const formatReviewsMeterLines = (...) => { ... };
const formatReviewPeerMeterTree = (...) => { ... }; // same logic, different name
```

## .scope

applies to all `format*Tree`, `format*Lines`, `format*Output` functions that render similar content.

## .enforcement

duplicate format*Tree operation = **BLOCKER**

