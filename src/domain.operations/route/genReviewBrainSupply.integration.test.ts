import { genContextBrain } from 'rhachet';
import { getBrainAtomsByFireworksAI } from 'rhachet-brains-fireworksai';
import { getBrainAtomsByOpenRouter } from 'rhachet-brains-openrouter';
import { given, then, useThen, when } from 'test-fns';

import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import {
  FIXED_FALLBACK_BRAIN,
  genReviewBrainSupply,
} from './genReviewBrainSupply';
import { getReviewCountsViaBrain } from './guard/review/getReviewCountsViaBrain';

/**
 * .what = clamps that the fixed tally brain, with the creds the route cli passes, can tally a
 *   prose verdict against its live provider
 * .why = the fixed brain was `fireworks/deepseek/v4-flash`, and the fireworks account answers
 *   every call with a 412 suspension. so every l3 lane that wrote its verdict in prose ended in
 *   `review tally fallback failed`, and the stone could not pass. the review default already
 *   moved to openrouter (fulcrum F19); the tally brain did not. a dead provider turns this red
 *
 * .note = the brain is built from the explicit atoms of every installed provider, never via
 *   rhachet's discovery mode: under jest, discovery finds no brain at all (`available: none`).
 *   the choice and the creds are the production ones, so the CONSTANT is what is under test
 */
const buildWithEveryProvider = async (input: {
  choice: string;
  creds: { keyrack: { owner: string; env: string } };
}) =>
  genContextBrain({
    brains: {
      atoms: [...getBrainAtomsByFireworksAI(), ...getBrainAtomsByOpenRouter()],
      repls: [],
    },
    choice: input.choice,
    creds: input.creds,
  });

// a real brain call; allow for provider latency
jest.setTimeout(180000);

describe('genReviewBrainSupply (the fixed tally brain)', () => {
  given('[case1] an l3 lane that wrote its clean verdict in prose', () => {
    // the shape of the `enroll-verif-test-intent` lane: a verdict heading with a blocker
    // count, a table, and no nitpick count line — so the regex tactic cannot read it
    const content = `## Verdict: 0 blockers

No diff loosens an assertion or weakens a previously-locked criterion.

| file | what changed | verdict |
|---|---|---|
| \`getTranscriptSource.integration.test.ts\` | removed skip patterns | **strengthened** |`;

    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] the fixed tally brain tallies it',
      () => {
        const counts = useThen('the tally succeeds', async () =>
          getReviewCountsViaBrain(
            { content },
            genReviewBrainSupply(
              {
                choice: FIXED_FALLBACK_BRAIN,
                creds: { keyrack: { owner: 'ehmpath', env: 'prep' } },
              },
              { build: buildWithEveryProvider },
            ),
          ),
        );

        then('it reads a clean pass', () => {
          expect(counts).toEqual({ detected: true, blockers: 0, nitpicks: 0 });
        });
      },
    );
  });
});
