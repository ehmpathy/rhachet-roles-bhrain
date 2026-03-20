# self-review r8: has-play-test-convention

eighth pass: when would journey tests be needed?

---

## journey test use cases

journey tests (`.play.test.ts`) are appropriate when:

| use case | description | example |
|----------|-------------|---------|
| multi-step flow | user goes through steps | checkout → payment → confirmation |
| state accumulation | state changes across steps | cart adds items, calculates total |
| complex workflow | many decision points | approval flow with branches |

---

## does this feature need journey tests?

### check: multi-step flow?

the tea pause feature:
- appears in route.drive output
- user sees it and picks an option
- single interaction, not multi-step

**verdict:** no multi-step flow.

### check: state accumulation?

the tea pause feature:
- is a pure format function
- no state to accumulate
- input → output transformation

**verdict:** no state accumulation.

### check: complex workflow?

the tea pause feature:
- shows three options
- user picks one
- no branch logic in feature itself

**verdict:** no complex workflow.

---

## conclusion

journey tests not needed because:
- no multi-step flow
- no state accumulation
- no complex workflow

the feature is a pure format function.

criterion is n/a.

