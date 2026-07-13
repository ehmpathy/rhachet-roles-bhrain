import type { BrainChoice, ContextBrain } from 'rhachet';
import { given, then, useThen, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import type { ContextReviewBrainSupply } from '../../genReviewBrainSupply';
import { getReviewCounts } from './getReviewCounts';

/**
 * .what = integration tests for the cascade orchestrator
 * .why = proves the tactic precedence (deterministic → exit-0 gate → probabilistic) AND the
 *        zero-cost guarantee: a numeric-content reviewer never even constructs a brain. the
 *        probabilistic branch is exercised against the REAL test brain (no mocks), wrapped in
 *        repeatably per rule.require.repeatable-for-llm-tests.
 */

// increase timeout for brain invocations (3 minutes)
jest.setTimeout(180000);

// a supplier that THROWS if the brain is ever built — proves the deterministic path is free
const genSupplyThatThrows = (): ContextReviewBrainSupply => ({
  getReviewBrain: async () => {
    throw new Error(
      'brain built on a path that should have stayed deterministic',
    );
  },
});

// a real-brain supplier for the probabilistic path
const genRealSupply = (): ContextReviewBrainSupply => {
  let cached: ContextBrain<BrainChoice> | null = null;
  return {
    getReviewBrain: async () => {
      if (cached) return cached;
      cached = genTestBrainContext({ brain: DEFAULT_TEST_BRAIN });
      return cached;
    },
  };
};

describe('getReviewCounts', () => {
  given('[case1] numeric content (reviewer emits numbers), exit 0', () => {
    const content = `0 blockers\n2 nitpicks`;

    when(
      '[t0] measured with a supplier that throws if the brain is built',
      () => {
        const result = useThen('it succeeds deterministically', async () =>
          getReviewCounts({ content, exitCode: 0 }, genSupplyThatThrows()),
        );

        then('the tactic is deterministic', () => {
          expect(result.detected).toBe(true);
          if (!result.detected) throw new Error('expected detected');
          expect(result.tactic).toBe('deterministic');
        });

        then('the counts are read verbatim', () => {
          if (!result.detected) throw new Error('expected detected');
          expect(result.blockers).toBe(0);
          expect(result.nitpicks).toBe(2);
        });

        then(
          'the brain was never built (zero cost for a numeric reviewer)',
          () => {
            // a supplier that throws on build would make result reject if the brain were built;
            // a detected result proves getReviewBrain() was never called
            expect(result.detected).toBe(true);
          },
        );
      },
    );
  });

  given('[case2] non-zero exit (crashed reviewer)', () => {
    const content = `some prose about the review, no numbers`;

    when('[t0] measured with exit code 1', () => {
      const result = useThen('it succeeds without a verdict', async () =>
        getReviewCounts({ content, exitCode: 1 }, genSupplyThatThrows()),
      );

      then('it returns detected=false (brain never rescues a crash)', () => {
        expect(result.detected).toBe(false);
      });
    });
  });

  given('[case3] prose content, exit 0 (reviewer writes prose)', () => {
    const content = `## summary

i found two must-fix problems and one optional suggestion to clean up.
the two problems block the change; the suggestion is advisory only.`;

    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] measured with a real brain supplier',
      () => {
        const result = useThen('it succeeds probabilistically', async () =>
          getReviewCounts({ content, exitCode: 0 }, genRealSupply()),
        );

        then('the tactic is probabilistic', () => {
          expect(result.detected).toBe(true);
          if (!result.detected) throw new Error('expected detected');
          expect(result.tactic).toBe('probabilistic');
        });

        then('the counts reflect the prose (2 blockers, 1 nitpick)', () => {
          if (!result.detected) throw new Error('expected detected');
          expect(result.blockers).toBe(2);
          expect(result.nitpicks).toBe(1);
        });
      },
    );
  });

  given('[case4] garbage content, exit 0 (no verdict)', () => {
    const content = `asdf qwer zxcv lorem ipsum dolor sit amet`;

    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] measured with a real brain supplier',
      () => {
        const result = useThen('it succeeds', async () =>
          getReviewCounts({ content, exitCode: 0 }, genRealSupply()),
        );

        then('it returns detected=false (no fabricated verdict)', () => {
          expect(result.detected).toBe(false);
        });
      },
    );
  });
});
