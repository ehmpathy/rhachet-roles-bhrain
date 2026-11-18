import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';

/**
 * .what = for each case a live dispute cites, the first stone a human approved AFTER the newest
 *         dispute that cites it — or null while no approval has followed
 * .why = a conceded verdict needs an end state, and the passage log gives one in order. approval
 *        is refused route-wide while any dispute owes the human (F3), so an approval that follows
 *        a dispute was given with that dispute's verdict in view. and the human who conceded is
 *        the one who withholds approval until the repair lands (F6). so once one follows, the
 *        repair is answered, and "repair owed" no longer prints at every later gate
 *
 * .note = a newer dispute on the same case resets the answer, since that dispute has not yet met
 *         a human; a `rewound` row retires its stone's disputes, as `asFulcrumRaisedOnStones` does
 */
export const asFulcrumApprovedAfterDisputes = (input: {
  reports: PassageReport[];
}): Map<string, string | null> =>
  input.reports.reduce(
    (state: ApprovalFoldState, report): ApprovalFoldState => {
      // a rewind retires every dispute its stone raised
      if (report.status === 'rewound') {
        const live = state.live.filter(
          (dispute) => dispute.stone !== report.stone,
        );
        const cases = new Set(live.map((dispute) => dispute.case));
        return {
          live,
          approved: new Map(
            [...state.approved].filter(([key]) => cases.has(key)),
          ),
        };
      }

      // a dispute that cites a fulcrum opens (or re-opens) its case
      if (report.status === 'disputed' && report.fulcrum) {
        const name = path.basename(report.fulcrum);
        const key = asFulcrumCaseFromFileName({ name })?.slug ?? name;
        return {
          live: [...state.live, { stone: report.stone, case: key }],
          approved: new Map(state.approved).set(key, null),
        };
      }

      // an approval answers every open case that has not met one yet
      if (report.status === 'approved')
        return {
          live: state.live,
          approved: new Map(
            [...state.approved].map(([key, stone]) => [
              key,
              stone ?? report.stone,
            ]),
          ),
        };
      return state;
    },
    STATE_EMPTY,
  ).approved;

/**
 * .what = the fold's state: the disputes still live, and each case's first approval after them
 */
interface ApprovalFoldState {
  live: { stone: string; case: string }[];
  approved: Map<string, string | null>;
}
const STATE_EMPTY: ApprovalFoldState = { live: [], approved: new Map() };
