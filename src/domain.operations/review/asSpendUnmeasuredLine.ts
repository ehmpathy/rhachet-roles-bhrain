import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the stderr line a review prints when an ask may have been billed with no reported
 *         spend, so the run writes no realized artifact
 * .why = the line names why the meter will grade the run `unknown`, so a driver reads the
 *        cause where it happened. behind a name, so the orchestrator reads "say the spend is
 *        unmeasured" rather than a template to simulate
 *
 * .note = the count renders through the shared noun agreement (`asCountedNoun`), so one ask
 *         reads `1 ask`, never `1 ask(s)`
 */
export const asSpendUnmeasuredLine = (input: { unmeasured: number }): string =>
  `💥 MalfunctionError: ${asCountedNoun({ count: input.unmeasured, one: 'ask', many: 'asks' })} may have been billed with no reported spend (a runaway with no output count, or a fault a retry swallowed); this run's spend is unmeasured, so ${NAME_OF_RUN_ARTIFACT.realized} is not written`;
