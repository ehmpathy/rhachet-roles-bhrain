import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import {
  type FileChange,
  getAllFileChangesFromRange,
} from '@src/domain.operations/git/getAllFileChangesFromRange';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';

/**
 * .what = the files a review's `--diffs` flag names — each path and its change kind, no
 *         patch text — and the base they were selected against; none when the flag is absent
 * .why = the scope walk needs every changed PATH to join, exclude, and drop polluters, but
 *        a PATCH only for the targets that survive it. to read every patch up front paid one
 *        `git diff` per changed file — the review's own `.log/` prompts among them, which the
 *        polluter filter drops a step later — and a 1.7 MB prompt that a peer partition had
 *        just written broke every partition of a lane on `ENOBUFS`
 *
 * .note = the flag arrives as free text, so the range is validated before git is read. an
 *         unknown range refuses with the valid set named, rather than reach git with a value
 *         it cannot parse
 * .note = `baseArgs` is null when no range was asked: there is no base, and no change to
 *         render a patch against it
 */
export const getAllFileChangesForReview = (input: {
  diffs: string | undefined;
  cwd: string;
}): { baseArgs: string | null; changes: FileChange[] } => {
  // no range asked for = no changes
  if (!input.diffs) return { baseArgs: null, changes: [] };

  // refuse a range this reader does not know
  const validRanges = ['since-main', 'since-commit', 'since-staged'] as const;
  const range = validRanges.find((one) => one === input.diffs);
  if (!range) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: '--diffs range not recognized',
      lines: [
        `   ├─ received: ${input.diffs}`,
        `   └─ expected: since-main | since-commit | since-staged`,
        ...asDidYouKnowLines({
          rows: ['use one of the supported range values'],
        }),
      ],
    });
    throw new ReviewRefusalEmittedError(
      `--diffs range not recognized: ${input.diffs}`,
    );
  }

  // select the changes for the range, with the base that selected them
  return getAllFileChangesFromRange({ range, cwd: input.cwd });
};
