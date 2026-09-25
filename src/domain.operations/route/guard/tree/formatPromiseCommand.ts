import { getSelfReviewArticulationPath } from '../review/self/getSelfReviewArticulationPath';

/**
 * .what = formats the closing instruction of a self-review prompt — the exact
 *         `--as promised` command, with `--into` already filled to the owed path
 * .why = it is the one line a driver copies, so it must name the same path the guard checks
 *
 * .note = `--into` is REQUIRED. it names the path the driver declares they wrote to, so a
 *         wrong path renders as a diff of two named operands rather than a bare absence
 * .note = no wait is named here, deliberately. the next command clears
 *
 * 🔴 .note = this block was byte-for-byte identical in `formatPatienceFriend` and
 *            `formatLetsReflect`, and no lane saw it for 17 rounds — each file was read by a
 *            different rubric at a different time, and none diffed the two against each other.
 *            the `--into` contract already moved once this round, so two copies of the command
 *            that carries it is two places a contract change must land
 *            (`rule.forbid.duplicate-format-tree-operations`).
 */
export const formatPromiseCommand = (input: {
  route: string;
  stone: string;
  slug: string;
}): string[] => [
  `   └─ when you've truly reflected, run`,
  `      └─ rhx route.stone.set --stone ${input.stone} --as promised --that ${input.slug} \\`,
  `         --into ${getSelfReviewArticulationPath(input)}`,
];
