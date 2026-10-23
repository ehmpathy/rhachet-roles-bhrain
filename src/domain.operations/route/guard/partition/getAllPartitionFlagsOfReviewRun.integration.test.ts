import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getAllPartitionFlagsOfReviewRun } from './getAllPartitionFlagsOfReviewRun';
import { setRouteGuardPartitions } from './setRouteGuardPartitions';

const ROUTE = '.behavior/v2026_01_01.demo';
const asGuardOutput = (input: { stone: string; slug: string }): string =>
  `${ROUTE}/.reviews/peer/${input.stone}._.review.i001.a1b2c3d.r001._.given.by_peer.${input.slug}.report.md`;
const SET_ALL = [
  `review={src/review/**,${ROUTE}/**}`,
  `route={src/route/**,${ROUTE}/**}`,
];
const SET_OVERRIDE = [`solo={src/**,${ROUTE}/**}`];

describe('getAllPartitionFlagsOfReviewRun', () => {
  given('[case1] a route with an @all set and one override', () => {
    const cwd = genTempDir({ slug: 'partition-flags-of-run' });
    useBeforeAll(async () => {
      await setRouteGuardPartitions({
        route: ROUTE,
        cwd,
        scope: { kind: 'all' },
        partition: SET_ALL,
      });
      await setRouteGuardPartitions({
        route: ROUTE,
        cwd,
        scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
        partition: SET_OVERRIDE,
      });
      return {};
    });

    when('[t0] a guarded run with no override reads it', () => {
      const flags = useThen('the read succeeds', async () =>
        getAllPartitionFlagsOfReviewRun({
          output: asGuardOutput({ stone: '3.blueprint', slug: 'r1' }),
          cwd,
        }),
      );

      then('it reads the @all set, whole', () => {
        expect(flags.partition).toEqual(SET_ALL);
      });

      then('it names the @all command that re-declares the set', () => {
        expect(flags.command).toEqual({
          head: `rhx route.guard.partition --route ${ROUTE} --for review --peer @all`,
          tail: '  --mode apply',
        });
      });
    });

    when('[t1] a guarded run with an override reads it', () => {
      const flags = useThen('the read succeeds', async () =>
        getAllPartitionFlagsOfReviewRun({
          output: asGuardOutput({ stone: '3.blueprint', slug: 'r2' }),
          cwd,
        }),
      );

      then('it reads the override, whole', () => {
        expect(flags.partition).toEqual(SET_OVERRIDE);
      });

      then(
        'it names the override command, scoped to its peer and stone',
        () => {
          expect(flags.command?.head).toEqual(
            `rhx route.guard.partition --route ${ROUTE} --for review --peer r2 --stone 3.blueprint`,
          );
        },
      );
    });

    when('[t2] a run outside a guard reads it', () => {
      then('it reads none — a hand run has no route identity', async () => {
        const flags = await getAllPartitionFlagsOfReviewRun({
          output: '.temp/review.md',
          cwd,
        });
        expect(flags).toEqual({ partition: [], command: null });
      });
    });
  });

  given('[case2] a route with no declaration', () => {
    const cwd = genTempDir({ slug: 'partition-flags-of-run-none' });

    when('[t0] a guarded run reads it', () => {
      then('it reads none', async () => {
        const flags = await getAllPartitionFlagsOfReviewRun({
          output: asGuardOutput({ stone: '3.blueprint', slug: 'r1' }),
          cwd,
        });
        expect(flags).toEqual({ partition: [], command: null });
      });
    });
  });
});
