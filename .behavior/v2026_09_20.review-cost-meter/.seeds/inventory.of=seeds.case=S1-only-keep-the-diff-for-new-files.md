# S1 — only keep the diff for new files

## .said

> should we ONLY keep the target.diff for changeKind = new?

> that way its still clear its new

then, after the driver answered a different question than the one asked:

> didnt we agree to make it send ONLY the diff ?

## .settled

**a new file's `<target.diff>` and its `<target.file>` carry the same bytes**, so one of the
two must go. the diff is the body with a `+` on every line under a `new file mode` preamble.

the wisher's proposal was **diff-only** — drop the content, and let `new file mode 100644`
mark the newness in git's own vocabulary. the shipped choice is **content-only**, on three
arguments, of which only the first is measured:

1. the diff is strictly larger — corpus-wide **60,709.8k against 56,302.8k, 7.8% more**
2. the `+` prefix corrupts the text: a reviewer that cites `+export const x = 1;` quotes a
   line not in the file, and line numbers do not map
3. every other change kind ships a `<target.file>`, so *"read the body"* stays one uniform
   operation across the target set

the newness is then carried by `change="new"` on the file tag.

## 🔴 .the correction, recorded

**the driver argued the proposal down against a misread of it.** I answered as though it
meant *"keep diff AND content for new, drop diff for edited"* — a different and weaker
proposal — and rebutted that instead. the real proposal was coherent and was never engaged.

the wisher then re-asked, plainly, and the correction was theirs to make rather than mine
to catch.

⇒ the substantive residual: arguments 2 and 3 are claims about **what a brain does with
bytes**, and every instrument on this branch counts bytes. the tiebreak was 7.8% plus two
things nobody measured — which is why S2 required the A/B be caught rather than assumed.

## .landed

- `src/domain.operations/review/isTargetDiffSent.ts` — the one decision, read by both the
  renderer and the census
- `src/domain.operations/review/isTargetDiffSent.test.ts` — `[case2]`, `[case3]`
- `.dream/v2026_09_20.verify.a-new-files-representation-was-chosen-on-bytes-not-behavior.md`
