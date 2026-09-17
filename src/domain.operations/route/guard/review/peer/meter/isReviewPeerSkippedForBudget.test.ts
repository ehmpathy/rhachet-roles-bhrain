import { given, then, when } from 'test-fns';

import { isReviewPeerSkippedForBudget } from './isReviewPeerSkippedForBudget';

describe('isReviewPeerSkippedForBudget', () => {
  given('[case1] the slug is in the authoritative exhausted set', () => {
    when(
      '[t0] it is asked, with budget to spare and an artifact this pass',
      () => {
        then('it is skipped — the set outranks both other inputs', () => {
          expect(
            isReviewPeerSkippedForBudget({
              slug: 'alpha',
              exhaustedSlugs: ['alpha'],
              hasArtifactThisPass: true,
              rounds: 0,
              budget: 5,
            }),
          ).toEqual(true);
        });
      },
    );
  });

  given(
    '[case2] the slug is absent from the set and the level has not settled',
    () => {
      when(
        '[t0] rounds have reached budget, with no artifact this pass',
        () => {
          then('the floor fires — it is skipped', () => {
            expect(
              isReviewPeerSkippedForBudget({
                slug: 'alpha',
                exhaustedSlugs: [],
                hasArtifactThisPass: false,
                rounds: 5,
                budget: 5,
              }),
            ).toEqual(true);
          });
        },
      );

      when(
        '[t1] rounds have reached budget, with an artifact this pass',
        () => {
          then(
            'it is NOT skipped — the pass that spends the last round reads rejected',
            () => {
              expect(
                isReviewPeerSkippedForBudget({
                  slug: 'alpha',
                  exhaustedSlugs: [],
                  hasArtifactThisPass: true,
                  rounds: 5,
                  budget: 5,
                }),
              ).toEqual(false);
            },
          );
        },
      );

      when('[t2] rounds are below budget, with no artifact this pass', () => {
        then('it is NOT skipped — budget remains', () => {
          expect(
            isReviewPeerSkippedForBudget({
              slug: 'alpha',
              exhaustedSlugs: [],
              hasArtifactThisPass: false,
              rounds: 4,
              budget: 5,
            }),
          ).toEqual(false);
        });
      });
    },
  );

  given('[case3] the precedence between the two clauses', () => {
    when(
      '[t0] the set says skipped while every floor input says not-skipped',
      () => {
        then(
          'the set wins — this is the precedence the level gate depends on',
          () => {
            expect(
              isReviewPeerSkippedForBudget({
                slug: 'alpha',
                exhaustedSlugs: ['beta', 'alpha'],
                hasArtifactThisPass: true,
                rounds: 1,
                budget: 99,
              }),
            ).toEqual(true);
          },
        );
      },
    );

    when('[t1] a different slug is in the set', () => {
      then('it does not bleed across slugs', () => {
        expect(
          isReviewPeerSkippedForBudget({
            slug: 'alpha',
            exhaustedSlugs: ['beta'],
            hasArtifactThisPass: true,
            rounds: 1,
            budget: 99,
          }),
        ).toEqual(false);
      });
    });
  });
});
