import { given, then, when } from 'test-fns';

import { ENV_OF_REVIEW_SUBPROCESS } from '@src/domain.operations/isReviewSubprocess';

import { asEnvWithReviewPrimeMeet } from './asEnvWithReviewPrimeMeet';
import {
  asReviewPrimeMeetFromEnv,
  ENV_OF_REVIEW_PRIME_MEET,
} from './asReviewPrimeMeetFromEnv';

/**
 * .what = the round trip of the prime-meet marker: the pour writes it, the review reads it
 * .why = the meet is the one question the subprocess marker cannot answer — a streamed
 *        `review.by --for` child is a review child with no peers — so these cells pin
 *        that only the pour's explicit `join` joins, and that a parent's marker never
 *        leaks into a child the parent did not pour
 */
const TEST_CASES: {
  description: string;
  given: { env: NodeJS.ProcessEnv; meet: 'join' | 'skip' };
  expect: 'join' | 'skip';
}[] = [
  {
    description: 'a pour of peers writes join, and the child reads join',
    given: { env: {}, meet: 'join' },
    expect: 'join',
  },
  {
    description: 'a lone run writes skip, and the child reads skip',
    given: { env: {}, meet: 'skip' },
    expect: 'skip',
  },
  {
    description:
      '🔴 a review child with no pour — the subprocess marker alone — reads skip',
    given: { env: { [ENV_OF_REVIEW_SUBPROCESS]: '1' }, meet: 'skip' },
    expect: 'skip',
  },
  {
    description:
      '🔴 a parent that itself joined spawns a lone child — the marker does not leak',
    given: { env: { [ENV_OF_REVIEW_PRIME_MEET]: 'join' }, meet: 'skip' },
    expect: 'skip',
  },
];

describe('asEnvWithReviewPrimeMeet', () => {
  given(
    '[case1] the pour writes a child env, and the child reads it back',
    () => {
      when('[t0] each cell is written and read', () => {
        TEST_CASES.map((thisCase) =>
          then(thisCase.description, () => {
            const env = asEnvWithReviewPrimeMeet(thisCase.given);
            expect(asReviewPrimeMeetFromEnv({ env })).toEqual(thisCase.expect);
          }),
        );
      });
    },
  );

  given('[case2] a typo of the marker value', () => {
    when('[t0] it is read', () => {
      then('it skips — only an explicit join joins', () => {
        expect(
          asReviewPrimeMeetFromEnv({
            env: { [ENV_OF_REVIEW_PRIME_MEET]: 'Join' },
          }),
        ).toEqual('skip');
      });
    });
  });

  given('[case3] the rest of the parent env', () => {
    when('[t0] the child env is written', () => {
      then('every other var rides through untouched', () => {
        const env = asEnvWithReviewPrimeMeet({
          env: { PATH: '/bin', [ENV_OF_REVIEW_SUBPROCESS]: '1' },
          meet: 'skip',
        });
        expect(env).toEqual({ PATH: '/bin', [ENV_OF_REVIEW_SUBPROCESS]: '1' });
      });
    });
  });
});
