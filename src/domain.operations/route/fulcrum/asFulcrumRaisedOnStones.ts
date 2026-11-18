import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = the stones whose disputes cite each fulcrum file, keyed by the file's basename
 * .why = a dispute rides past every ungated stone (invariant 1), so it reaches a gate stones after
 *        it was raised. the halt names where it was raised, so the human knows which artifact to
 *        open (vision case=4). the dispute row already records its stone and its `--why` path, so
 *        the answer is read, never stamped into the fulcrum a second time
 *
 * .note = keyed by basename, since a `--why` may be route-relative or repo-relative; the case
 *         segment in the file name is unique within `.fulcrums/`
 */
export const asFulcrumRaisedOnStones = (input: {
  reports: PassageReport[];
}): Map<string, string[]> =>
  input.reports
    .flatMap((report) =>
      report.status === 'disputed' && report.fulcrum
        ? [{ stone: report.stone, name: path.basename(report.fulcrum) }]
        : [],
    )
    .reduce((raisedOn, dispute) => {
      const stones = raisedOn.get(dispute.name) ?? [];
      if (stones.includes(dispute.stone)) return raisedOn;
      return new Map(raisedOn).set(dispute.name, [...stones, dispute.stone]);
    }, new Map<string, string[]>());
