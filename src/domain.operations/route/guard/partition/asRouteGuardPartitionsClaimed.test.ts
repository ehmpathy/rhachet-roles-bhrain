import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionsClaimed } from './asRouteGuardPartitionsClaimed';

const ROUTE = '.behavior/v2026_01_01.demo';

const HELD = [
  `review=src/review/**,${ROUTE}/**`,
  `route=src/route/**,${ROUTE}/**`,
];

describe('asRouteGuardPartitionsClaimed', () => {
  given('[case1] one glob claimed into one held partition', () => {
    when('[t0] the claim is merged', () => {
      const result = asRouteGuardPartitionsClaimed({
        partition: HELD,
        claims: [{ glob: 'docs/**', into: 'review' }],
      });

      then(
        '🔴 the whole set comes back, the claim folded into its slug',
        () => {
          expect(result).toEqual({
            partition: [
              `review=src/review/**,${ROUTE}/**,docs/**`,
              `route=src/route/**,${ROUTE}/**`,
            ],
            unknownInto: [],
          });
        },
      );

      then('🔴 no value carries a brace', () => {
        expect(result.partition?.join('\n')).not.toMatch(/[{}]/);
      });
    });
  });

  given(
    '[case2] a comma list claimed, plus a second claim into another slug',
    () => {
      when('[t0] the claims are merged', () => {
        const result = asRouteGuardPartitionsClaimed({
          partition: HELD,
          claims: [
            { glob: 'docs/a/**,docs/b.md', into: 'review' },
            { glob: 'blackbox/route.*', into: 'route' },
          ],
        });

        then('each glob lands in its own slug, every slug kept once', () => {
          expect(result.partition).toEqual([
            `review=src/review/**,${ROUTE}/**,docs/a/**,docs/b.md`,
            `route=src/route/**,${ROUTE}/**,blackbox/route.*`,
          ]);
        });
      });
    },
  );

  given('[case3] a glob the partition already holds', () => {
    when('[t0] it is claimed again', () => {
      const result = asRouteGuardPartitionsClaimed({
        partition: HELD,
        claims: [{ glob: 'src/review/**', into: 'review' }],
      });

      then('the set is unchanged — a claim is idempotent', () => {
        expect(result.partition).toEqual(HELD);
      });
    });
  });

  given('[case4] a claim into a slug the scope does not hold', () => {
    when('[t0] the claim is merged', () => {
      const result = asRouteGuardPartitionsClaimed({
        partition: HELD,
        claims: [
          { glob: 'docs/**', into: 'docs' },
          { glob: 'x/**', into: 'review' },
        ],
      });

      then('🔴 it is refused: no set, and the unknown slug named', () => {
        expect(result).toEqual({ partition: null, unknownInto: ['docs'] });
      });
    });
  });
});
