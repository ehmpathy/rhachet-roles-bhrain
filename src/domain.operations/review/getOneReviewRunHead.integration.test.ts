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
 * .what = the span of a corpus-first head ahead of its target block
 * .why = the goal quotes `## target`, so a cut sought from the head's start would be caught
 */
const HEAD_AHEAD_OF_TARGET =
  'goal: exhaustive. review the `## target` section.\n\n## output format\n\nN blockers\nN nitpicks\n\n';

/**
 * .what = a span ahead of the target block that runs past one 64 KiB read chunk
 * .why = each `🌊` is four utf-8 bytes, and 30,001 of them plus the preamble put a chunk
 *        edge inside a char, so the read must decode across it
 */
const HEAD_LONG_AHEAD_OF_TARGET = `goal: exhaustive.\n${'🌊'.repeat(30_001)}\n\n## output format\n\nN blockers\nN nitpicks\n\n`;

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
    corpusOne: await getOneRunDigests({
      head: `${HEAD_AHEAD_OF_TARGET}## target\n\n<target>\nexport const surf = 1;\n</target>\n`,
    }),
    corpusRepaired: await getOneRunDigests({
      head: `${HEAD_AHEAD_OF_TARGET}## target\n\n<target>\nexport const surf = 2;\n</target>\n`,
    }),
    corpusNewGoal: await getOneRunDigests({
      head: `${HEAD_AHEAD_OF_TARGET.replace('exhaustive', 'focused')}## target\n\n<target>\nexport const surf = 1;\n</target>\n`,
    }),
    // a span past one read chunk, of multibyte chars, so a chunk edge splits a char
    // and the cut sits chunks in; then a corpus of several chunks behind it
    corpusLong: await getOneRunDigests({
      head: `${HEAD_LONG_AHEAD_OF_TARGET}## target\n\n<target>\n${'a'.repeat(200_000)}\n</target>\n`,
    }),
    corpusLongRepaired: await getOneRunDigests({
      head: `${HEAD_LONG_AHEAD_OF_TARGET}## target\n\n<target>\n${'b'.repeat(200_000)}\n</target>\n`,
    }),
  }));

  given('[case6] 🔴 a head whose span runs past one read chunk', () => {
    when('[t0] the lane head is read', () => {
      then('it digests the span exactly, as a whole-file read would', () => {
        expect(scene.corpusLong.laneHead).toEqual(
          createHash('sha256')
            .update(HEAD_LONG_AHEAD_OF_TARGET)
            .digest('hex')
            .slice(0, 16),
        );
      });

      then('a repaired corpus behind it keeps the lane', () => {
        expect(scene.corpusLongRepaired.laneHead).toEqual(
          scene.corpusLong.laneHead,
        );
      });
    });
  });

  given('[case4] 🔴 two corpus-first runs whose target bodies differ', () => {
    when('[t0] both lane heads are compared', () => {
      then(
        'one lane — a repaired file parts the prefix, never the lane',
        () => {
          expect(scene.corpusRepaired.laneHead).toEqual(
            scene.corpusOne.laneHead,
          );
        },
      );
    });
  });

  given('[case5] two corpus-first runs whose instructions differ', () => {
    when('[t0] both lane heads are compared', () => {
      then('two lanes — the span ahead of the corpus is the key', () => {
        expect(scene.corpusNewGoal.laneHead).not.toEqual(
          scene.corpusOne.laneHead,
        );
      });
    });
  });

  given('[case1] a rubric-first head a review writes, read as a lane', () => {
    when('[t0] the lane head is computed', () => {
      then(
        '🔴 it digests the very bytes the brain call sends — the system prompt, which holds no target block',
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
