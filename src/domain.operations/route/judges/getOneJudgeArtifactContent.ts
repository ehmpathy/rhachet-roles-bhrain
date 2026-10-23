import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = reads one prior judge artifact's raw content — or `null` if it vanished
 * .why = the judge orchestrator rebuilds its pass cache from prior artifacts; this names that
 *        read, the twin of `getOneReviewArtifactContent` for peer artifacts
 *        (rule.prefer.decomposable-architecture)
 *
 * .note = the caller found this path by enumeration a moment before, and a rewind
 *         (`delStoneGuardArtifacts`) or a tree clean can delete it in that window. a prior
 *         artifact only feeds a cache, so its absence is a cache miss: `null`. every other
 *         fault (a denial, a directory at the path) rethrows, per `getOneFileTextOrNull`
 */
export const getOneJudgeArtifactContent = async (input: {
  path: string;
}): Promise<string | null> => getOneFileTextOrNull({ path: input.path });
