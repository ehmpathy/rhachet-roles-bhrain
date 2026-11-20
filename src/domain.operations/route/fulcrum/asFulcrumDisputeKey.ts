import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asReviewGivenKey } from '../guard/review/peer/asReviewGivenKey';

/**
 * .what = the key that names one dispute row: the stone, the lane, the given, the concern
 * .why = a verdict binds to the disputes a human saw. two rows that cite one fulcrum for two
 *        concerns — or for one ordinal in two rounds — are two disputes, so the key carries every
 *        coordinate that tells them apart
 *
 * .note = the given reads through `asReviewGivenKey`, so a row that holds a filename and an older
 *         row that holds the absolute path key the same
 */
export const asFulcrumDisputeKey = (input: { report: PassageReport }): string =>
  [
    input.report.stone,
    input.report.reviewer ?? '',
    input.report.given ? asReviewGivenKey({ path: input.report.given }) : '',
    input.report.about ?? '',
  ].join(':');
