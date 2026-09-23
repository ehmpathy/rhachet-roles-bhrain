/**
 * .what = the head rows every `route.guard.budget` emit opens with — the owl line, the tree title,
 *         and the four invocation fields the caller asked with
 * .why = the grant and the refusal render the SAME four rows from the same four inputs. built at
 *        two sites they would agree only by author discipline — a field added, a row reordered, or
 *        the title changed must land in both places or the surfaces drift
 *        (`rule.require.single-source-of-truth-for-render`).
 *
 * 🔴 .the SHAPE is the point, and it is why one shape rather than two.
 *    a driver reads ONE tree whether the grant lands or not — same title, same fields, same order —
 *    so the eye finds `add =` in the same place every time and only the TAIL asks to be read.
 *
 * 🟡 .`status` is a CLOSED set, never a free title string.
 *    a caller that could pass any string could pass a third voice, and the whole benefit above is
 *    that there are exactly two. the two owl lines are spelled here, once, so a change to either
 *    is a change to this file (`rule.prefer.prevent-over-correct` — the wrong value cannot be
 *    expressed).
 *
 * .note = the blank row at the head is INSIDE the head, on both paths. the grant writes to stdout
 *         and the refusal to stderr, and each opens with a blank line so the tree breathes off
 *         whatever preceded it. a caller that emitted the blank itself would be a fifth field to
 *         keep aligned.
 */
export const asGuardBudgetHeadLines = (input: {
  status: 'extended' | 'refused';
  route: string;
  add: number;
  peer: string | null;
  level: number | null;
}): string[] => [
  ``,
  input.status === 'extended' ? `🦉 budget extended` : `🦉 budget refused`,
  ``,
  `🗿 route.guard.budget`,
  `   ├─ route = ${input.route}`,
  `   ├─ add = ${input.add}`,
  ...(input.peer ? [`   ├─ peer = ${input.peer}`] : []),
  ...(input.level !== null ? [`   ├─ level = ${input.level}`] : []),
];
