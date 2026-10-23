import { sleep } from 'iso-time';

import { asReviewPrimeFaultLine } from '@src/domain.operations/review/prime/asReviewPrimeFaultLine';
import type { ReviewPrefixPrimeOutcome } from '@src/domain.operations/review/prime/ReviewPrefixPrimeOutcome';
import { asWatermarkFaultOrThrow } from '@src/domain.operations/review/watermark/asWatermarkFaultOrThrow';

import { getOneGatherOfLeader } from './getOneGatherOfLeader';
import { getOneMsLeftOfMeet } from './getOneMsLeftOfMeet';
import { getOneOutcomeOfPoke } from './getOneOutcomeOfPoke';

/**
 * .what = the leader's part of the meet: gather, then poke only where a peer would read it
 * .why = behind a name, so the orchestrator reads "lead, then release"
 *        (rule.forbid.decode-friction-in-orchestrators). every wait is capped by what the
 *        lane's deadline left the meet, so the leader's own review departs inside its bound
 */
export const getOneOutcomeOfLeader = async (input: {
  meet: { cwd: string; key: string };
  nonce: string;
  ms: { gather: number };
  deadline: { msOfStop: number };
  prime: () => Promise<unknown>;
}): Promise<ReviewPrefixPrimeOutcome> => {
  // gather — a prime pays only where a peer would read it; never past the deadline
  await sleep({
    milliseconds: Math.min(input.ms.gather, getOneMsLeftOfMeet(input.deadline)),
  });

  // a store fault pours cold, like every other read of the meet; only a defect rethrows
  const gathered = await getOneGatherOfLeader({
    meet: input.meet,
    nonce: input.nonce,
  }).catch(asWatermarkFaultOrThrow);
  if (typeof gathered !== 'string') {
    console.error(
      asReviewPrimeFaultLine({ kind: 'store', cause: gathered.fault }),
    );
    return 'faulted';
  }
  if (gathered === 'solo') return 'solo';

  // poke within what the deadline left; survive only a prime fault
  return getOneOutcomeOfPoke({ prime: input.prime, deadline: input.deadline });
};
