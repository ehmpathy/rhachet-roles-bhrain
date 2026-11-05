import { given, then, when } from 'test-fns';

import { BRAIN_OF_ABSENT_ARGS } from '@src/domain.operations/review/meter/BRAIN_OF_ABSENT_ARGS';
import { getOnePrefixVerdictRollup } from '@src/domain.operations/review/meter/getOnePrefixVerdictRollup';
import type {
  ReviewPrefixPair,
  ReviewPrefixVerdict,
} from '@src/domain.operations/review/meter/ReviewPrefixPair';

import { getAllPrefixRollupsByBrain } from './getAllPrefixRollupsByBrain';

/**
 * .what = one round pair with a chosen round brain and verdict
 * .why = the rollup reads the round's brain and the verdict alone
 */
const asPair = (input: {
  brain: string | null;
  verdict: ReviewPrefixVerdict | null;
}): ReviewPrefixPair => ({
  reviewer: 'repo-rules',
  prior: { dir: '/r/a', stone: '5.1', iteration: 1 },
  round: { dir: '/r/b', stone: '5.1', iteration: 2 },
  brains: { prior: input.brain, round: input.brain },
  minutesSincePrior: 10,
  meet: null,
  sharedChars: 1_000,
  expectedTokens: 250,
  expectedFrom: 'prior',
  detectedTokens: 100,
  reach: 0.4,
  verdict: input.verdict,
  breaksIn: 'tail',
  headChars: 500,
});

describe('getAllPrefixRollupsByBrain', () => {
  given('[case1] round pairs, each with a round brain and a verdict', () => {
    when('[t0] they are rolled up by brain', () => {
      then('no pairs roll up to no brains', () => {
        expect(getAllPrefixRollupsByBrain({ pairs: [] })).toEqual([]);
      });

      then(
        'each brain counts its own verdicts, the brain of the most pairs first',
        () => {
          const pairs = [
            asPair({ brain: 'openrouter/qwen/coder', verdict: 'served' }),
            asPair({ brain: 'openrouter/deepseek/flash', verdict: 'missed' }),
            asPair({ brain: 'openrouter/deepseek/flash', verdict: 'served' }),
          ];
          const rows = getAllPrefixRollupsByBrain({ pairs });
          expect(rows.map((row) => row.brain)).toEqual([
            'openrouter/deepseek/flash',
            'openrouter/qwen/coder',
          ]);
          expect(rows[0]?.verdicts).toMatchObject({
            pairs: 2,
            served: 1,
            missed: 1,
          });
          expect(rows[1]?.verdicts).toMatchObject({
            pairs: 1,
            served: 1,
            missed: 0,
          });
        },
      );

      then(
        'a pair whose round names no brain is filed under the absent label, never dropped',
        () => {
          const pairs = [
            asPair({ brain: null, verdict: 'missed' }),
            asPair({ brain: 'openrouter/deepseek/flash', verdict: 'served' }),
          ];
          const rows = getAllPrefixRollupsByBrain({ pairs });
          expect(rows.map((row) => row.brain)).toContain(BRAIN_OF_ABSENT_ARGS);
        },
      );

      then('the brain rows sum to the corpus rollup, field by field', () => {
        const pairs = [
          asPair({ brain: 'openrouter/qwen/coder', verdict: 'unshared' }),
          asPair({ brain: 'openrouter/deepseek/flash', verdict: 'missed' }),
          asPair({ brain: null, verdict: null }),
          asPair({
            brain: 'openrouter/deepseek/flash',
            verdict: 'self-cached',
          }),
        ];
        const corpus = getOnePrefixVerdictRollup({ pairs });
        const summed = getAllPrefixRollupsByBrain({ pairs }).reduce(
          (sum, row) => ({
            pairs: sum.pairs + row.verdicts.pairs,
            served: sum.served + row.verdicts.served,
            missed: sum.missed + row.verdicts.missed,
            lapsed: sum.lapsed + row.verdicts.lapsed,
            selfCached: sum.selfCached + row.verdicts.selfCached,
            overReach: sum.overReach + row.verdicts.overReach,
            unshared: sum.unshared + row.verdicts.unshared,
            unmeasured: sum.unmeasured + row.verdicts.unmeasured,
          }),
          getOnePrefixVerdictRollup({ pairs: [] }),
        );
        expect(summed).toEqual(corpus);
      });
    });
  });
});
