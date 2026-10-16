import { asDurationInWords } from 'iso-time';
import * as path from 'path';

import type { ReviewRunMetricsRealizedOfResult } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealizedOfResult';
import { asReviewOutputTokensOfRealized } from '@src/domain.operations/review/asReviewOutputTokensOfRealized';
import { genReviewFileHeader } from '@src/domain.operations/review/genReviewFileHeader';
import { genReviewOutputStdout } from '@src/domain.operations/review/genReviewOutputStdout';
import { getReviewDisplayPath } from '@src/domain.operations/review/getReviewDisplayPath';
import { setReviewOutputFile } from '@src/domain.operations/review/setReviewOutputFile';
import { asPathAbsoluteFromCwd } from '@src/utils/asPathAbsoluteFromCwd';

/**
 * .what = ends a reviewed lane: writes its report to `--output`, header first, then emits the
 *         one tally the guard reads
 * .why = 🔴 that stdout tally is the guard's whole contract (`contract.reviewer-output`). a
 *        whole lane (`stepReviewOfCompiled`) and a split lane (`stepReviewByPartitions`) both
 *        end here, so a change to the tally, the file header, or the display-path rule lands
 *        once, and the two lane shapes can never render different contracts
 *
 * .note = 🔴 the ONE time source is `realized.time` — the lane's own realized figures, the
 *         same object the lane returns to its sdk caller. a whole lane's realized time IS the
 *         brain's own clock (`asReviewRunMetricsRealized` copies `metrics.cost.time` through,
 *         and no later fold touches it); a split lane's is the merge's. one field for both
 *         lane shapes, so stdout and the sdk return cannot state two times for one run
 * .note = the review path the file header and stdout show comes from one call to
 *         `getReviewDisplayPath`, so the two render sites never disagree
 *         (rule.require.single-source-of-truth-for-render)
 * .note = the `--optional` skip (`emitReviewSkip`) does not end here: it writes a report with
 *         no header and echoes that report itself, never this tally. it shares the write
 *         communicator (`setReviewOutputFile`), which is the whole of what the two have in common
 */
export const setReviewLaneOutcome = async (input: {
  /** the lane's `--output`, as the caller gave it */
  output: string;
  cwd: string;
  /** the lane's log dir, shown relative to cwd */
  logDir: string;
  /** the formatted review, written below the header */
  body: string;
  summary: { blockersCount: number; nitpicksCount: number };
  realized: ReviewRunMetricsRealizedOfResult;
}): Promise<{ outputAbsolute: string }> => {
  // the two paths every render site shows, computed once
  const outputAbsolute = asPathAbsoluteFromCwd({
    path: input.output,
    cwd: input.cwd,
  });
  const paths = {
    logsRelative: path.relative(input.cwd, input.logDir),
    reviewRelative: getReviewDisplayPath({ outputAbsolute, cwd: input.cwd }),
  };

  // write the report, its summary header first
  await setReviewOutputFile({
    path: outputAbsolute,
    header: genReviewFileHeader({ paths, summary: input.summary }),
    body: input.body,
  });

  // emit the one tally the guard reads
  // the token figures and the cost are null where the spend is unmeasured, so each renders
  // absent, never low
  console.log(
    genReviewOutputStdout({
      tokens: asReviewOutputTokensOfRealized({
        tokens: input.realized.tokens,
      }),
      cost: { total: input.realized.cost?.total ?? null },
      time: { total: asDurationInWords(input.realized.time) },
      paths,
      summary: input.summary,
    }),
  );

  return { outputAbsolute };
};
