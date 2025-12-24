# tldr

## severity: blocker

never use gerunds like `existing` in variable names.

gerunds signal unclear domain thought. use explicit names like `userBefore`, `userFound`, or `orderCreated` that force clarity about the domain model.

---
---
---

# deets

## .what

forbid gerund forms (words ending in `-ing`) in variable names. they signal unclear domain thought.

## .why

- gerunds indicate the domain model was not thought through
- vague names like `existing` hide temporal state: existing when? before or after?
- they are a lead indicator of domain model issues that compound downstream
- explicit names (`userBefore`, `userFound`) force clarity about the domain

## severity: blocker

gerunds signal unclear domain thought. they are a lead indicator of domain model issues that compound into costly refactors.

## .where

- applies to all variable names in business logic
- especially important in update/upsert flows where before/after state matters
- applies to domain object references and database query results

## .how

search for patterns:
- `existing*` — replace with `foundBefore` or `*Before`
- `running*` — replace with `isActive` or `hasStarted`
- `pending*` — replace with `needsApproval` or explicit state

common replacements:
| gerund            | replacement                       |
| ----------------- | --------------------------------- |
| `existingUser`    | `userBefore`, `userFound`         |
| `existingInvoice` | `invoiceBefore`, `invoiceFound`   |
| `runningProcess`  | `processActive`, `processStarted` |

## .examples

### positive

```ts
// clear temporal state
const userBefore = await userDao.findByUuid({ uuid });
const userAfter = userBefore.clone({ phone: newPhone });

// clear capture point
const invoiceFound = await invoiceDao.findByRef({ ref });
if (!invoiceFound) return BadRequestError.throw('invoice not found');

// clear lifecycle state
const orderCreated = await orderDao.insert({ order });
```

### negative

```ts
// ⛔ "existing" is vague
const existingUser = await userDao.findByUuid({ uuid });
// existing when? before what operation?

// ⛔ gerund hides state
const runningJobs = await jobDao.findActive();
// are these currently running or were they running?
```

## .note

prefer `[noun][state]` order per the `name:treestruct` tactic:
- `userFound` not `foundUser`
- `invoiceBefore` not `beforeInvoice`

this enables autocomplete groups by domain noun.
