import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { asTreeLinesClosed } from '@src/domain.operations/asTreeLinesClosed';
import { HUMAN_OF_ROUTE_ARTIFACT_ALLOWED } from '@src/domain.operations/isTargetPolluter';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asReviewScopeTargetLines } from '@src/domain.operations/review/asReviewScopeTargetLines';
import { isGlobJoinedByComma } from '@src/domain.operations/review/isGlobJoinedByComma';

/**
 * .what = the refusal's tree: the targets, and the cause of the empty scope where it is known
 */
const asReviewScopeEmptyTreeLines = (input: {
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number };
  dropped: number;
}): string[] => [
  ...asReviewScopeTargetLines({
    diffs: input.diffs,
    paths: input.paths,
    joined: {
      mode: input.joined.mode,
      files: input.joined.files,
      tokens: null,
    },
  }),
  /**
   * 🔴 name the exclusion when it is the cause.
   *
   * a caller whose globs matched only route paperwork sees a joined count
   * above zero and a final count of zero. with no line here, that reads as
   * a broken glob and they re-tune a glob that was correct — the exclusion
   * is invisible and the error names the wrong culprit
   * (rule.require.errors-name-the-fix).
   */
  ...(input.dropped > 0
    ? [
        `   ├─ polluters: ${asCountHuman({ of: input.dropped })} dropped by default`,
        `   │  └─ kept: ${HUMAN_OF_ROUTE_ARTIFACT_ALLOWED} — every other route artifact, dream, and lockfile is dropped where it RODE IN on --diffs`,
        `   │     ├─ to review SOME: name them in --paths — a glob that matches only paperwork keeps what it named`,
        `   │     └─ to review ALL: --polluters keep`,
      ]
    : []),
  // a comma-joined path glob matches naught while each half would; name it, or the
  // caller re-tunes globs that were correct (rule.require.errors-name-the-fix)
  ...(input.paths.with.some((glob) => isGlobJoinedByComma({ glob }))
    ? [
        `   ├─ comma: a comma does not split a glob — repeat --paths-with once per glob`,
      ]
    : []),
];

/**
 * .what = the lines beneath an empty-scope refusal: the target tree, the polluter
 *         disclosure when one caused it, and where to look
 * .why = the refusal tree had one home inline in `stepReview`, which a reader had to
 *        simulate to learn what it prints (rule.forbid.inline-decode-friction)
 *
 * .note = where to look is a next move, so it rides its own `✨ did you know?` block after
 *         the tree, never a `hint:` leaf inside it (rule.require.coconut-hints)
 */
export const asReviewScopeEmptyRefusalLines = (input: {
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number };
  dropped: number;
  logDirRelative: string;
}): string[] => [
  ...asTreeLinesClosed({ lines: asReviewScopeEmptyTreeLines(input) }),
  ...asDidYouKnowLines({
    rows: [
      `inspect ${input.logDirRelative}/input.scope.debug.json to see what was matched`,
    ],
  }),
];
