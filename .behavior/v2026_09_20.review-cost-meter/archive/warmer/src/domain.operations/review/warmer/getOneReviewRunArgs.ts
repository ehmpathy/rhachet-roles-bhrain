import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';

import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

import { asRunArtifactPath } from '../asRunArtifactPath';
import type { ReviewRunArgsRecordRead } from '../ReviewRunArgsRecord';

/**
 * .what = one run's parsed args, or null where the file is absent or half-written
 * .why = the warmer asks "whose run was this?", and a live log dir can hold a
 *        run mid-write. a torn file cannot prove a run happened, so it reads
 *        as no run
 *
 * .note = diverges from the meter's `getOneRunArtifactJson` on purpose: the meter
 *         reads a finished corpus and must fail loud on a malformed file,
 *         where the warmer reads a live one and races its writers. one
 *         contract per reader
 *
 * .note = the read and the parse are allowlisted separately, because only two
 *         narrow cases are benign and a single bare catch allowlists the
 *         whole error class (rule.forbid.failhide). a swallowed EACCES would
 *         read as "this reviewer never ran", so the warmer would spend a poke
 *         on a fact it never established
 *
 * .note = sync, and each read one guarded read, never an `existsSync` then a
 *         read: the probe would sit where the guard boundary appears to be,
 *         while the real guard is the read's own allowlist
 *         (rule.forbid.maintenance-hazards)
 */
export const getOneReviewRunArgs = (input: {
  dir: string;
}): ReviewRunArgsRecordRead | null => {
  const at = asRunArtifactPath({ dir: input.dir, artifact: 'args' });

  // read — absence is benign; every other fs fault is a defect, wrapped with its path
  const raw = (() => {
    try {
      return fs.readFileSync(at, 'utf8');
    } catch (error) {
      // never written, or vanished in the race against a live log dir
      if (isErrorOfAbsence({ error })) return null;

      // wrapped, never bare — node's read fault names no path, so a bare
      // rethrow says a file is unreadable and never which one
      // (rule.prefer.helpful-error-wrap)
      throw new UnexpectedCodePathError(
        'could not read a review run args file',
        { at, error: String(error) },
      );
    }
  })();
  if (raw === null) return null;

  // parse — a half-written file is the one benign failure, so `SyntaxError` and no wider
  try {
    return JSON.parse(raw);
  } catch (error) {
    // by constructor name, never `instanceof`: a SyntaxError minted in another
    // realm (a vm context, a worker) fails `instanceof` against this one's class
    if (getAllErrorClassNames({ error }).includes('SyntaxError')) return null;
    throw new UnexpectedCodePathError(
      'could not parse a review run args file',
      {
        at,
        error: String(error),
      },
    );
  }
};
