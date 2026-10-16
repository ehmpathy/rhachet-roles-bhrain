# F5 — how deep the `fleet` → `grove` rename reaches

## .the fork

`fleet` is a **declared forbidden synonym** of `grove` (`term=git.grove`). the execution stone's
plan (`A9`) deferred the rename as *"a dir rename ripples every import and repairs no defect the
vision named."*

that judgment is wrong for the part the rule binds, and the correction is not the fork. the fork is
**how far the correction reaches**, and it has four candidate depths:

| depth | what moves | verdict |
|---|---|---|
| 1 | naught — leave it, it is only a dir name | 🔴 refused: it is a **contract** |
| 2 | dop + type names only (`genReviewFleetReport`, `ReviewFleetReport`) | partial |
| 3 | **+ the dir, + the surface strings, + the comment prose** | ✅ **taken** |
| 4 | + `meter/` → `cost/breadth=tree/`, the whole dir scheme `A9` proposed | 🔴 deferred |
| 4b | + the **dop and type names** that carry `Meter` where the breadth is `tree` | 🔴 deferred |

🔴 **`4b` was implicit and is now named.** `A9` and this entry both spoke of depth 4 as *"the dir
scheme"*, which reads as a question about one directory. it is not: the same instrument-vs-breadth
choice sits in four **contracts** that no dir move would touch —

| the name | what it is | what it renders |
|---|---|---|
| `genReviewMeterReport` | a dop | the **tree** report |
| `genReviewMeterStdout` | a dop | the **tree** report |
| `ReviewMeterReport` · `ReviewMeterBucket` | internal contracts | the **tree** report |

⇒ **so the three positions of the `breadth` axis are named on two different axes**:
`genReviewRunStdout` (breadth) · `genReviewMeterStdout` (**instrument**) · `genReviewGroveStdout`
(breadth). that is the identical defect `F1` named at the command layer, one layer down — and it
is invisible from the dir question, which is why it went unstated.

🟡 the names that keep `Meter` **correctly** are the instruments themselves — `getOneReviewRunMeter`,
`getAllReviewRunMeters`, `ReviewRunMeter`. there `meter` is the act, not a breadth. so `4b` is not
a sweep of the word; it is a rename of the four that name a breadth with it.

## .what was taken, and why at the time

**depth 3**, on 2026-09-21.

depths 1 and 2 are settled by rule rather than judgment: `rule.forbid.domain-term-synonyms` grades
a forbidden synonym in *"a dobj/dop name, an internal contract, or a published external interface"*
a **blocker**. `genReviewFleetReport` is a dop name; `ReviewFleetReport` is an internal contract.
so 1 is refused outright and 2 is the floor, never a choice.

the judgment sits between 2 and 3, and between 3 and 4:

- **2 → 3** — the rule explicitly permits a synonym *in a comment*. so the comment prose could have
  stayed. it did not, on two grounds: the dir itself is a path a `.refs` line cites (and
  `term=git.grove`'s own `.refs` cited `review/fleet/getAllReviewTrees.ts` — **the glossary entry
  that forbids the word pointed at a path that carried it**), and one live **stdout string** read
  `'   the fleet total'`, which is a published surface, never a comment
- **3 → 4** — `meter` is **no declared synonym of aught**. `A9`'s `cost/breadth=tree/` scheme is a
  structural preference with no rule behind it, and it would ripple every `meter/` import for no
  defect. deferred, unchanged

## .the rework grade

**clean.** every file the rename touched is new and unreleased on this branch (`A` in git status),
so no consumer holds the old names and no published export changed. the whole move is a
find-and-replace plus six `mvsafe` calls, verified by `types` + `lint` + `unit`.

⇒ depth 4 stays clean too, for the same reason — it can be taken later at the same cost.

## .confidence

**95% / 60%**

- **95%** that depths 1 and 2 were wrong to defer. the rule is explicit and the files are contracts
- **60%** that depth 3 is the right place to halt. the argument for 4 is real — the vision's own
  `breadth` axis has three positions and the dir scheme expresses two (`meter/` serves both `run`
  and `tree`), which is a smaller echo of the very defect `F1` named. what holds it back is that
  `meter` names an **instrument**, never a breadth, so `cost/breadth=tree/` is not obviously truer
  than `meter/` — it is differently framed

🟡 the 60% is where a reviewer should look. if `A9` depth 4 is right, this drive halted one step
short of the coherence it spent the whole round on.

🔴 **and `4b` lowers that 60%, without settling it.** the dir argument really is a wash — `meter/`
names an instrument layer that also holds `asAccountedCost`, `asPromptSectionChars`, and
`getSharedPrefixBytes`, none of which is a breadth, so `cost/breadth=tree/` would be *wronger* for
those. the **dop** argument is not a wash: `genReviewMeterStdout` renders one breadth and names an
instrument, beside two peers that name their breadth. ⇒ the two halves of depth 4 point opposite
ways, which is precisely why they must be ruled separately rather than as one "dir scheme".

## .where

- `src/domain.operations/review/grove/` — was `fleet/`; all four files plus two test files
- `src/contract/cli/review._.cost.ts` — the two imports and the `--of grove` dispatch
- `.agent/repo=.this/role=any/briefs/domain.terms/term=git.grove._.choice._.md` — the `.refs` path
- `.agent/repo=.this/role=any/briefs/research.review-cost-and-cache.md` — 13 prose uses + the
  `.see also` paths
- `.agent/repo=.this/role=any/briefs/rule.require.distinguish-every-review-input.md`
- `.agent/repo=.this/role=any/briefs/rule.require.name-the-shared-prefix-as-the-cache-anchor.example=…`
- `.dream/v2026_09_18.verify.…` · `.dream/v2026_09_20.feat.eleven-lanes-…` ·
  `.dream/v2026_09_19.feat.the-tail-order-…` · `.dream/v2026_09_20.verify.a-new-files-…`
- `src/domain.operations/review/meter/genReviewMeterStdout.test.ts` — one comment

🟡 **five live `fleet` uses were left, deliberately** — each is a **different sense** of the word,
never the git-container sense:

| where | the sense |
|---|---|
| `rule.require.name-the-shared-prefix-…` — *"a serverless fleet hands each call an arbitrary replica"* | a fleet of servers |
| `philosophy.a-review-budget-…` — *"the fleet pays full review cost"* | the org |
| `rule.always.concede-with-a-severity` — *"how the fleet tells the two kinds apart"* | the org |
| `define.invariant.review.peer.budget.urgent-earns-budget` — *"the trade the fleet pays for"* | the org |
| `getStoneConcededLaneSlugs.test.ts` — *"weighs the fleet down"* | the org |

a sweep that took those would have coined a wrong sense.

🟡 **and the boundary is not always obvious.** two dreams read *"every review the fleet runs"* and
*"across the fleet"*, which parse as the org and sit in a document whose subject IS the set of
trees. both were taken as the container sense. ⇒ the discriminator is the **document's subject**,
never the sentence alone — which is why a find-and-replace could not have decided any of the seven.

## .the verdict

OPEN at depth 4, on **two independent halves** — `4` (the dir scheme) and `4b` (the dop and type
names). depths 1–3 are taken and need no verdict; the rule settles them.

🟡 **`4b` is clean rework at the same cost as depth 3** — every one of the four names is new and
unreleased on this branch, so the move is a find-and-replace plus a snapshot rename, verified by
`types` + `lint` + `unit` + `acceptance`. it is held for the council rather than for cost.
