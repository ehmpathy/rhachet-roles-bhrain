import { BOUND_OF_CONCURRENT_DESCRIPTORS } from '@src/domain.operations/review/BOUND_OF_CONCURRENT_DESCRIPTORS';
// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asTokensByPath } from '@src/domain.operations/review/partition/asTokensByPath';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/**
 * .what = the estimated tokens of each changed file's body, by its path
 * .why = 🔴 a partition set redeclared under a guard was blind to its own size — the only
 *        read of whether a partition still overflowed alone was a paid round. the bodies
 *        are the mass a driver's globs move, so they are priced here, brain-free, with the
 *        same estimate a review run prices them by (`asTokensByPath`)
 *
 * .note = a file the diff deleted has no body: it is priced at 0, never a fault — a diff
 *         names deletions, and a deleted file sends no body to any brain
 * .note = the read is bounded, since a branch can change thousands of files
 *         (`BOUND_OF_CONCURRENT_DESCRIPTORS`)
 */
export const getAllTokensByTargetPath = async (input: {
  targets: string[];
  cwd: string;
}): Promise<Map<string, number>> => {
  const files = await getAllResultsInBoundedPool({
    items: input.targets,
    bound: BOUND_OF_CONCURRENT_DESCRIPTORS,
    map: async (path) => ({
      path,
      content: await getOneBodyOrEmpty({ path, cwd: input.cwd }),
    }),
  });
  return asTokensByPath({ files });
};

/**
 * .what = one changed path's body, or '' where the diff deleted it
 * .why = git names a deleted file as a changed path, and it has no body a brain reads. this
 *        read sits under the entrance gate, so it prices at 0 rather than halt every arrival
 *
 * .note = absence is the one allowlisted fault (`getOneFileTextOrNull`); every other rethrows
 *         (rule.forbid.failhide). a link to a directory never arrives here — the change list
 *         drops it upstream (`getAllFileChangesFromRange`)
 */
const getOneBodyOrEmpty = async (input: {
  path: string;
  cwd: string;
}): Promise<string> =>
  (await getOneFileTextOrNull({
    path: asPathAbsoluteFromCwd({ path: input.path, cwd: input.cwd }),
  })) ?? '';
