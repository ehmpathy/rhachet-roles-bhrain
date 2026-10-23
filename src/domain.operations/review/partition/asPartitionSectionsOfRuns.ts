import { getReviewDisplayPath } from '@src/domain.operations/review/getReviewDisplayPath';

import { asPartitionFaultSection } from './asPartitionFaultSection';
import type { asReviewPartitionsMergedBody } from './asReviewPartitionsMergedBody';

/**
 * .what = each settled partition run, as the section it leaves in the merged report
 * .why = a fulfilled run leaves its review path and its formatted body; a rejected run
 *        leaves no path and a named fault. the branch lives behind a name, so the
 *        orchestrator reads as "merge the sections of the runs"
 *        (rule.forbid.decode-friction-in-orchestrators)
 */
export const asPartitionSectionsOfRuns = (input: {
  runs: {
    partition: {
      name: string;
      narrow: string[];
      common: string[];
      commonGraded: string[];
    };
    outcome: PromiseSettledResult<{
      output: { path: string };
      review: { formatted: string };
    }>;
  }[];
  /**
   * every fault of the pour, as `asPartitionOutcomesSplit` derived it, so a section can
   * tell one refusal from a lane-wide one off the SAME list the lane section reads
   */
  faults: { error: unknown }[];
  cwd: string;
  route: string | null;
}): Parameters<typeof asReviewPartitionsMergedBody>[0]['sections'] =>
  input.runs.map((run) => {
    // the counts every section states, whatever its outcome
    const counts = {
      name: run.partition.name,
      targetsCount: run.partition.narrow.length,
      commonCount: run.partition.common.length,
      commonGradedCount: run.partition.commonGraded.length,
    };

    // a fault leaves no review path, only its named section
    if (run.outcome.status === 'rejected')
      return {
        ...counts,
        reviewRelative: null,
        formatted: asPartitionFaultSection({
          error: run.outcome.reason,
          faults: input.faults,
          partitionsTotal: input.runs.length,
          route: input.route,
        }),
      };

    // a verdict leaves its review path and its body
    return {
      ...counts,
      reviewRelative: getReviewDisplayPath({
        outputAbsolute: run.outcome.value.output.path,
        cwd: input.cwd,
      }),
      formatted: run.outcome.value.review.formatted,
    };
  });
