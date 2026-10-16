# F253 — the generation-key pad premise is absent

- raised 2026-10-12, by `ergo-contract-snapshots` (nitpick.13), at 5.3 i004
- rework: **clean** — no code moves either way
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **90%**

## .the fork, stated fairly

the concern: `getAllRouteGuardReviewPeerConversationFiles` takes `exclude.iteration` as a raw
number, and its depth filter keys on a zero-padded generation key — so a raw `4` might fail to
match an on-disk `i004`.

| option | the claim |
|---|---|
| **A — the premise is absent; hold** | both sides of the comparison are padded to the same width before they meet |
| **B — repair** | pad the key on one side a second time |

## .taken, and why

**A.** both keys carry the same zero-padded form:

- the file side, `asGenerationKey` (`getAllRouteGuardReviewPeerConversationFiles.ts:146`), reads
  `iteration` from `asPeerConversationFileParts`, which returns the regex group as the string
  written on disk — `004`, already padded
- the caller side (`:190`) pads the raw number through `asStoneGuardCounter`, the same
  `padStart(COUNTER_WIDTH, '0')` that wrote the filename

and the suite clamps the mixed case: `getAllRouteGuardReviewPeerConversationFiles.integration.test.ts
[case8]` ("iterations and indices past 9 (numeric, not lexical)") excludes `{ iteration: 4 }`
against padded files at `:319`, and `[case1][t0]` excludes `{ iteration: 2 }` at `:71`. a repair
would add a second pad with no defect to cure (the premise-absent shape of F225).

## .rework, and why

**clean.** were a mismatch ever found, the fix is one `asStoneGuardCounter` call; no caller moves.

## .confidence, and why it is not higher

the counter width is a shared constant; a future change to the write width without the read width
would split them. the shared constant is what holds that today.

## .where

`src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerConversationFiles.ts` ·
`src/domain.operations/route/guard/review/peer/getAllRouteGuardReviewPeerConversationFiles.integration.test.ts`

## .verdict

— (awaits the council)
