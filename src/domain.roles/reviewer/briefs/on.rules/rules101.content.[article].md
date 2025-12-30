# rules content

## .what

rules follow a two-section structure that separates quick reference from detailed guidance.

## two-section structure

every rule has two sections separated by a triple separator:

```md
# tldr

[quick reference content]

---
---
---

# deets

[detailed content]
```

## # tldr section

the tldr section provides at-a-glance understanding:

### ## severity header

```md
## severity: blocker
```

or

```md
## severity: nitpick
```

the severity must match the directive:
- `forbid` / `require` → `blocker`
- `avoid` / `prefer` → `nitpick`

### .what summary

immediately after severity, state what the rule is:

```md
## severity: blocker

never use positional arguments in procedure signatures

use named arguments via destructured input objects instead
```

### .why rationale

explain why this rule matters:

```md
positional arguments are fragile - adding, removing, or reordering parameters breaks callers.
named arguments are self-documenting and order-independent.
```

## # deets section

the deets section provides expanded guidance:

### ## .what (optional)

expanded explanation of what the rule covers.

### ## .why (optional)

deeper rationale, including tradeoffs and edge cases.

### ## severity (required)

repeat the severity and explain why this level was chosen, tying to hazard, time cost, and money cost.

for negative directives (`forbid`/`avoid`), explain the cost of violation:

```md
## severity: blocker

hidden errors reach production and cost hours to debug, damaging customer trust.
```

for positive directives (`require`/`prefer`), explain the benefit of compliance:

```md
## severity: blocker

fail-fast surfaces errors immediately with rich context, cutting debug time from hours to minutes.
```

### ## .where (optional)

scope or location where this rule applies:

```md
## .where

- all exported procedures in domain.operations/
- all public API endpoints
- exempt: anonymous inline callbacks
```

### ## .when (optional)

conditions under which the rule applies:

```md
## .when

- applies when defining function signatures
- applies when refactoring existing code
- does not apply to third-party API callbacks
```

### ## .how (optional)

guidance on detecting violations and applying the rule:

```md
## .how

search for patterns like:
- `function foo(a, b, c)`
- `const bar = (x, y) =>`

refactor to:
- `const foo = ({ a, b, c }: Input) =>`
```

### ## .note (optional)

caveats, edge cases, or special considerations:

```md
## .note

legacy code may still use positional args.
prioritize new code; refactor legacy opportunistically.
```

### ## .examples (optional)

concrete positive and negative patterns:

```md
## .examples

### positive

const setCustomerPhone = ({ customer, phone }: Input) => {
  return { ...customer, phone };
};

### negative

function setCustomerPhone(customer, phone) {  // forbidden
  return { ...customer, phone };
}
```

## complete template

```md
# tldr

## severity: blocker|nitpick

[.what summary - what the rule is]

[.why rationale - why it matters]

---
---
---

# deets

## .what

[expanded summary]

## .why

[expanded rationale]

## severity: blocker|nitpick

[for forbid/avoid: cost of violation | for require/prefer: benefit of compliance]

## .where

[scope/location]

## .when

[conditions]

## .how

[detection and usage guidance]

## .note

[caveats]

## .examples

### positive

[correct usage]

### negative

[violation]

## .citations

> [quote from origin feedback]

source: [github url]
```
