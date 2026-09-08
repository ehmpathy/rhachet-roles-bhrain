# seed S19 — a blocker is a release claim, never a correctness claim

## .said — verbatim, 2026-09-07

> can we take this opportunity to update the reviewer briefs to make a rule to forbid overzealous
> blockers? i.e., we must truely decide, especially after 3 rounds, whether a blocker should block a
> feature from release - or if its actually just a nitpick that we should ideally do for perfection

> would that help

## .settled

**a blocker asserts *"do not ship."* it is graded against release harm, never against correctness.**

`contract.reviewer-output` supplies two severities and no third. this settles **where the line sits**:

| the point is | the grade |
|---|---|
| true, and its presence in production harms a user or an operator | **blocker** |
| true, violates a declared rule, and harms no one once shipped | **nitpick** |
| true, and you cannot name the harm | **nitpick** — an unnameable harm is not a harm |

⚠️ **a rule's own `severity: blocker` header is the author's default for the CLASS, not a verdict on
your instance** (`rules101.content`). a reviewer that reads the header and stops has not graded.

## 🔴 .the round count is evidence about the GRADE, not only about the driver

after three raises without convergence, exactly three explanations fit, and the reviewer must choose
one on the page before a fourth: the driver **misunderstood** it (re-state, keep the blocker) · the
driver **cannot close** it (re-grade) · it is **correct and cosmetic** (re-grade).

## ⚠️ .the honest answer to *"would that help"* — partly, and it is measurable

three blockers were worked on this stone. one is a genuine mis-grade:

| blocker | holds a release? |
|---|---|
| a snapshot pins `malfunctioned 💥` for cases whose keys read *"the guard approves"* | ✅ **yes** — a false green ships |
| a CLI's stdout pinned by `toContain` rather than a full snapshot | ⚠️ arguable |
| 🔴 **three `runStoneGuardReviews` calls share `hash: 'testhash'` in one integration test** | 🔴 **no.** tidiness in a test file — and **unclosable**, so it held the stone |

⇒ **the third is the case exactly**: correct on its rule, graded blocker, no user harmed, and beyond
the driver's reach.

⚠️ **and the scope claim must stay honest.** the five `l1` points on this stone are `constraint`
overflows — an engine defect, not a mis-grade — so the rule would not have touched them. **it repairs
a real failure that repeats, and it was not this stone's main lever;** the guard edit was.

## .the bound

**a real blocker stays a blocker under every pressure.** `philosophy.verification-strictness` holds
in full. the target is a MIS-GRADE, never a defect — and the discipline that catches an over-grade
(*name the harm*) is the same one that catches an under-grade.

## .landed

- `src/domain.roles/reviewer/briefs/rule.forbid.overzealous-blockers.md`
- `src/domain.roles/reviewer/boot.yml` — `say` tier, beside `contract.reviewer-output`
