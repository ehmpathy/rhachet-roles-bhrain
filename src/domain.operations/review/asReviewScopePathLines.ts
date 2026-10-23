import { asCountHuman } from './asCountHuman';
import { asScopeFlagHuman } from './asScopeFlagHuman';
import { MARK_OF_ABSENT } from './meter/asFigureHuman';

/**
 * .what = renders the path half of a review's scope block — the include globs, the
 *         files they matched, and the exclude globs — as tree lines
 * .why = both scope blocks once rendered only the deprecated `input.paths`
 *        flag, so a lane scoped by `--paths-with` read `paths: (none)` /
 *        an absent file count beside a real target count — a supplied, honored
 *        scope rendered as absent, and the driver chased the wrong culprit
 *        (rule.require.errors-name-the-fix).
 *
 * .note = reads the resolved globs (`asTargetPathGlobs`), which fold
 *         `--paths`, `--paths-with`, and `--paths-wout` into one
 *         include/exclude pair, so every form of the flag renders the same
 *         way.
 *
 * .note = the labels are `paths.with` / `paths.wout`, while `genReviewHeaderStdout`
 *         renders `paths` / `paths-with` / `paths-wout`. both name the RESOLVED
 *         lists — the header too reads the folded includes — and differ only in
 *         form: the header's hyphen labels match the flag names a reader types, so a
 *         quick read maps line to flag; this block's dot labels mark the include and
 *         exclude halves of one resolved pair, which it renders in full, absent halves
 *         included, where the header omits an absent one.
 *
 * .note = one transformer for both blocks — two hand-kept copies is how this
 *         defect lived in both (rule.forbid.duplicate-format-tree-operations).
 */
export const asReviewScopePathLines = (input: {
  /** the resolved include globs — positive half of `asTargetPathGlobs` */
  pathsWith: string[];
  /** the resolved exclude globs — negative half of `asTargetPathGlobs` */
  pathsWout: string[];
  /** how many files the include globs matched, before the join */
  filesFromPaths: number;
}): string[] => [
  `   │  ├─ paths.with: ${asScopeFlagHuman({ of: input.pathsWith })}`,
  `   │  │  └─ files: ${input.pathsWith.length ? asCountHuman({ of: input.filesFromPaths }) : MARK_OF_ABSENT}`,
  `   │  ├─ paths.wout: ${asScopeFlagHuman({ of: input.pathsWout })}`,
];
