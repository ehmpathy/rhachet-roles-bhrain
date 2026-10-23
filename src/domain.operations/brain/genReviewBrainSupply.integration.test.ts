import { type BrainChoice, type ContextBrain, genContextBrain } from 'rhachet';
import { getBrainAtomsByOpenRouter } from 'rhachet-brains-openrouter';
import { given, then, useThen, when } from 'test-fns';

import { BRAIN_CALL_TEST_TIMEOUT_MS } from '@src/.test/infra/brainCallTestTimeout';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';
import { CREDS_OF_REVIEW_BRAIN } from '@src/domain.operations/brain/CREDS_OF_REVIEW_BRAIN';
import { getOneReviewCountsViaBrain } from '@src/domain.operations/review.tally/getOneReviewCountsViaBrain';

import { genReviewBrainSupply } from './genReviewBrainSupply';

/**
 * .what = clamps that the fixed tally brain, under the review creds, can tally a prose verdict
 *   against its live provider
 * .why = `reviewDefaultBrains.test.ts` proves the tally slug is registered; it cannot prove the
 *   provider behind it answers. a provider that refuses every call (a suspended account answers
 *   412) turns every prose verdict into `review tally fallback failed`, and the stone cannot
 *   pass. only a live call catches that, so this one turns red when the provider is dead
 *
 * .note = the brain is built from the openrouter atoms explicitly, never via rhachet's discovery
 *   mode: under jest, discovery finds no brain at all (`available: none`). the supply picks the
 *   choice, so the constant `FIXED_FALLBACK_BRAIN` is what is under test
 */
const buildViaOpenRouter = async (input: {
  choice: string;
}): Promise<ContextBrain<BrainChoice>> =>
  genContextBrain({
    brains: { atoms: getBrainAtomsByOpenRouter(), repls: [] },
    choice: input.choice,
    creds: CREDS_OF_REVIEW_BRAIN,
  });

// a real brain call; the bound and its measured tail live on BRAIN_CALL_TEST_TIMEOUT_MS
jest.setTimeout(BRAIN_CALL_TEST_TIMEOUT_MS);

describe('genReviewBrainSupply (the fixed tally brain, live)', () => {
  given('[case1] an l3 lane that wrote its clean verdict in prose', () => {
    // a verdict heading with a blocker count, a table, and no nitpick count line — so the regex
    // tactic cannot read it and the tally falls back to the brain
    const content = `## Verdict: 0 blockers

No diff loosens an assertion or weakens a previously-locked criterion.

| file | what changed | verdict |
|---|---|---|
| \`getTranscriptSource.integration.test.ts\` | removed skip patterns | **strengthened** |`;

    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] the fixed tally brain tallies it',
      () => {
        const counts = useThen('the tally succeeds', async () =>
          getOneReviewCountsViaBrain(
            { content },
            genReviewBrainSupply({ build: buildViaOpenRouter }),
          ),
        );

        then('it reads a clean pass', () => {
          expect(counts).toMatchObject({
            detected: true,
            blockers: 0,
            nitpicks: 0,
          });
        });
      },
    );
  });
});
