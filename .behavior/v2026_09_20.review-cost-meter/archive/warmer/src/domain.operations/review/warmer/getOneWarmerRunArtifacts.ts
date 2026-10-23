import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfArtifactReadFault } from '@src/domain.operations/review/isErrorOfArtifactReadFault';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';

import { asRunArtifactPath, type RunArtifact } from '../asRunArtifactPath';

/**
 * .what = reads the two prompt artifacts a warmer replays, from one run's log dir
 * .why = a poke must send the bytes the RUN sent, never a re-compile — a re-compile
 *        reads a tree that has since moved, so it would warm a prefix the next
 *        round cannot share, which is the whole job of a warmer (`0.wish` bar 12).
 *
 *        ⇒ so the pair is read TOGETHER, by name, at one boundary. a warmer that
 *        replays a head from one run and a prompt from another has warmed naught.
 *
 * .note = a COMMUNICATOR, not a transformer — raw filesystem i/o with a name, so
 *         `setReviewWarmerPokes` composes a named read rather than a bare
 *         `fs.readFileSync` mid-narrative (`rule.forbid.decode-friction-in-orchestrators`).
 */
export const getOneWarmerRunArtifacts = (input: {
  /** the run whose prompt this warmer replays */
  logDir: string;
  /** the lane, carried for the fault metadata — a detached child has no other voice */
  reviewer: string;
}): { head: string; prompt: string } => {
  // the read FAILS LOUD, per artifact, with its path and its lane. `genReviewWarmer`
  // probes the HEAD before spawn and says naught about the prompt, so a torn log
  // dir is reachable here — a bare ENOENT from a detached, terminal-less child
  // names neither file nor reviewer, and a driver has no way to tell which lane
  // died (rule.require.failloud).
  const readOne = (artifact: RunArtifact): string => {
    const at = asRunArtifactPath({ dir: input.logDir, artifact });
    try {
      return fs.readFileSync(at, 'utf8');
    } catch (error) {
      // only a fault of the read itself takes the wrap — absence (a torn log dir), or a
      // read fault of the artifact. every other throw surfaces as itself, so a code
      // defect is never dressed as an absent artifact
      if (
        !isErrorOfAbsence({ error }) &&
        !isErrorOfArtifactReadFault({ error })
      )
        throw error;
      throw new UnexpectedCodePathError(
        'a warmer could not read a prompt artifact of the run it replays',
        {
          at,
          artifact,
          reviewer: input.reviewer,
          error: String(error),
          hint: 'the run that spawned this warmer left no artifact a poke could replay',
        },
      );
    }
  };

  return { head: readOne('head'), prompt: readOne('prompt') };
};
