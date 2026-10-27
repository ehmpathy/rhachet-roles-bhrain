# F9 — four test deltas beyond the wish are held, not reverted

## .the fork

r12 (`enroll-verif-test-intent`) at i004 asks that four test changes outside the wish be reverted:

1. the gitignore error tests: EACCES pins a `^EACCES… mkdir '` prefix with the path masked; EISDIR
   snaps `error.message` rather than the raw `Error`
2. shed and dispute counts read singular at one (`1 blocker`, `1 nitpick`)
3. the keyrack fix hint follows the rhachet 1.49.2 → 1.50.1 bump (`--vault <vault>`); r11 nitpick.5
   raises the same placeholder from the snapshot side; r11 i006 nitpick.2 asks that the granted
   twin (case2) move to a `key-present` file. held: the two cases share one invoke and one row
   reader, and the file's subject is the firewall's CI step, which case2 is the positive twin of
4. (nitpick) the `review.join-intersect` / `review.rules-only-default` counts moved — already F3

- **A** — revert each, and leave each for its own route
- **B** — hold each; each was asked for by a peer lane or rides along by rule

## .taken — B, and why

1. the EACCES path varies by host (F5, r7 #1): the exact path pinned on one host failed on the
   next. repaired at i006: each case derives the first ancestor absent from disk
   (`getOneFirstAbsentDir`) — the dir mkdir is denied at — and pins the denied path to it
   exactly, on every host; the snap masks the host part beside that pin. the
   EISDIR message form was the
   r6 lane's own ask at i003 — one snap shape beside the plain messages it sits with
2. the singular form was the r4 lane's ask; `asConcernCountPhrase` is the one phrase builder, so
   the old dispute line and the new shed line read alike rather than two grammars on one surface
3. a routine role-package bump rides along by default (`rule.require.git-release-confidence`); the
   placeholder is rhachet's render, and the snaps pin it faithfully. the upstream note is a reseed
   dream, never a revert here
4. F3 — the counts now match each case's own title

no case was dropped: all eight gitignore cases survive in the `disk-states` files (r12 confirms).

## .rework — clean

each is a revert of a test expectation, one file or one package pin apiece.

## .confidence — 80%, and why it is low

a strict read of "the wish only" would split item 3 into its own PR; the council may prefer it.

## .where

`src/domain.operations/route/gitignore/*.integration.test.ts` · `asConcernCountPhrase` ·
`package.json` · `blackbox/keyrack.firewall-key-absent.acceptance.test.ts`.
dream: `dreams/v2026_10_23.reseed.keyrack-fix-hint-names-its-vaults.md`.

## .verdict

B taken; open — for the council.
