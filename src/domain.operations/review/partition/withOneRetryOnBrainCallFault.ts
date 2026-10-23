import type { ReviewLaneClock } from '@src/domain.objects/Reviewer/ReviewLaneClock';
import { asErrorHeadline } from '@src/domain.operations/review/asErrorHeadline';
import { isErrorOfReplyCutAtOutputLimit } from '@src/domain.operations/review/isErrorOfReplyCutAtOutputLimit';
import { isReviewBoundSpent } from '@src/domain.operations/review/isReviewBoundSpent';
import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

/**
 * .what = runs one partition, and runs it once more if the brain call itself failed — and
 *         returns the fault it swallowed beside the value
 * .why = one dropped socket in one partition would otherwise score that partition a
 *        blocker and send the lane back for a re-arrive that re-runs every partition. a
 *        provider fault (a closed socket, a 503) is transient by nature, so one more attempt
 *        is the cheap repair
 *
 * .note = 🔴 the swallowed fault is RETURNED, never dropped. a socket that closed mid-stream
 *         may close after the provider billed, and the first attempt reports no figures. a
 *         caller that read the retry's value alone would sum a lane cost too low, beside a
 *         meter that grades the first attempt's run `unknown` (`0.wish`: never under-report)
 * .note = only a `ReviewBrainCallError` earns the retry. a timeout already spent its whole
 *         deadline, a caller fault (a bad request, an overflow) fails identically twice, and
 *         either would only double the wait
 * .note = bounded at one retry, never a loop: a second provider fault in a row is a real
 *         outage, and the lane must say so
 * .note = 🔴 the retry spends the LANE's bound, never a fresh one: it reads the lane's own
 *         clock first, and once that bound is spent it re-asks naught — the partition settles
 *         as a `ReviewTimeoutError`, one blocker in the merged report. a retry past the bound
 *         would race the outer subprocess kill, and a kill drops the merged report and every
 *         verdict already paid for (rule.forbid.dropped-partial-review-progress)
 */
export const withOneRetryOnBrainCallFault = async <T>(input: {
  operation: () => Promise<T>;
  /** the partition's name, so the retry line on stderr says which one dropped */
  name: string;
  /** the lane's one clock, read before the retry re-asks */
  clock: ReviewLaneClock;
}): Promise<{ value: T; faults: { error: unknown }[] }> => {
  try {
    return { value: await input.operation(), faults: [] };
  } catch (error) {
    // rethrow aught that is not a provider fault
    if (!(error instanceof ReviewBrainCallError)) throw error;

    // rethrow a runaway think: it already spent its one retry inside the brain call
    // (`withOutputLimitBrainRetry`), and each such ask bills the whole output limit
    // .note = `cause` is read via Reflect.get (cast-free): the ts lib target predates the
    //         typed Error.cause property
    if (isErrorOfReplyCutAtOutputLimit({ error: Reflect.get(error, 'cause') }))
      throw error;

    // settle as a timeout once the lane's bound is spent: no time is left to re-ask in
    if (isReviewBoundSpent({ clock: input.clock, msOfNow: Date.now() })) {
      console.error(
        `💥 MalfunctionError: partition ${input.name}: the brain call failed (${asErrorHeadline({ error })}); the lane's bound is spent, so no retry`,
      );
      throw new ReviewTimeoutError({
        timeoutMs: input.clock.brainCallTimeoutMs,
      });
    }

    // say so on stderr, then run it once more, and report the fault it swallowed
    console.error(
      `💥 MalfunctionError: partition ${input.name}: the brain call failed (${asErrorHeadline({ error })}); one retry`,
    );
    return { value: await input.operation(), faults: [{ error }] };
  }
};
