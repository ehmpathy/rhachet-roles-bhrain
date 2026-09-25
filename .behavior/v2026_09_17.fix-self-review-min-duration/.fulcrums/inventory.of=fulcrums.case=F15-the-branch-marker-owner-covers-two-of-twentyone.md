# fulcrum F15 — the branch-marker owner covers 2 of 21 derivations

- **case** = F15
- **title** = the branch-marker owner covers 2 of 21 derivations
- **rework** = clean
- **status** = OPEN
- **confidence** = 85%
- **raised** = 2026-09-18, by the `arch-opport-decomposition` peer review (nitpick.1) on
  `5.1.execution.from_vision`

## .the fork, stated fairly

`asTreeBranchMarkers` owns the elbow/stem derivation. it is wired at **two** call sites —
`formatTreeBucket` and `formatSelfReviewRoster` — and the repo holds the identical derivation in
**19 further prod files**, `contract/cli/goal.ts` alone with about a dozen.

```ts
export const asTreeBranchMarkers = (input: {
  isLast: boolean;
}): { elbow: string; stem: string } => ({
  elbow: input.isLast ? '└─' : '├─',
  stem: input.isLast ? '   ' : '│  ',
});
```

the lane reads that as a **premature extract** under `rule.prefer.wet-over-dry` — *wait for 3+
usages* — and tables two options: wire the 19, or inline the two back.

| | A — wire all 21 | B — inline the two back | ✅ C — the owner, plus a dream for the 19 |
|---|---|---|---|
| files this round opens | 🔴 **21**, across `contract/cli/`, `goal.ts`, and four subsystems the wish never named | 2 | **2** — both already in the diff |
| passes the CLEAN test of `rule.always.fix-forward-under-scouts-honor`? | 🔴 **no.** it is the smuggled refactor that rule names by that word | ✅ yes | ✅ yes |
| does the count stop to grow? | ✅ yes | 🔴 **no** — the next author adds a 22nd | ✅ yes — a new site has an owner to call |
| is the deferral on the record? | — | 🔴 no record at all | ✅ a dream, symlinked at the route |
| new defect? | 🔴 a 21-file diff in a wish about a review gate | 🔴 two known duplications restored deliberately | the second variant the lane names |

## .taken, and why AT THE TIME

**C — keep the owner, catch the 19 as a dream, and say so on the operation's own page.**

🔴 **the lane's rule cite counts the wrong quantity.** `rule.prefer.wet-over-dry` waits for 3+
**usages of the pattern** before an abstraction is warranted. the pattern has **21** usages. so the
rule's own trigger is met seven times over, and the abstraction is **late** rather than premature —
the lane read *"2 call sites wired"* as *"2 usages"*, and those are different numbers.

🟡 **and `rule.prefer.most-common-denominator` prescribes exactly what shipped**: create at the leaf,
and *"lift to the common ancestor immediately"* on the second use. the two wired sites are both under
`guard/tree/`; the owner sits at their common ancestor. the 19 sit under other ancestors, and the
rule's `.when to lift` row is *proven* reuse, never a mandate to sweep every cousin.

⇒ **so the fork as tabled is short an option**, which is a shape this round has already paid for
once (`F01`). option C is what `rule.always.fix-forward-under-scouts-honor` prescribes verbatim: the
cheap in-scope fix now, the costly out-of-scope one deferred **with a record**.

🟡 **what is conceded inside the refusal.** the lane's live observation is real and is not answered
by any of the above: **19 sites are now a distinguished second variant.** a reader who greps `'├─'`
finds 19 hits and no owner among them, and cannot tell a site nobody has reached from a site
deliberately left. that is why the operation's docblock states the boundary in its own text —
*"the owner exists so the count stops to grow, never as a claim that it has shrunk"* — rather than
let the two wired sites imply a completeness the owner does not have.

## .rework, and why

**clean.** three ways at once:

- to **wire the 19** later is additive — each site's change is one import and one destructure, and
  no call signature moves
- to **inline the two back** is a revert of one file plus two call sites
- the dream carries the full recipe, so neither direction needs the context re-derived

## .confidence, and why it is 85% rather than higher

1. 🟡 **the lane's second-variant concern has no clean answer, only a cheaper one.** C accepts a real
   inconsistency for the life of the dream, and a council that values one canonical form over scope
   discipline rules A
2. **the 19 were counted, never converted**, so the estimate of *"one import and one destructure"*
   per site is a read rather than a measurement. `goal.ts` may hold variants the owner does not fit
3. the drive is the party that both wrote the owner and graded its own deferral, which is the
   position a fulcrum exists to expose

what holds it at 85%: the rule the lane cites, read on its own terms, **argues for the extraction**
at 21 usages rather than against it — and the only option that both keeps the extraction and
respects this round's scope is the one taken.

## .where

- the operation: `src/domain.operations/route/guard/tree/asTreeBranchMarkers.ts`
- the wired sites: `formatTreeBucket.ts`, `formatSelfReviewRoster.ts`
- the deferral: `.dream/v2026_09_18.fix.tree-branch-markers-are-derived-in-nineteen-more-files.md`,
  symlinked at `$route/dreams/`
- the concern: `…r004._.given.by_peer.arch-opport-decomposition.report.md` nitpick.1
- the answer: `…r004._.taken.by_self.arch-opport-decomposition.md`

## .the verdict, once ruled

_unruled._

⇒ if the council rules **C**, record that a partial owner plus a dream is the accepted shape for a
cross-subsystem duplication, and consider whether `rule.always.fix-forward-under-scouts-honor` owes
that boundary an example on its own page.
⇒ if the council rules **A**, the dream holds the recipe and the sweep is one pass.
⇒ if the council rules **B**, record that two known duplications are restored deliberately, and that
the owner is to be re-created only once a third in-scope site appears.
