# feedback on test patterns

## context

reviewing test files for the payment module

## observations

### test structure

tests should use given/when/then pattern from test-fns:

```ts
import { given, when, then } from 'test-fns';

describe('processPayment', () => {
  given('[case1] valid payment details', () => {
    when('[t0] payment is processed', () => {
      then('returns success status', async () => {
        const result = await processPayment({ amount: 100 });
        expect(result.status).toBe('success');
      });
    });
  });
});
```

### test isolation

saw tests that depend on each other's state. each test should be independent:

```ts
// bad - tests share state
let sharedUser: User;
beforeAll(async () => {
  sharedUser = await createUser();
});

// good - use useBeforeAll for proper scoping
given('[case1] user exists', () => {
  const user = useBeforeAll(async () => await createUser());

  when('[t0] user is updated', () => {
    then('update succeeds', async () => {
      const result = await updateUser({ user });
      expect(result.success).toBe(true);
    });
  });
});
```

### arrow functions (again)

also noticed test files using `function` keyword:

```ts
// bad
function setupTestUser() {
  return { id: '123', name: 'test' };
}

// good
const setupTestUser = () => {
  return { id: '123', name: 'test' };
};
```

this came up in PR #42 as well - we should always use arrow functions.

## summary

proper test structure makes tests more readable and maintainable.
