# F204 — the tree and grove group-by stays two copies

- raised 2026-10-10, from i035 r031 nitpick.1 `[nitpick][better]`: the tree fold
  (`getAllBucketsByKey`) and the grove fold (`asRollup`) each carry the same group-by loop, and the
  tree fold keys its axes through inline callbacks where the grove fold keys through a `Record`
- rework: clean
- status: 🟡 **BEST-GUESSED — disputed; overrule it to extract the grouper now**
- confidence: **70%**

## .the fork, stated fairly

| option | the claim |
|---|---|
| **A — extract `getAllGroupsByKey` now** | one grouper, and an absent axis fails to compile in both folds |
| **B — leave two copies** | two usages sit under the rule of three (`rule.prefer.wet-over-dry`); each fold's row shape is reserved apart by `F8`, so the grouper is the one piece they could share |

## .taken, and why

**B.** a five-line loop at two sites is the WET case the rule names. each copy carries its own
scoped-mutation note, and neither has drifted. a third fold is the cue to extract.

## .rework, and why

**clean.** one new transformer in `review/`, two call sites.

## .confidence, and why it is not higher

the inline key callbacks in the tree fold are a real smell the grove fold's own note warns of; a
`Record<TreeAxis, …>` there is cheap and may be worth it apart from the grouper.

## .where

`src/domain.operations/review/meter/genReviewMeterReport.ts` ·
`src/domain.operations/review/grove/genReviewGroveReport.ts`

## .verdict

(open)
