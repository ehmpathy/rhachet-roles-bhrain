import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = the raw text of one peer review artifact, read from disk — or `null` if it vanished
 * .why = the read is the i/o boundary of a verdict lookup; named here, the
 *        composers that parse an artifact never hold a raw `fs` call themselves
 *        (rule.prefer.decomposable-architecture)
 *
 * .note = the caller found this path by enumeration a moment before, and a rewind
 *         (`delStoneGuardArtifacts`) or a tree clean can delete it in that window. so an
 *         absence reads as `null` — the same benign miss the caller's own `| null` return
 *         expresses. the read is the shared `getOneFileTextOrNull`, so absence means
 *         ENOENT or ENOTDIR, and every other fault (a denial, a directory at the path) rethrows
 */
export const getOneReviewArtifactContent = async (input: {
  path: string;
}): Promise<string | null> => getOneFileTextOrNull({ path: input.path });
