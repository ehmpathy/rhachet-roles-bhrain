# tldr

## severity: blocker

all production code must have corresponding tests

code without tests cannot be verified and is a liability

---
---
---

# deets

## .what

every piece of production code must have corresponding test coverage:
- unit tests for isolated logic
- integration tests for component interactions
- acceptance tests for end-to-end flows

## .why

tests provide confidence that code works as intended. without tests:
- bugs go undetected until production
- refactoring becomes dangerous
- onboarding new developers is harder

## .how

before merging any PR:
1. verify unit tests exist for new functions
2. verify integration tests exist for new flows
3. run full test suite and confirm passing

## .examples

### positive

```ts
// production code: src/logic/calculateTotal.ts
export const calculateTotal = (input: { items: Item[] }) => {
  return input.items.reduce((sum, item) => sum + item.price, 0);
};

// test code: src/logic/calculateTotal.test.ts
describe('calculateTotal', () => {
  test('sums item prices', () => {
    const result = calculateTotal({ items: [{ price: 10 }, { price: 20 }] });
    expect(result).toBe(30);
  });
});
```

### negative

```ts
// production code without any tests
export const processPayment = async (input: { amount: number }) => {
  // complex payment logic with no test coverage
};
```
