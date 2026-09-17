import { given, then, when } from 'test-fns';

import { getAllReviewLevelsAsc } from './getAllReviewLevelsAsc';

describe('getAllReviewLevelsAsc', () => {
  given('[case1] a set whose levels are declared out of order', () => {
    when('[t0] the levels are read', () => {
      then('they come back lowest first', () => {
        expect(
          getAllReviewLevelsAsc({
            peers: [{ level: 3 }, { level: 1 }, { level: 2 }],
          }),
        ).toEqual([1, 2, 3]);
      });
    });
  });

  given('[case2] a set where several reviewers share one level', () => {
    when('[t0] the levels are read', () => {
      then('each level appears exactly once', () => {
        expect(
          getAllReviewLevelsAsc({
            peers: [{ level: 1 }, { level: 1 }, { level: 3 }, { level: 1 }],
          }),
        ).toEqual([1, 3]);
      });
    });
  });

  given('[case3] levels that a lexical sort would order wrongly', () => {
    // .why = `[1, 10, 2].sort()` yields [1, 10, 2] under the default comparator,
    //        so this clamps the numeric comparator rather than the dedupe
    when('[t0] the levels are read', () => {
      then('10 sorts after 2, never after 1', () => {
        expect(
          getAllReviewLevelsAsc({
            peers: [{ level: 10 }, { level: 2 }, { level: 1 }],
          }),
        ).toEqual([1, 2, 10]);
      });
    });
  });

  given('[case4] a set with no reviewers at all', () => {
    when('[t0] the levels are read', () => {
      then('the result is empty rather than a throw', () => {
        expect(getAllReviewLevelsAsc({ peers: [] })).toEqual([]);
      });
    });
  });

  given('[case5] a set that declares one level only', () => {
    when('[t0] the levels are read', () => {
      then('that one level comes back', () => {
        expect(
          getAllReviewLevelsAsc({ peers: [{ level: 1 }, { level: 1 }] }),
        ).toEqual([1]);
      });
    });
  });

  given('[case6] any set at all', () => {
    when('[t0] the levels are read', () => {
      then('the input array is left untouched', () => {
        const peers = [{ level: 3 }, { level: 1 }];
        getAllReviewLevelsAsc({ peers });
        expect(peers).toEqual([{ level: 3 }, { level: 1 }]);
      });
    });
  });
});
