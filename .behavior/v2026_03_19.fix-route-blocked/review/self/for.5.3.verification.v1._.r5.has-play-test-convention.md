# self-review r5: has-play-test-convention

fifth pass: hostile reviewer perspective.

---

## hostile claim: "you should have created journey tests"

**response:**

journey tests are for multi-step flows:
- step 1 → step 2 → step 3 → outcome
- state accumulates across steps

this feature is a pure format function:
- input → output transformation
- no steps, no state accumulation
- single function call produces result

journey tests would be:
- inappropriate (no journey to test)
- wasteful (duplicates unit test coverage)

---

## hostile claim: "the test file should use .play. suffix"

**response:**

the `.play.` suffix is for journey tests.

the test file `stepRouteDrive.test.ts` uses `.test.ts` suffix because:
- it tests a pure function
- it follows unit test conventions
- it is not a journey test

---

## hostile claim: "other repos have journey tests, why doesn't this one?"

**response:**

journey tests are used when:
- features have multi-step user flows
- state changes need verification across steps
- end-to-end scenarios are complex

this feature:
- is a pure format function
- has no multi-step flow
- has complete unit test coverage

journey tests are not universally required.

---

## conclusion

hostile claims addressed:
- journey tests inappropriate for pure functions
- `.test.ts` suffix correct for unit tests
- journey tests not universally required

criterion is n/a.

