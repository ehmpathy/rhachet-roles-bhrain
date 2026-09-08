# rule.forbid.thorough-test-runs

> **never pass `--thorough`. only the tests your change impacts are ever relevant, and the
> default already computes exactly that set.**

`rhx git.repo.test` without `--thorough` adds `--changedSince <trunk tip>`, and jest diffs
against the **merge-base** — so the selected set is *this branch's own changes*, and no more.
`--thorough` deletes that bound and runs every suite in the repo.

⇒ **it is a subtraction dressed as an addition.** it removes the one piece of knowledge the
run had about your work.

## 🔴 .why — a wider run is not a stronger one

| what `--thorough` adds | what it is worth |
|---|---|
| suites your branch never touched | 🔴 **anti-signal.** a red suite you did not touch is a fact about `main`, not about you |
| wall-clock, serially, on one machine | the sharded cicd gate already runs the same assertions, in parallel |
| the sense of a complete check | 🔴 **the whole harm.** it substitutes breadth for the question *which test covers this change?* |

**the sharp case is the third row, and it costs a diagnosis.** a run that grades 100 suites and
returns one red hands you a haystack; a run that grades the 3 suites your diff touched and
returns one red hands you the defect. **the narrower run is the more informative one** — that is
the claim, and it is why this is a forbid rather than a budget plea.

⚠️ this is `rule.always.diagnose-reviewer-malfunctions`'s measured lesson on a second surface: an
**unbounded** scoped review returned `112` targets against a delta of `21` files, and every item
it raised named code that predates the branch. **a scope flag that silently drops its bound
returns plausible observations about work that is not yours.** `--thorough` drops the same bound,
on purpose.

## 🔴 .the trap — the tool itself recommends it, for the wrong diagnosis

when zero tests select, `git.repo.test` prints:

```
🥥 did you know?
   ├─ jest --changedSince may miss some file changes
   └─ use --scope and --thorough to target tests directly
```

⇒ **half of that line is right and half is the defect.** zero-selected means the change detection
did not see your file. `--scope 'path://<the file>'` **names** the file, so the run tells you
which one was missed. `--thorough` runs all of them, so it never tells you — the symptom is
buried under a green wall.

⚠️ **the tool's own suggestion is not a warrant.** the remedy for an absent selection is a
**named** selection. that row is dreamed for repair upstream:
`.dream/v2026_09_07.reseed.the-zero-selected-tip-recommends-thorough.md`.

## .the test — one question, before any test run

> **"which test does this change impact?"**

- you can **name** it → `--scope 'path://<that file>'`. the tightest loop there is
- you can name a **directory** → `--scope 'path://<that dir>'`
- you **cannot name one** → 🔴 you do not yet know what you changed. read the diff.
  `--thorough` will not tell you either — it runs the tests you did not name **alongside** the
  ones you did, and reports them identically

## .reach for these instead

| you want | reach for |
|---|---|
| the tests my change touched | **the default** — no flag. it is already `--changedSince` |
| one file | `--scope 'path://<file>'` |
| one case within that file | `--scope 'path://<file>' --scope 'name://<case>'` |
| the whole suite, as a gate | **push.** cicd shards it — that is what the gate is for |
| a suite the change detection missed | `--scope 'path://<the missed file>'`, never `--thorough` |

## ⚠️ .the bound — this forbids the FLAG, never the coverage

the full suite still runs, every push, sharded across cicd runners, and it is the real gate
(`rule.prefer.scoped-tests-locally`). **this rule does not license a thin gate** — it says a
local re-run of that gate buys no coverage the gate does not already buy, and costs the
narrowness that makes a local run useful.

⇒ *"I want to be sure"* is answered by the push, never by `--thorough`.

## .enforcement

- `--thorough` passed to `git.repo.test`, in any invocation = **blocker**
- a brief, readme, skill, or comment that **recommends** `--thorough` = **blocker**
  (the recommendation is the mechanism by which the flag survives)
- a zero-selected run answered with `--thorough` rather than a named `--scope` = **blocker**

## ⚠️ .this copy is a MIRROR — the durable home is the mechanic

`git.repo.test` and its `--thorough` flag belong to `ehmpathy/rhachet-roles-ehmpathy`,
`role=mechanic`. **a forbid that lives away from the surface it governs is a forbid its readers
never boot** — every other repo that enrolls the mechanic still reads
`howto.run-tests.[lesson].md:19`, which lists `--thorough` as a first-class command with no
caution beside it.

⇒ re-seeded there as `ehmpathy/rhachet-roles-ehmpathy#663`, with three coupled asks: adopt this
rule, repair that lesson, and drop the flag from the zero-selected tip.

**this copy binds THIS repo until that lands**, and it is not this repo's to evolve — a change
here that does not also move `#663` re-opens the drift it was written to close.

## .see also

- `rule.prefer.scoped-tests-locally` — the positive pair: how to scope, the `path://` vs
  `name://` lever, and the `--resnap` snapshot-prune footgun
- `rule.always.diagnose-reviewer-malfunctions` (driver) — the same dropped-bound defect,
  measured on the review surface
- `rule.forbid.hand-run-reviews` (driver) — the twin forbid: a review-scope change made by
  the party under review
