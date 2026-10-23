import { asContentByPath } from '@src/domain.operations/review/asContentByPath';
import { asFileDiffByPath } from '@src/domain.operations/review/asFileDiffByPath';
import {
  asTargetContentsByInput,
  type TargetInputName,
} from '@src/domain.operations/review/asTargetContentsByInput';
import { asTargetContentsWithDiffs } from '@src/domain.operations/review/asTargetContentsWithDiffs';
import { BOUND_OF_CONCURRENT_DESCRIPTORS } from '@src/domain.operations/review/BOUND_OF_CONCURRENT_DESCRIPTORS';
import { getAllFileContentsByGroup } from '@src/domain.operations/review/getAllFileContentsByGroup';
import { getAllFileDiffsForReview } from '@src/domain.operations/review/getAllFileDiffsForReview';
import { getAllTargetsExtant } from '@src/domain.operations/review/getAllTargetsExtant';
import { isPathPresent } from '@src/domain.operations/review/isPathPresent';
import { asTargetLocusEntriesByInput } from '@src/domain.operations/review/meter/asTargetLocusEntriesByInput';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

/** a run's target mass, split by the named input the prompt sends it as */
export type TargetSplitOfRun = {
  /** the run's recorded target count */
  targetsRecorded: number;
  /** targets gone from disk since the run — not measured */
  targetsGone: number;
  locus: Record<TargetInputName, { path: string; chars: number }[]>;
};

/**
 * .what = a run's targets split into the named inputs the prompt sends them as —
 *         edited bodies (`targetFiles`), and the additions, deletions, and mutations
 *         of `targetDiffs` — re-derived from the
 *         run's recorded scope against the CURRENT worktree
 * .why = a run refused at the overflow gate wrote no prompt, so its artifacts hold the
 *        target list and no split. the split decides the lever: mass in bodies can be
 *        cut by a narrower file radius; mass in diffs cannot, and needs a partition.
 *        a driver must read that off the tool, never off a hand-rolled rollup
 *        (rule.require.report-both-cost-levers-with-trend-and-locus)
 *
 * .note = 🔴 it re-reads the worktree as it stands NOW, never as it stood at the run.
 *         the result is labeled so; a file gone since the run is counted, not guessed
 * .note = the joins and the send plan are the live review's own operations, so the
 *         split cannot drift from what `stepReview` would have sent
 */
export const getOneTargetSplitOfRun = async (input: {
  /** the run's log dir */
  at: string;
  /** the repo root the run's paths are relative to */
  cwd: string;
}): Promise<TargetSplitOfRun | null> => {
  // read the run's recorded scope and args; a run with no scope has no split to state
  // .note = two sequential awaits, one descriptor at a time — no Promise.all, so no
  //         descriptor bound applies here
  // .note = each `as` binds field NAMES only, at an artifact boundary: the producer is this
  //         package's own run (`setScopeArtifact`, `setScopeDebugArtifact`), and no schema
  //         check stands beneath it. a body of the wrong shape fails loud at its first read
  //         (`.targetFiles.length` throws on absence), never silent
  const scope = (await getOneRunArtifactJson({
    dir: input.at,
    artifact: 'scope',
  })) as { targetFiles: string[] } | null;
  const debug = (await getOneRunArtifactJson({
    dir: input.at,
    artifact: 'scopeDebug',
  })) as { args: { diffs?: string; focus?: 'pull' | 'push' } } | null;
  if (!scope || !debug) return null;

  // the diffs the run's range names for its recorded targets, as git reads them now
  const fileDiffByPath = asFileDiffByPath({
    of: getAllFileDiffsForReview({
      diffs: debug.args.diffs,
      targets: scope.targetFiles,
      cwd: input.cwd,
    }),
  });

  // hold out deletions (no body by design) and files gone since the run (no body now)
  const targetsExtant = getAllTargetsExtant({
    targets: scope.targetFiles,
    changeKindByPath: fileDiffByPath,
  });
  const targetsPresent = await getAllPathsPresent({
    paths: targetsExtant,
    cwd: input.cwd,
  });
  const targetsGone = new Set(
    getAllPathsWithout({ paths: targetsExtant, without: targetsPresent }),
  );

  // read the bodies, join each to its diff, and fold to what the prompt sends
  const contents = await getAllFileContentsByGroup({
    cwd: input.cwd,
    groups: { targets: targetsPresent },
  });
  const targetContents = asTargetContentsWithDiffs({
    targets: getAllPathsWithout({
      paths: scope.targetFiles,
      without: [...targetsGone],
    }),
    bodiesByPath: asContentByPath({ reads: contents.targets }),
    changeKindByPath: fileDiffByPath,
  });
  const byInput = asTargetContentsByInput({
    targets: targetContents,
    focus: debug.args.focus ?? 'push',
  });

  return {
    targetsRecorded: scope.targetFiles.length,
    targetsGone: targetsGone.size,
    locus: asTargetLocusEntriesByInput({ byInput }),
  };
};

/**
 * .what = the paths that are not in `without`, in their given order
 * .why = names the two set differences the split takes — the targets gone since the run,
 *        and the recorded targets still present — so the operation reads as named acts
 */
const getAllPathsWithout = (input: {
  paths: string[];
  without: string[];
}): string[] => {
  const excluded = new Set(input.without);
  return input.paths.filter((one) => !excluded.has(one));
};

/**
 * .what = the subset of paths that exist on disk now, in the order asked
 * .why = a refused run is read after the fact; a file removed since is not a defect.
 *        `isPathPresent` answers false only for an absence, and surfaces every other
 *        errno — a bare catch would drop an unreadable target as "gone"
 *        (rule.forbid.failhide)
 */
const getAllPathsPresent = async (input: {
  paths: string[];
  cwd: string;
}): Promise<string[]> => {
  // poured in bounded waves: a refused run's target list is its largest, in the hundreds
  const present = await getAllResultsInBoundedPool({
    items: input.paths,
    bound: BOUND_OF_CONCURRENT_DESCRIPTORS,
    map: (one) =>
      isPathPresent({
        at: asPathAbsoluteFromCwd({ path: one, cwd: input.cwd }),
      }),
  });
  return input.paths.filter((_, index) => present[index]);
};
