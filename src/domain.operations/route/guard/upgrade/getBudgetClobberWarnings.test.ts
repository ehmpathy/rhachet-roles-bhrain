import { given, then, when } from 'test-fns';

import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getBudgetClobberWarnings } from './getBudgetClobberWarnings';

const guardWithPeers = (
  peers: { slug: string; budget: number }[],
): RouteStoneGuard =>
  new RouteStoneGuard({
    path: 'x.guard',
    artifacts: [],
    reviews: {
      peer: peers.map((p) => ({ slug: p.slug, run: 'echo', budget: p.budget })),
    },
    judges: [],
    protect: [],
  });

describe('getBudgetClobberWarnings', () => {
  given(
    '[case1] a template whose budget is lower than the current guard',
    () => {
      when('[t0] advisories are computed', () => {
        then(
          'one structured budget-clobber advisory names the slug + delta',
          () => {
            expect(
              getBudgetClobberWarnings({
                current: guardWithPeers([{ slug: 'r-arch', budget: 5 }]),
                next: guardWithPeers([{ slug: 'r-arch', budget: 3 }]),
              }),
            ).toEqual([
              { type: 'budget-clobber', slug: 'r-arch', before: 5, after: 3 },
            ]);
          },
        );
      });
    },
  );

  given('[case2] a template whose budget is equal or higher', () => {
    when('[t0] advisories are computed for an equal budget', () => {
      then('there are no advisories', () => {
        expect(
          getBudgetClobberWarnings({
            current: guardWithPeers([{ slug: 'r-arch', budget: 3 }]),
            next: guardWithPeers([{ slug: 'r-arch', budget: 3 }]),
          }),
        ).toEqual([]);
      });
    });

    when('[t1] advisories are computed for a higher budget', () => {
      then('there are no advisories', () => {
        expect(
          getBudgetClobberWarnings({
            current: guardWithPeers([{ slug: 'r-arch', budget: 3 }]),
            next: guardWithPeers([{ slug: 'r-arch', budget: 5 }]),
          }),
        ).toEqual([]);
      });
    });
  });

  given('[case3] a reviewer slug absent from the template', () => {
    when('[t0] advisories are computed', () => {
      then('the absent slug raises no advisory', () => {
        expect(
          getBudgetClobberWarnings({
            current: guardWithPeers([{ slug: 'r-gone', budget: 5 }]),
            next: guardWithPeers([{ slug: 'r-arch', budget: 3 }]),
          }),
        ).toEqual([]);
      });
    });
  });
});
