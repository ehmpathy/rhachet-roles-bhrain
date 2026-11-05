import { type IsoDuration, toMilliseconds } from 'iso-time';

import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = a run's brain wall time in minutes, as its realized record holds it
 * .why = the cache reach runs from a run's last send, which is its mint plus this. one read
 *        for the lane fold and the pair, so both measure one gap
 *
 * .note = null where the run was not metered or its record names no time, never a guess
 * .note = a time that is present yet torn is an artifact defect, raised as the class the
 *         meter isolates per run (`ReviewRunArtifactError`), so one torn record costs its
 *         own row and never the report; a figure that is not finite is torn too, since a
 *         NaN gap would read as never past the reach
 */
export const asMinutesOfCallOfRealized = (input: {
  realized: Record<string, unknown> | null;
  dir: string;
}): number | null => {
  const time = input.realized?.time;
  if (time === undefined || time === null) return null;
  const minutes = (() => {
    try {
      // .note = the file is untrusted input; `toMilliseconds` reads both shapes an
      //         `IsoDuration` takes, and the catch below classes any it cannot read
      return toMilliseconds(time as IsoDuration) / 60_000;
    } catch (error) {
      throw new ReviewRunArtifactError(
        'metrics.realized.json names a time that is not a duration',
        {
          dir: input.dir,
          time,
          cause: error instanceof Error ? error : undefined,
        },
      );
    }
  })();
  if (!Number.isFinite(minutes))
    throw new ReviewRunArtifactError(
      'metrics.realized.json names a time that is not a finite duration',
      { dir: input.dir, time },
    );
  return minutes;
};
