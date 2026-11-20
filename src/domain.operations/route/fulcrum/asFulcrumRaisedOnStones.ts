import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';
import { asFulcrumDisputeKey } from './asFulcrumDisputeKey';

/**
 * .what = what the passage log says of each disputed fulcrum: the stones whose live disputes cite
 *         it, the path the first one cited, and the strongest `owed` a dispute row pinned
 * .why = a dispute rides past every ungated stone (invariant 1), so it reaches a gate stones after
 *        it was raised. the halt names where it was raised, so the human knows which artifact to
 *        open (vision case=4). and the passage log is the one record of a dispute the driver
 *        cannot rewrite in place, so it — never the fulcrum file — decides that a dispute is live,
 *        and pins who the dispute path verified it was owed to
 *
 * .note = keyed by case id, so a route-relative and a repo-relative `--why` meet, and a change to
 *         the title segment of the file name cannot orphan a dispute
 * .note = a dispute is live until a later `rewound` row on its stone retires it; a typed field in
 *         the fulcrum file never does
 */
export const asFulcrumRaisedOnStones = (input: {
  reports: PassageReport[];
}): Map<string, FulcrumRaisedOn> =>
  asAllFulcrumDisputesLive({ reports: input.reports }).reduce(
    (raisedOn, dispute) => {
      const cited = raisedOn.get(dispute.case);
      const stones = cited?.stones ?? [];
      return new Map(raisedOn).set(dispute.case, {
        stones: stones.includes(dispute.stone)
          ? stones
          : [...stones, dispute.stone],
        path: cited?.path ?? dispute.path,
        owedPinned: asOwedStronger({
          a: cited?.owedPinned ?? null,
          b: dispute.owed,
        }),
        disputes: [...new Set([...(cited?.disputes ?? []), dispute.key])],
      });
    },
    new Map<string, FulcrumRaisedOn>(),
  );

/**
 * .what = what the passage log says of one disputed fulcrum
 */
export interface FulcrumRaisedOn {
  stones: string[];
  path: string;
  /**
   * the key of each live dispute that cites this case (`asFulcrumDisputeKey`), once each
   */
  disputes: string[];
  /**
   * the strongest `owed` any live dispute row pinned for this case, or null where every row
   * predates the stamp. `human` outranks `reflect`: a human-owed dispute stays with the human
   */
  owedPinned: 'human' | 'reflect' | null;
}

/**
 * .what = the stronger of two pinned `owed` values; `human` outranks `reflect`, and either
 *         outranks an absent stamp
 */
const asOwedStronger = (input: {
  a: 'human' | 'reflect' | null;
  b: 'human' | 'reflect' | null;
}): 'human' | 'reflect' | null => {
  if (input.a === 'human' || input.b === 'human') return 'human';
  return input.a ?? input.b;
};

/**
 * .what = each dispute row that cites a fulcrum and that no later `rewound` row on its stone retires
 * .why = a rewind is the sanctioned way to take a dispute back; the log records it, so the gate
 *        reads it from the log
 */
const asAllFulcrumDisputesLive = (input: {
  reports: PassageReport[];
}): FulcrumDisputeLive[] =>
  input.reports.reduce<FulcrumDisputeLive[]>((live, report) => {
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
        owed: report.owed ?? null,
        key: asFulcrumDisputeKey({ report }),
      },
    ];
  }, []);

/**
 * .what = one live dispute row, as the fold reads it
 */
interface FulcrumDisputeLive {
  stone: string;
  case: string;
  path: string;
  owed: 'human' | 'reflect' | null;
  key: string;
}
