import * as fs from 'fs/promises';

import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = writes the scope RESOLUTION trace — every join, drop, and exemption
 * .why = a driver who asks "why is my file absent from the review?" reads this
 *        file and has the answer. it is the one artifact a refusal names by path
 *
 * .note = 🔴 it is written BEFORE the empty-corpus validation, deliberately, so a
 *         run that refuses still leaves the trace that says why. move the call
 *         after the guard and the one case that most needs the trace loses it
 *         (rule.require.errors-name-the-fix).
 */
export const setScopeDebugArtifact = async (input: {
  logDir: string;
  /** the same args value `input.args.json` records, so the two cannot drift */
  args: ReviewRunArgsRecord['args'];
  resolution: {
    ruleFiles: string[];
    targetFilesFromDiffs: string[];
    targetFilesFromPaths: string[];
    joinMode: 'union' | 'intersect';
    targetFilesJoined: string[];
    /**
     * what the default exclusion removed, by name.
     *
     * 🔴 a drop nobody can see is a drop nobody can debug. with only a count,
     * the file is simply gone and the next move is a bisect
     * (rule.forbid.failhide).
     */
    targetFilesDropped: string[];
    /**
     * the polluters a `--paths` glob named specifically, and so KEPT.
     *
     * 🔴 the same argument, inverted — and this is the half a reader is likelier
     * to doubt. a drop is expected; a `.dream/` file that shows up IN the scope
     * looks like the filter failed. this list names the exemption so the answer
     * is "a glob you typed asked for it" rather than a re-read of
     * `isTargetPolluter`.
     *
     * .note = it is empty under `--polluters keep`, where every polluter
     *         survives for a reason this list does not hold. the two cases part
     *         on `polluters`, which the args record above.
     */
    targetFilesAskedForByName: string[];
    targetFiles: string[];
  };
}): Promise<{ path: string }> => {
  const at = asRunArtifactPath({ dir: input.logDir, artifact: 'scopeDebug' });
  await fs.writeFile(
    at,
    JSON.stringify({ args: input.args, resolution: input.resolution }, null, 2),
    'utf-8',
  );
  return { path: at };
};
