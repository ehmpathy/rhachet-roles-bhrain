# F272 — the available brains tree is drawn by rhachet

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.1), at 5.3 i004
- rework: **dirty** — the fix lives in another repo
- status: 🟡 **BEST-GUESSED — disputed; a reseed to rhachet is owed**
- confidence: **90%**

## .the fork, stated fairly

the `review --help` snapshot (`reviewWarmerFlag [case5]`) pins `🔭 available brains` / `   └── (none)`,
whose `└──` is one dash wider than this repo's `└─`.

| option | the claim |
|---|---|
| **A — leave it; reseed the fix to rhachet** | the tree is drawn by `rhachet`'s `getAvailableBrainsInWords`, which this repo imports. a fix here would patch a dependency's output |
| **B — rewrite the line in this repo** | a regex over the help text could swap the connector |

## .taken, and why

**A.** the source is `node_modules/rhachet/dist/domain.operations/context/getAvailableBrainsInWords.js:30`
(`'   └── (none)'`). this repo writes no `└──` anywhere in `src/` outside comments. option B is a
workaround over a dependency's output (`rule.forbid.workarounds`); the cure is a one-line fix in rhachet,
after which a version bump re-pins the snapshot.

## .rework, and why

**dirty.** the change is foreign: it lands in `ehmpathy/rhachet`, and reaches this repo only via a bump.

## .confidence, and why it is not higher

the help text is this repo's surface, so a reader could argue it owns what it prints.

## .where

`src/contract/cli/review.ts` (help) · `rhachet` `getAvailableBrainsInWords`

## .verdict

— (awaits the council)
