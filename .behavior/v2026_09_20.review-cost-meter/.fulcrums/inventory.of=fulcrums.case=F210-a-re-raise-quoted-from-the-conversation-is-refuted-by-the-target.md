# F210 — a re-raise quoted from the conversation section is refuted by the target bytes

- raised 2026-10-10, from i036 r009 nitpick.1 `[nitpick][better]`: two scoped-zone notes omit a
  mutated variable — `modesTyped` in `parseReviewArgs`, `currentPeerSlug` in
  `updateGuardPeerBudgets`
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **90%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — concede and re-repair** | the reviewer read the note as incomplete, so add the names again |
| **B — refute from the file** | both names already sit in both notes; the snippet the reviewer quoted is the prior round's text, carried in the conversation section |

## .taken, and why

**B.** the target holds both names: `src/contract/cli/review.ts:385` lists `` `modesTyped` `` in the
scoped-zone note, and `src/contract/cli/route.ts:2004` lists `` `currentPeerSlug` ``. the
reviewer's own `route.ts` snippet shows `currentPeerSlug` in the note it calls incomplete, and its
`review.ts` snippet matches the prior round's text, which the prompt carries in its
`<conversation>` block, not the `<target>`. to re-add a name that is present changes no byte, so a
concession would buy no fix — only a tally entry for a defect that does not exist.

the route.ts note was also reflowed this round so the name no longer sits past column 100 on one
long line, where a skim might miss it.

## .rework, and why

**clean.** if the council reads it otherwise, the cure is one comment line per file.

## .confidence, and why it is not higher

the mechanism — a weak reviewer quotes a stale conversation snippet as the target — is inferred
from the two snippets, not traced in the reviewer's own chain of thought. it is a loop candidate:
the conversation section may need a marker that its code quotes are history.

## .where

`src/contract/cli/review.ts:385` · `src/contract/cli/route.ts:2003` ·
`.behavior/v2026_09_20.review-cost-meter/.reviews/peer/5.1.execution.from_vision._.review.i036.3ae0e70effe55c727d.r009._.given.by_peer.arch-hazards-maintenance.report.md`

## .verdict

(open)
