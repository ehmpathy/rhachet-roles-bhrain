# rule.require.review-standardization-at-parse

## .what

all reviews (self and peer) must be converted to structured format at parse time. downstream code must never branch on "is this structured or unstructured".

## .why

- **single code path**: all downstream operations work with one shape
- **no special cases**: formatters, meters, verdicts all receive identical structures
- **debuggable**: any review bug is in parse logic, not scattered across consumers
- **extensible**: new review features (levels, budgets) work for all reviews automatically

## .the rule

### parseStoneGuard must output

```ts
result.reviews = {
  self: StructuredSelfReview[],
  peer: StructuredPeerReview[],
};
```

where every review has explicit:
- `slug`: derived from command if unstructured
- `run`: the command to execute
- `budget`: `Infinity` if unstructured
- `level`: `1` if unstructured

### downstream code must NOT

- check if `review.slug` exists
- check if `review.budget` exists
- check if `review.level` exists
- branch on "structured vs unstructured"
- derive slug from command string (already done at parse)

## .slug derivation for unstructured reviews

unstructured reviews derive slug from the command:

```ts
cmd.split(/\s+/)[0] ?? `peer-${index + 1}`
```

examples:
- `bash .test/review.sh` → `bash`
- `/path/to/custom-review.sh` → `/path/to/custom-review.sh`
- `rhx review ...` → `rhx`

## .enforcement

| violation | severity |
|-----------|----------|
| downstream code checks for optional review fields | blocker |
| downstream code derives slug from cmd | blocker |
| parseStoneGuard outputs optional fields | blocker |

## .see also

- `parseStoneGuard.ts` — where standardization happens
- `runStoneGuardReviews.ts` — consumes standardized reviews
- `formatGuardTree.ts` — displays standardized reviews
