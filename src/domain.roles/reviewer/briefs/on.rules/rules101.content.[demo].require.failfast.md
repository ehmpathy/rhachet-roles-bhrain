# tldr

## severity: blocker

fail fast using early exits and HelpfulError subclasses to reject invalid state or input immediately.

early returns and throws collapse failure paths, eliminate nested branches, and make core logic shine. rich error context via `helpful-errors` makes bugs easier to debug.

---
---
---

# deets

## .what

enforce fail-fast logic in all procedures by using guard clauses with early returns or throws.

## .why

- improves readability by collapsing failure paths early
- eliminates nested branches and lets core logic shine
- increases safety by clearly documenting and halting on invalid input
- makes bugs easier to debug with rich context using `helpful-errors`

## severity: blocker

fail-fast surfaces errors immediately with rich context, cutting debug time from hours to minutes.

## .where

- required in all stitched logic, business procedures, and service flows
- applies to guard checks, validations, and branching paths

## .how

- use early returns or throws for all guard clauses
- never use `if (...) else` or deep nesting to control flow
- prefer `UnexpectedCodePathError.throw(...)` for internal invariant violations
- prefer `BadRequestError.throw(...)` for rejecting invalid input
- include context objects in all thrown errors to aid debugging

## .examples

### positive

```ts
// reject if user does not exist
if (!user) return BadRequestError.throw('user not found', { userUuid });

// halt if state is invalid
if (!input.customer.phone)
  UnexpectedCodePathError.throw('customer lacks phone, invalid state', { customer });

// continue with core logic after guards
const result = await processCustomer(input.customer);
```

### negative

```ts
// ⛔ nested branches hide the core logic
if (user) {
  if (input.customer.phone) {
    const result = await processCustomer(input.customer);
    return result;
  } else {
    throw new Error('no phone');
  }
} else {
  throw new Error('no user');
}
```
