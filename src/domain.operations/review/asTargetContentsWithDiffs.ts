import { UnexpectedCodePathError } from 'helpful-errors';

import type { FileDiff } from '@src/domain.operations/git/getAllFileDiffsFromRange';

/**
 * .what = joins each target's path to the body that was read for it and the diff
 *         that was found for it, in the order asked
 *
 * .why = it is the last join before the prompt — one named operation instead
 *        of an inline map/branch/throw chain a reader must simulate
 *        (rule.forbid.inline-decode-friction).
 *
 * .note = the order of `targets` matters and must be preserved exactly. the
 *         corpus is sorted by cache stability upstream by
 *         `getAllTargetsByCacheStability`, and a reorder here would void
 *         that sort at the last step before the prompt. a `map` over
 *         `targets` preserves it; a fold over either Map would not.
 *
 * .note = a deleted target is the one branch, and its content is `null`
 *         rather than `''` — the file is gone, so there is no body to read.
 *         it renders as a lone void tag that carries its diff. `null` and
 *         `''` are parted deliberately: `getOneTargetRenderPlan` answers
 *         `sendsFile: false` on the null, where an empty string would render
 *         an empty body tag and claim a read that never happened.
 *
 * .note = an absent body for a non-deleted target throws rather than
 *         defaults. every extant target was just read by
 *         `getAllFileContentsByGroup`, so a miss here means the read set and
 *         the join set disagree — a defect in this file's own connections,
 *         never a condition a caller can cause. to default it to `''` would
 *         send an empty body for a file that has content, and the prompt
 *         would look well-formed while it reviewed naught at all
 *         (rule.forbid.failhide, rule.require.failfast).
 */
export const asTargetContentsWithDiffs = (input: {
  /** the target paths, in the order the prompt must carry them */
  targets: string[];
  /** the body read for each extant target, keyed by path */
  bodiesByPath: Map<string, string>;
  /** the diff found for each changed target, keyed by path */
  changeKindByPath: Map<string, FileDiff>;
}): {
  path: string;
  content: string | null;
  diff?: string | null;
  changeKind?: 'new' | 'edited' | 'deleted';
}[] =>
  input.targets.map((path) => {
    const fileDiff = input.changeKindByPath.get(path);

    // a deleted file has no body to read — the marker and its diff are all there is
    if (fileDiff?.changeKind === 'deleted')
      return {
        path,
        content: null,
        diff: fileDiff.diff,
        changeKind: fileDiff.changeKind,
      };

    // new, edited, or path-only: the full body, with its diff attached where present
    return {
      path,
      content:
        input.bodiesByPath.get(path) ??
        UnexpectedCodePathError.throw('a read target has no content', { path }),
      diff: fileDiff?.diff,
      changeKind: fileDiff?.changeKind,
    };
  });
