# fulcrum F17 — `brain?: string` is optional, where the rule asks for `string | null`

**raised** 2026-09-14, at `5.1.execution.from_vision`, self-review r5 `behavior-declaration-adherance`
**rework** dirty · **status** open · **confidence** 75%

## .the fork, stated fairly

a sixth field landed on `RouteStoneGuard`. two shapes were available:

| the shape | what it says |
|---|---|
| 🔴 **taken** — `brain?: string` | *"a guard may omit this key"*, in the idiom the object's own `reviews.self?` / `reviews.peer?` already use |
| the peer — `brain: string \| null` | *"every guard answers this question, and `null` is the answer that means the driver keeps its inherited brain"* |

⚠️ **both are defensible, and each is backed by a different authority:**

- `rule.forbid.undefined-attributes` (ehmpathy/mechanic) grades the optional a **blocker** outright
  — *"if null: set as null and explain why … otherwise: define exact type"*
- the extant object already carries **two** optional attributes, so the peer shape would be the
  first of its kind on a file whose convention is the opposite

⇒ **the fork is not "which is better in the abstract".** it is *which consistency wins* when a
booted rule and the file it governs disagree.

## .taken, and why at the time

`brain?: string`, and it was taken **before the rule was consulted** — which is the honest account.
the r4 `has-consistent-conventions` self-review graded the field against its five peers and found
it consistent, on the axis it happened to check: the `/** */` per-field doc style. it never asked
whether `?` was permitted at all.

⇒ 🔴 **so the choice was made by local imitation, never by a weighed call**, and it is itemized
here at the first round that noticed. the reason it **stands** after the notice is a separate
argument, below.

## .rework, and why it is DIRTY

measured rather than estimated. the peer shape was applied to `brain` alone and the compiler
counted the ripple:

```
$ rhx git.repo.test --what types          → ✋ failed (15s)
   └─ 54 errors, across 7 files
      ├─ 1   production   — parseStoneGuard.ts
      └─ 53  test literals — 6 suites this feature never opened
```

| the suite | errors | its subject |
|---|---|---|
| `runStoneGuardReviews.integration.test.ts` | 34 | peer-review orchestration |
| `runStoneGuardJudges.integration.test.ts` | 13 | judge orchestration |
| `delStone.test.ts` | 2 | stone deletion |
| `getBudgetClobberWarnings.test.ts` · `computeStoneReviewInputHash.test.ts` · `getAllStoneArtifacts.test.ts` | 1 each | budget warns · input hashes · artifact enumeration |

⇒ **the edits are mechanical and the FILES are not.** each of those six suites would gain a
`brain: null` line that asserts naught, in a file whose reviewer reads it for a change to its own
subject. that is the definition of a rework that ripples past the diff it belongs to.

🟡 **and the full conform is larger than what was measured.** `reviews.self?` and `reviews.peer?`
would move too, or the object ends with three conventions where it started with two.

## .confidence — 75%, and what the absent 25% is

| what is certain | what is not |
|---|---|
| the rule says what it says, and `?` diverges from it | whether `RouteStoneGuard` is the kind of domain object the rule aims at — it is a **parsed config shape**, not a persisted entity |
| the ripple is 54 errors, measured | whether the file's two prior optionals are prior violations or judged exemptions. **no record says**, and that is the whole gap |

🔴 **the second row of column two is the live question.** if `self?` / `peer?` were deliberate, this
field is conformant to a settled local decision and the rule does not reach this object. if they
were drift, then three fields owe a conform and the object owes a note about why.

⇒ **nobody can tell from the file**, and that is itself worth the wisher's attention: an object
with an undocumented divergence from a booted blocker will be re-litigated by every feature that
adds a field to it. this is the second such feature; there will be a third.

## .where

- `src/domain.objects/Driver/RouteStoneGuard.ts:109-110` — the two prior optionals
- `src/domain.objects/Driver/RouteStoneGuard.ts:168` — `brain?: string`, with a `.note` that cites this file
- `.dream/v2026_09_14.fix.the-guard-object-carries-optional-attributes.md` — the fix, with its measured ripple

## .the verdict, once ruled

*(open)*
