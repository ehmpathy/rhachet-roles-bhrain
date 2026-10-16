import * as fs from 'fs';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRunArtifactPath } from '../asRunArtifactPath';

/**
 * .what = the replay a run offers a warmer — whether it left the prompt head a warmer
 *         replays, and where it looked
 * .why = a warmer replays the run's static head, so a run with no head on disk
 *        can only be refused. the path is answered beside the verdict so the refusal
 *        can name the exact file it did not find, rather than a bare "absent"
 *
 * .note = a `getOne*`, never an `is*`: it reads the disk, and it answers a record
 *         rather than a boolean, so a transformer prefix would declare a grain and a
 *         shape the body does not have (rule.require.get-set-gen-verbs)
 *
 * .note = the probe is a `statSync` through `isErrorOfAbsence`, never `existsSync`.
 *         `existsSync` answers false for an absent head and a barred one alike, so an
 *         EACCES would be refused as "no prompt head" — a present file reported as
 *         an absent one. only absence answers false; every other errno surfaces
 *         (rule.forbid.failhide)
 */
export const getOneWarmerReplay = (input: {
  logDir: string;
}): { replayable: boolean; pathOfHead: string } => {
  const pathOfHead = asRunArtifactPath({ dir: input.logDir, artifact: 'head' });

  // absence is the one fact this probe reports; any other fault is a defect
  try {
    fs.statSync(pathOfHead);
    return { replayable: true, pathOfHead };
  } catch (error) {
    if (!isErrorOfAbsence({ error })) throw error;
    return { replayable: false, pathOfHead };
  }
};
