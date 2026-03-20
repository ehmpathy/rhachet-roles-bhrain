# self-review r4: has-play-test-convention

fourth pass: guide checklist.

---

## guide checklist

from the guide:
> verify:
> - are journey tests in the right location?
> - do they have the `.play.` suffix?
> - if not supported, is the fallback convention used?

---

## question 1: are journey tests in the right location?

no journey tests exist for this feature.

**verdict:** n/a

---

## question 2: do they have the `.play.` suffix?

no journey tests exist.

**verdict:** n/a

---

## question 3: is fallback convention used?

this repo does not have journey tests at all.

```bash
glob: **/*.play.test.ts
result: no files found
```

the repo uses:
- `.test.ts` for unit tests
- `.integration.test.ts` for integration tests
- `.acceptance.test.ts` for acceptance tests

no `.play.` convention is used because no journey tests exist.

**verdict:** n/a — no journey tests in this repo

---

## conclusion

guide checklist complete:
- question 1: n/a
- question 2: n/a
- question 3: n/a (no journey tests in repo)

criterion is n/a.

