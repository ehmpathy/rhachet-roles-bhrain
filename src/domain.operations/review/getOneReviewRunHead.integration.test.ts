import { createHash } from 'crypto';
import { castBriefsToPrompt } from 'rhachet';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { asRoleOfSharedPrefix } from './asRoleOfSharedPrefix';
import { getOneReviewRunHead } from './getOneReviewRunHead';
import { setPromptHeadArtifact } from './setPromptHeadArtifact';

/**
 * .what = the lane head of one run, read the way production reads it, beside the system
 *         prompt the brain call casts from that same artifact
 * .why = the lane head (`getOneReviewRunHead`) hashes the head artifact off disk; the
 *        brain call sends the system prompt cast from it. two views of one fact
 */
const getOneRunDigests = async (input: {
  head: string;
}): Promise<{
  laneHead: string | null;
  system: string;
}> => {
  const logDir = genTempDir({ slug: 'review-run-head-vs-system' });
  const artifact = await setPromptHeadArtifact({ logDir, head: input.head });
  const system = await castBriefsToPrompt(
    asRoleOfSharedPrefix({ prefix: artifact }),
  );
  return {
    laneHead: await getOneReviewRunHead({ dir: logDir }),
    system,
  };
};

/**
 * .what = the clamp that a lane names the exact bytes a shared prefix carries
 * .why = the lane ordinal fold groups runs by lane, and the lane's whole claim is
 *        "these runs share a cache". a cache keys on the system prompt, so that claim is
 *        true only while the lane head digests the system prompt itself — a trim, a
 *        normalization, or a wrapper on either side would part them with no red
 */
describe('getOneReviewRunHead', () => {
  const scene = useBeforeAll(async () => ({
    first: await getOneRunDigests({ head: '# rules\n\nname the actor.\n' }),
    again: await getOneRunDigests({ head: '# rules\n\nname the actor.\n' }),
    other: await getOneRunDigests({ head: '# rules\n\nname the act.\n' }),
  }));

  given('[case1] the head a review writes, read as a lane', () => {
    when('[t0] the lane head is computed', () => {
      then(
        '🔴 it digests the very bytes the brain call sends — the system prompt',
        () => {
          expect(scene.first.laneHead).toEqual(
            createHash('sha256')
              .update(scene.first.system)
              .digest('hex')
              .slice(0, 16),
          );
        },
      );
    });
  });

  given('[case2] two runs with one head', () => {
    when('[t0] both lane heads are compared', () => {
      then('🔴 one lane head', () => {
        expect(scene.again.laneHead).toEqual(scene.first.laneHead);
      });
    });
  });

  given('[case3] two runs whose heads differ by one word', () => {
    when('[t0] both lane heads are compared', () => {
      then('🔴 a new head is a new lane', () => {
        expect(scene.other.laneHead).not.toEqual(scene.first.laneHead);
      });
    });
  });
});
