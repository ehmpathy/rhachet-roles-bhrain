/**
 * .what = masks the concern counts a probabilistic reviewer chooses, on a PASS case
 * .why = a concern count is the BRAIN's verdict, never the render under test; one rubric on one
 *        fixture varies run to run. only what the case claims stays pinned:
 *
 *          - blockers: a NONZERO count masks to `[N]`; a ZERO survives, since `0 blockers` is
 *            what makes a verdict APPROVED — a pass case whose brain raises a blocker still fails
 *          - nitpicks: EVERY count masks, zero included, with its ✓ / 🟠 glyph. a nitpick never
 *            turns an approved verdict, so no pass case turns on its count
 *          - the verdict word, the 🔴 glyph, a judge outcome, and its threshold survive, so the
 *            verdict CLASS stays pinned
 *
 *        ⇒ the findings-case peer is `maskVerdictCounts`, which masks every count, zero included.
 *          see its table for which case owes which mask.
 */
export const maskConcernMagnitudes = (text: string): string =>
  text
    .replace(/\b(?!0\b)\d+ blockers?\b/g, '[N] blockers')
    .replace(/\b\d+ nitpicks?\b(?: ✓| 🟠)?/g, '[N] nitpicks')
    .replace(
      /\b(blockers|nitpicks) exceed threshold \((?!0\b)\d+ > (\d+)\)/g,
      '$1 exceed threshold ([N] > $2)',
    );
