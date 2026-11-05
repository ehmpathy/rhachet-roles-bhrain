import { given, then, when } from 'test-fns';

import { getOneReviewRunMeet } from './getOneReviewRunMeet';

describe('getOneReviewRunMeet', () => {
  given('[case1] a lane that joins its pour', () => {
    when('[t0] the meet settles', () => {
      then('it names the outcome the meet returned', async () => {
        const meet = await getOneReviewRunMeet({
          partition: false,
          join: true,
          meet: async () => ({ outcome: 'awaited' }),
        });
        expect(meet).toEqual('awaited');
      });
    });
  });

  given('[case2] a run that does not meet', () => {
    const calls: string[] = [];
    const meet = async () => {
      calls.push('meet');
      return { outcome: 'primed' as const };
    };

    when('[t0] it is a partition', () => {
      then('🔴 it names the split-lane skip, and runs no meet', async () => {
        expect(
          await getOneReviewRunMeet({ partition: true, join: true, meet }),
        ).toEqual('skipped.partition');
        expect(calls).toEqual([]);
      });
    });

    when('[t1] it is a lone run', () => {
      then('it names the lone skip, and runs no meet', async () => {
        expect(
          await getOneReviewRunMeet({ partition: false, join: false, meet }),
        ).toEqual('skipped.lone');
        expect(calls).toEqual([]);
      });
    });
  });
});
