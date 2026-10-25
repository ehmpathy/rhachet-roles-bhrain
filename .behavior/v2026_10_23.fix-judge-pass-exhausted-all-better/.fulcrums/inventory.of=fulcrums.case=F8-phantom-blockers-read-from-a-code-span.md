# F8 — the r11 i004 blockers are phantoms the tallier read from a code span

## .the fork

r11 (`enroll-verif-snapshot-blemishes`) at i004 wrote `0 blockers` / `5 nitpicks` as its verdict,
then quoted the judge's reason in prose: `` (`after 3 blockers shed…`) ``. the guard tallied
`3 blockers, 5 nitpicks`, because `getOneReviewCountsViaRegex` takes the LAST `N blockers` match
and the quoted span came after the verdict.

- **A** — concede the three counted blockers to clear the gate
- **B** — dispute them as phantoms (no `blocker.N` exists in the text) and cure the tallier at source

## .taken — B, and why

- the given names no blocker; a concession would claim a debt the reviewer never raised
  (`rule.forbid.suppression-of-undeclared-concerns`: an over-claim)
- the defect is the tallier's, and it would recur on any review that quotes a count
- the cure: `asReviewContentWithoutCode` strips fenced blocks and inline code spans before the
  count; clamp case14 (verdict 0/5, then a code span that says 3 blockers) went red before the fix,
  green after; case15 pins that counts held only inside code read as undetected
- the i004 given was tallied before the cure, so its count stands on disk; the next round re-tallies

## .rework — clean

one transformer inside the tallier; the two clamp cases.

## .confidence — 90%, and why it is not higher

a review that writes its real verdict inside backticks would now read as undetected → a
malfunction, loud rather than a false count. no reviewer in this repo's corpus does so, and the
contract asks for plain lines.

## .where

`src/domain.operations/review.tally/getOneReviewCountsViaRegex.ts` and its test.

## .verdict

B taken; open — for the council.
