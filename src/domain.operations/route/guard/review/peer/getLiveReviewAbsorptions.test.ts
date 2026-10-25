import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLiveReviewAbsorptions } from './getLiveReviewAbsorptions';
import type { ReviewAbsorption } from './ReviewAbsorption';

const DIR_REAL = '/real/repo/.behavior/v0/.reviews/peer';
const DIR_ALIAS = '/alias/repo/.behavior/v0/.reviews/peer';
const FILE_I1 = '1.test._.review.i001.abc123.r001._.given.by_peer.mech.md';
const FILE_I2 = '1.test._.review.i002.def456.r001._.given.by_peer.mech.md';

const asGiven = (input: {
  iteration: number;
  pathGiven: string;
}): RouteGuardReviewPeerGiven => ({
  slug: 'mech',
  blockers: 1,
  nitpicks: 0,
  unreadable: false,
  constraint: null,
  iteration: input.iteration,
  pathGiven: input.pathGiven,
});

const asAbsorption = (input: {
  status: 'disputed' | 'conceded';
  given: string;
}): ReviewAbsorption => ({
  status: input.status,
  reviewer: 'mech',
  about: 'blocker.1',
  given: input.given,
  severity: input.status === 'conceded' ? 'better' : undefined,
});

/**
 * .what = the live-stance filter, at the grain of its one rule
 * .why = it feeds the disputed shed, the better shed, the urgent read, and the budget warrant —
 *        so each row form, and the lapse, is pinned here and not only through the acceptance walk
 */
describe('getLiveReviewAbsorptions', () => {
  given(
    '[case1] the givens are read through an alias of the dir the stances were written under',
    () => {
      const givens = [
        asGiven({ iteration: 1, pathGiven: `${DIR_ALIAS}/${FILE_I1}` }),
      ];

      when('[t0] the stances name the given by filename', () => {
        then('both the dispute and the concession stay live', () => {
          const absorptions = [
            asAbsorption({ status: 'disputed', given: FILE_I1 }),
            asAbsorption({ status: 'conceded', given: FILE_I1 }),
          ];
          expect(getLiveReviewAbsorptions({ absorptions, givens })).toEqual(
            absorptions,
          );
        });
      });

      when(
        '[t1] the stances carry the legacy absolute path of the real dir',
        () => {
          then('both stay live — the directory is not identity', () => {
            const absorptions = [
              asAbsorption({
                status: 'disputed',
                given: `${DIR_REAL}/${FILE_I1}`,
              }),
              asAbsorption({
                status: 'conceded',
                given: `${DIR_REAL}/${FILE_I1}`,
              }),
            ];
            expect(getLiveReviewAbsorptions({ absorptions, givens })).toEqual(
              absorptions,
            );
          });
        },
      );
    },
  );

  given('[case2] the lane spoke again after the stances were declared', () => {
    const givens = [
      asGiven({ iteration: 1, pathGiven: `${DIR_ALIAS}/${FILE_I1}` }),
      asGiven({ iteration: 2, pathGiven: `${DIR_ALIAS}/${FILE_I2}` }),
    ];

    when('[t0] the stances answer the older given', () => {
      then('they lapse, in either row form', () => {
        const absorptions = [
          asAbsorption({ status: 'disputed', given: FILE_I1 }),
          asAbsorption({ status: 'conceded', given: `${DIR_REAL}/${FILE_I1}` }),
        ];
        expect(getLiveReviewAbsorptions({ absorptions, givens })).toEqual([]);
      });
    });
  });
});
