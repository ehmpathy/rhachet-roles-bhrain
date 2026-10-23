import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asReviewScopePathLines } from '@src/domain.operations/review/asReviewScopePathLines';
import { asScopeFlagHuman } from '@src/domain.operations/review/asScopeFlagHuman';
import {
  asFigureHuman,
  MARK_OF_ABSENT,
} from '@src/domain.operations/review/meter/asFigureHuman';

/**
 * .what = renders the `targets` block of a scope refusal — the diffs flag, the path
 *         globs, and the join — as tree lines
 * .why = the overflow refusal and the empty-scope refusal both print this block to the
 *        same reader. two hand-kept copies drift one label at a time, and a driver
 *        then reads two vocabularies for one diagnostic
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = `joined.tokens` is the one declared divergence: the overflow refusal is ABOUT
 *         the token count, so it renders it; an empty scope has no tokens to count, so
 *         its caller passes null and the line is left off
 */
export const asReviewScopeTargetLines = (input: {
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number; tokens: number | null };
}): string[] => [
  `   ├─ targets`,
  `   │  ├─ diffs: ${asScopeFlagHuman({ of: input.diffs.flag })}`,
  `   │  │  └─ files: ${input.diffs.flag ? asCountHuman({ of: input.diffs.files }) : MARK_OF_ABSENT}`,
  ...asReviewScopePathLines({
    pathsWith: input.paths.with,
    pathsWout: input.paths.wout,
    filesFromPaths: input.paths.files,
  }),
  `   │  └─ joined via ${input.joined.mode}`,
  ...(input.joined.tokens === null
    ? [`   │     └─ files: ${asCountHuman({ of: input.joined.files })}`]
    : [
        `   │     ├─ files: ${asCountHuman({ of: input.joined.files })}`,
        `   │     └─ tokens: ${asFigureHuman({ of: input.joined.tokens })}`,
      ]),
];
