# F3 — `review.corpus` estimates a prompt we stopped sending

- rework = **clean** (a deletion; nothing outside this branch imports it, nothing released)
- status = OPEN — wisher raised the value question, driver found the defect
- confidence = **90%** that it must not ship as-is; **65%** that deletion beats repair

## .the cue

the wisher asked, plainly: *"i dont see the value of 'corpus'"*.

the honest first answer was a tradeoff table. then the code was checked, and the answer got
much shorter: **it reports a figure that is no longer true.**

## 🔴 .the defect, precisely

`genReviewCorpusReport.ts:300-305` sums `charsOfDiffsForNew` **unconditionally**:

```ts
if (kind === 'new')
  return {
    ...sums,
    charsOfDiffsForNew: sums.charsOfDiffsForNew + charsOfDiff,
    charsOfFilesForNew: sums.charsOfFilesForNew + charsOfBody,
  };
```

it never consults `isTargetDiffSent`. but the renderer now **drops every new-file diff** —
that is the branch's largest shipped lever. so the report's headline finding:

```
├─ new:    diff   792.7k  body   743.3k  ← the diff IS the body
└─ redundant: 792.7k  (39.7% of every prompt)
```

describes a prompt `renderPushTarget` stopped sending. the true figure today is **~0%**.

### 🔴 and it is the FOURTH OBLIGATION, violated in a second place

*measure what was SENT, never what was held* — the rule written on this very branch
(`rule.require.distinguish-every-review-input`). `getOnePromptComposition` was repaired by
extraction of `isTargetDiffSent` into a decision both the renderer and the census read.
**`review.corpus` was never wired to that decision**, so the defect survives in the one
surface nobody re-checked.

⚠️ worse: the stale output was pasted into `1.vision.yield.md` **during this session**, as
`case=5`'s aha moment, presented as live evidence. the driver ran the tool, read a
confident number, and did not ask whether the tool knew about the lever the driver had
shipped an hour earlier.

## 🔴 .and `corpus` was a FORBIDDEN SYNONYM before the command shipped

`term=review.scope._.choice._.md:10` lists `corpus` under `term.synonyms.forbidden` — it is a
banned alias for `scope`, the file set one review reads.

⇒ so the command violated `rule.forbid.domain-term-synonyms` **at the moment it was named**,
in a published cli surface, which is the most expensive place to drift. no one caught it: not
the author, not the glossary sweep, not a reviewer.

🟡 **the deletion is over-determined, and this is the ground that should have fired first.** a
stale figure takes a run and a re-read to notice; a forbidden synonym is a `grep` of the
glossary at the moment a name is chosen. ⇒ the lesson is not about this tool — it is that
**a new cli name is a contract, and no step checked it against the glossary.**

## .the value question, answered

| the argument to keep it | verdict |
|---|---|
| *"works on a cold branch, with no logs"* | 🟡 true, and unasked. a reader runs the review; the meter then answers |
| *"it found the 39.7% redundancy"* | ✅ it did — **once**. the question is closed, the lever shipped. the finding belongs in `research.review-cost-and-cache`, dated, not in a live tool |
| *"it catches broken globs"* | 🔴 a **guard lint**, not a cost concern. it rides here only because this tool happened to resolve globs |
| *"it attributes chars per input"* | 🔴 **superseded** by `metrics.compiled.json`, which measures the rendered prompt per real run rather than an estimate from guard globs |

## 🟡 .but it was not valueless — it was the WRONG FILL for a REAL gap

the corrected experience walk (`1.vision.experience.dimensions.md`) exposes four empty
cells, all in one column: **`chars` above `run` scope.**

| | `chars` | `cost` |
|---|---|---|
| `run` | ✅ the census | ✅ realized |
| `tree` | 🔴 **gap** | ✅ the meter |
| `fleet` | 🔴 **gap** | ✅ the fleet |

⇒ *"across this tree, what share of chars is target files?"* is a real question with no
surface. `review.corpus` answered it **by estimate from declared globs** instead of by
roll-up of what was measured — and an estimate is exactly what drifts when the renderer
changes, which is what happened.

## .the shape of the fix

**take the deletion**, and fill the gap honestly:

1. delete `src/contract/cli/review.corpus.ts`, `src/domain.roles/reviewer/skills/review.corpus.sh`,
   and `src/domain.operations/review/corpus/**`
2. keep the 39.7% figure in `research.review-cost-and-cache`, dated, as the evidence that
   justified `isTargetDiffSent` — a finding, not an instrument
3. re-home `broken globs` to `.dream/v2026_09_19.fix.142-guard-globs-cite-paths-no-file-answers.md`,
   which already carries that case and wants a **guard lint**
4. fill the `chars × {tree,fleet}` gap by a roll-up of `metrics.compiled.json` — measured,
   and structurally incapable of the drift that produced this fulcrum

## .the counter-argument, stated fairly

repair is a one-line change: call `isTargetDiffSent` from the corpus fold. that would make
the figure true again and keep the cold-branch capability.

⇒ it is rejected on **two** grounds, and the second is the load-carrying one:

1. the capability has no demonstrated consumer — nobody asked the pre-run question
2. 🔴 **the drift will recur.** the corpus re-derives what the renderer decides. every future
   render change owes a matching corpus change, and nothing forces the pair. a roll-up of
   `metrics.compiled.json` cannot drift, because it reads what the renderer actually wrote

## .why it was not halted on

**clean rework.** nothing outside this branch imports it; the names were never released;
`#398` does not cite `review.corpus`. and the alternative — to ship a tool that states a
false figure — is strictly worse than either branch of the fork.

## .where

- `src/domain.operations/review/corpus/genReviewCorpusReport.ts:282-319` — the defect
- `src/domain.operations/review/isTargetDiffSent.ts` — the decision it does not read
- `.behavior/v2026_09_20.review-cost-meter/1.vision.yield.md` — where the stale figure was cited
- `.agent/repo=.this/role=any/briefs/rule.require.distinguish-every-review-input.md` — the rule broken

## .the verdict

✅ **DELETE**, ruled by the wisher 2026-09-21 (`S5`): `review.corpus` is removed explicitly,
not repaired.

the driver's guess was deletion at 65%. the ruling takes it, and the load-carrying reason is
the second one above: **the corpus re-derives what the renderer decides**, so a repair fixes
today's figure and leaves the drift mechanism intact.

⇒ what the deletion owes, per `.the shape of the fix`:

| # | the obligation | where it lands |
|---|---|---|
| 1 | delete the cli, the skill, and `domain.operations/review/corpus/**` | the execution stone |
| 2 | keep the 39.7% figure as a **dated finding**, never a live tool | `research.review-cost-and-cache` |
| 3 | re-home `broken globs` to the guard-lint dream that already carries it | `.dream/v2026_09_19.fix.142-guard-globs-…` |
| 4 | leave the `chars × {tree,grove}` gap **open and named** | the experience inventory |

🟡 obligation 4 is the one a deletion makes easy to lose. the gap was real before this tool
existed and is real after it goes; what the ruling rejects is the **estimate**, never the
question. an inventory row that silently drops with the tool would hide a gap this drive paid
a fulcrum to find.
