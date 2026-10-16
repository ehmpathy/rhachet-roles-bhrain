import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionsReplaced } from './asRouteGuardPartitionsReplaced';
import type { RouteGuardPartitions } from './getOneRouteGuardPartitions';

const DECLARED: RouteGuardPartitions = {
  all: ['review={src/review/**}', 'route={src/route/**}'],
  byPeer: { '3.blueprint/r2': ['solo={src/**}'] },
};

describe('asRouteGuardPartitionsReplaced', () => {
  given('[case1] a new set for @all', () => {
    when('[t0] it replaces the declaration', () => {
      const after = asRouteGuardPartitionsReplaced({
        declared: DECLARED,
        scope: { kind: 'all' },
        partition: ['cli={src/cli/**}'],
      });

      then('the standard set is replaced whole, never merged', () => {
        expect(after.all).toEqual(['cli={src/cli/**}']);
      });

      then('every override is left as it stood', () => {
        expect(after.byPeer).toEqual(DECLARED.byPeer);
      });
    });
  });

  given('[case2] a new set for one reviewer on one stone', () => {
    when('[t0] it replaces the declaration', () => {
      const after = asRouteGuardPartitionsReplaced({
        declared: DECLARED,
        scope: { kind: 'peer', stone: '1.vision', peer: 'r1' },
        partition: ['a={src/a/**}'],
      });

      then('the standard set is left as it stood', () => {
        expect(after.all).toEqual(DECLARED.all);
      });

      then('the override is keyed $stone/$peer, and keys are sorted', () => {
        expect(Object.keys(after.byPeer)).toEqual([
          '1.vision/r1',
          '3.blueprint/r2',
        ]);
        expect(after.byPeer['1.vision/r1']).toEqual(['a={src/a/**}']);
      });
    });
  });

  given(
    '[case3] a new set for a reviewer that already holds an override',
    () => {
      when('[t0] it replaces the declaration', () => {
        const after = asRouteGuardPartitionsReplaced({
          declared: DECLARED,
          scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
          partition: ['b={src/b/**}', 'c={src/c/**}'],
        });

        then(
          'the override is replaced whole, never merged slug by slug',
          () => {
            expect(after.byPeer['3.blueprint/r2']).toEqual([
              'b={src/b/**}',
              'c={src/c/**}',
            ]);
          },
        );
      });
    },
  );

  given('[case4] an empty set — the clear form of a declaration', () => {
    when('[t0] it clears one reviewer override', () => {
      const after = asRouteGuardPartitionsReplaced({
        declared: DECLARED,
        scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
        partition: [],
      });

      then('the override is removed, so its reviewer reads @all', () => {
        expect(after).toEqual({ all: DECLARED.all, byPeer: {} });
      });
    });

    when('[t1] it clears @all', () => {
      const after = asRouteGuardPartitionsReplaced({
        declared: DECLARED,
        scope: { kind: 'all' },
        partition: [],
      });

      then('@all reads as none declared, and overrides stand', () => {
        expect(after).toEqual({ all: null, byPeer: DECLARED.byPeer });
      });
    });
  });
});
