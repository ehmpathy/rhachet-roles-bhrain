import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';

/**
 * .what = the stones whose live disputes cite each fulcrum, keyed by the case id the cited file
 *         name declares, with the path the dispute cited
 * .why = a dispute rides past every ungated stone (invariant 1), so it reaches a gate stones after
 *        it was raised. the halt names where it was raised, so the human knows which artifact to
 *        open (vision case=4). and the passage log is the one record of a dispute the driver
 *        cannot rewrite in place, so it — never the fulcrum file — decides that a dispute is live
 *
 * .note = keyed by case id, so a route-relative and a repo-relative `--why` meet, and a change to
 *         the title segment of the file name cannot orphan a dispute
 * .note = a dispute is live until a later `rewound` row on its stone retires it; a typed field in
 *         the fulcrum file never does
 */
export const asFulcrumRaisedOnStones = (input: {
  reports: PassageReport[];
}): Map<string, { stones: string[]; path: string }> =>
  asAllFulcrumDisputesLive({ reports: input.reports }).reduce(
    (raisedOn, dispute) => {
      const cited = raisedOn.get(dispute.case);
      const stones = cited?.stones ?? [];
      if (stones.includes(dispute.stone)) return raisedOn;
      return new Map(raisedOn).set(dispute.case, {
        stones: [...stones, dispute.stone],
        path: cited?.path ?? dispute.path,
      });
    },
    new Map<string, { stones: string[]; path: string }>(),
  );

/**
 * .what = each dispute row that cites a fulcrum and that no later `rewound` row on its stone retires
 * .why = a rewind is the sanctioned way to take a dispute back; the log records it, so the gate
 *        reads it from the log
 */
const asAllFulcrumDisputesLive = (input: {
  reports: PassageReport[];
}): { stone: string; case: string; path: string }[] =>
  input.reports.reduce<{ stone: string; case: string; path: string }[]>(
    (live, report) => {
      if (report.status === 'rewound')
        return live.filter((dispute) => dispute.stone !== report.stone);
      if (report.status !== 'disputed' || !report.fulcrum) return live;
      const name = path.basename(report.fulcrum);
      const declared = asFulcrumCaseFromFileName({ name });
      return [
        ...live,
        {
          stone: report.stone,
          case: declared?.slug ?? name,
          path: report.fulcrum,
        },
      ];
    },
    [],
  );
