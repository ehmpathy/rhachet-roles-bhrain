import { MalfunctionError } from 'helpful-errors';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReportsRaw } from '../../../passage/getAllPassageReportsRaw';
import { asReviewAbsorptionKey } from './asReviewAbsorptionKey';
import { asReviewGivenKey } from './asReviewGivenKey';
import { getPassageReportsSinceLastRewind } from './getPassageReportsSinceLastRewind';
import { isReviewAbsorptionOnGiven } from './isReviewAbsorptionOnGiven';
import type { ReviewAbsorption } from './ReviewAbsorption';

/**
 * .what = the absorptions that stand on one stone, keyed `(reviewer, concern, given)`
 * .why = three consumers need this — R3 (a contrary second stance), the judge's tally
 *        exclusion, and the halt that names which concerns are still undeclared. one read
 *        keeps them from a drift the type system cannot see.
 *
 * 🔴 it reads the RAW ledger, never `getAllPassageReports`. that operation buckets by
 *    last-entry-wins PER STONE, which is right for a passage state and wrong for a stance: a
 *    stone carries many absorptions at once — one per concern per reviewer — and the per-stone
 *    bucket would keep only the newest and silently drop the rest.
 *
 * .note = the precedent is `overruled`, which the same operation buckets per `(stone, level)`
 *         rather than per stone, for this same reason. a stance simply keys on three fields
 *         rather than two.
 *
 * .note = LAST WINS within one key. a re-declaration of the identical stance is idempotent,
 *         and a CONTRARY one never reaches here — R3 refuses it at the write. so the fold is
 *         a formality that keeps a replayed ledger deterministic.
 */
export const getStoneReviewAbsorptions = async (input: {
  route: string;
  stone: string;
}): Promise<ReviewAbsorption[]> => {
  const all = await getAllPassageReportsRaw({ route: input.route });

  // a rewind voids the round, so the absorptions declared within it are void too.
  // .why = the given key alone does NOT survive a rewind — an unchanged artifact re-mints
  //        the identical filename, so a rewound stance would re-attach silently
  //        (clamped: getStoneReviewAbsorptions.integration.test.ts)
  const reportsUnrewound = getPassageReportsSinceLastRewind({
    reports: all.filter((report) => report.stone === input.stone),
  });

  // the stance rows for this stone, narrowed to ReviewAbsorption.
  // .why = a pure filter+map fold, no accumulator mutated in a loop (rule.forbid.maintenance-hazards)
  const absorptions = reportsUnrewound
    .filter(
      (report): report is PassageReport & { status: 'disputed' | 'conceded' } =>
        report.status === 'disputed' || report.status === 'conceded',
    )
    .map((report): ReviewAbsorption => {
      // 🔴 a stance row that lacks its three keyed fields is MALFORMED, never legacy — `disputed`
      //    and `conceded` ship WITH them, so no prior row can carry the status and lack them. a
      //    silent skip would exclude no concern from the tally, so the stone could pass with a
      //    stance the engine could not read — a failhide (rule.forbid.failhide). fail loud instead.
      if (!report.reviewer || !report.about || !report.given)
        throw new MalfunctionError(
          'stance row lacks a keyed field (reviewer/about/given)',
          { report },
        );

      return {
        status: report.status,
        reviewer: report.reviewer,
        about: report.about,
        // keyed at the one producer, so every reader downstream sees a key and a legacy absolute
        // row (≤ 0.42.1) heals at read, with no migration
        given: asReviewGivenKey({ path: report.given }),
        fulcrum: report.fulcrum,
        severity: report.severity,
      };
    });

  // LAST WINS within one `(reviewer, about, given)` key — a Map built from entries keeps the last
  // duplicate, so a replayed ledger folds deterministically with no in-loop mutation.
  return [
    ...new Map(
      absorptions.map((absorption) => [
        asReviewAbsorptionKey({ absorption }),
        absorption,
      ]),
    ).values(),
  ];
};

/**
 * .what = the stance that stands on one concern of one given, if any
 * .why = R3 asks exactly this before it admits a stance — and it asks it at the CONCERN
 *        grain, so a contrary stance on a DIFFERENT concern of the same lane is admitted
 *        rather than refused (case=8 [t2b]). a lane-keyed R3 would refuse the commonest
 *        honest act there is: agree with one point and argue another.
 */
export const getAbsorptionOnConcern = (input: {
  absorptions: ReviewAbsorption[];
  reviewer: string;
  about: string;
  given: string;
}): ReviewAbsorption | undefined =>
  input.absorptions.find(
    (absorption) =>
      absorption.about === input.about &&
      isReviewAbsorptionOnGiven({
        absorption,
        reviewer: input.reviewer,
        given: input.given,
      }),
  );
