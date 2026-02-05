import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneDriveArtifacts } from '@src/domain.objects/Driver/RouteStoneDriveArtifacts';

import { computeNextStones } from './computeNextStones';

describe('computeNextStones', () => {
  given('[case1] simple linear route with no progress', () => {
    const stones = [
      new RouteStone({
        name: '1.vision',
        path: '/r/1.vision.stone',
        guard: null,
      }),
      new RouteStone({
        name: '2.criteria',
        path: '/r/2.criteria.stone',
        guard: null,
      }),
      new RouteStone({ name: '3.plan', path: '/r/3.plan.stone', guard: null }),
    ];
    const artifacts = [
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/1.vision.stone' },
        outputs: [],
        passage: null,
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/2.criteria.stone' },
        outputs: [],
        passage: null,
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/3.plan.stone' },
        outputs: [],
        passage: null,
      }),
    ];

    when('[t0] @next-one is requested', () => {
      then('returns first stone', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-one',
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toEqual('1.vision');
      });
    });

    when('[t1] @next-all is requested', () => {
      then('returns first stone (only one at prefix 1)', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-all',
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toEqual('1.vision');
      });
    });
  });

  given('[case2] parallel route with no progress', () => {
    const stones = [
      new RouteStone({
        name: '2.criteria',
        path: '/r/2.criteria.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.domain',
        path: '/r/3.1.research.domain.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.template',
        path: '/r/3.1.research.template.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.prior',
        path: '/r/3.1.research.prior.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.2.plan',
        path: '/r/3.2.plan.stone',
        guard: null,
      }),
    ];
    const artifacts = stones.map(
      (s) =>
        new RouteStoneDriveArtifacts({
          stone: { path: s.path },
          outputs: [],
          passage: null,
        }),
    );

    when('[t0] @next-one is requested', () => {
      then('returns 2.criteria', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-one',
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toEqual('2.criteria');
      });
    });
  });

  given('[case3] parallel route with 2.criteria passed', () => {
    const stones = [
      new RouteStone({
        name: '2.criteria',
        path: '/r/2.criteria.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.domain',
        path: '/r/3.1.research.domain.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.template',
        path: '/r/3.1.research.template.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.1.research.prior',
        path: '/r/3.1.research.prior.stone',
        guard: null,
      }),
      new RouteStone({
        name: '3.2.plan',
        path: '/r/3.2.plan.stone',
        guard: null,
      }),
    ];
    const artifacts = [
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/2.criteria.stone' },
        outputs: [],
        passage: '/r/.route/2.criteria.passed',
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/3.1.research.domain.stone' },
        outputs: [],
        passage: null,
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/3.1.research.template.stone' },
        outputs: [],
        passage: null,
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/3.1.research.prior.stone' },
        outputs: [],
        passage: null,
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/3.2.plan.stone' },
        outputs: [],
        passage: null,
      }),
    ];

    when('[t0] @next-all is requested', () => {
      then('returns all 3.1.x stones', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-all',
        });
        expect(result).toHaveLength(3);
        expect(result.map((s) => s.name).sort()).toEqual([
          '3.1.research.domain',
          '3.1.research.prior',
          '3.1.research.template',
        ]);
      });
    });

    when('[t1] @next-one is requested', () => {
      then('returns first 3.1.x stone', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-one',
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toEqual('3.1.research.domain');
      });
    });
  });

  given('[case4] unguarded stones with output artifacts', () => {
    const stones = [
      new RouteStone({
        name: '1.vision',
        path: '/r/1.vision.src',
        guard: null,
      }),
      new RouteStone({
        name: '2.criteria',
        path: '/r/2.criteria.src',
        guard: null,
      }),
      new RouteStone({
        name: '3.plan',
        path: '/r/3.plan.src',
        guard: null,
      }),
    ];

    when('[t0] first stone has outputs and auto:unguarded passage', () => {
      const artifacts = [
        new RouteStoneDriveArtifacts({
          stone: { path: '/r/1.vision.src' },
          outputs: ['1.vision.md'],
          passage: 'auto:unguarded',
        }),
        new RouteStoneDriveArtifacts({
          stone: { path: '/r/2.criteria.src' },
          outputs: [],
          passage: null,
        }),
        new RouteStoneDriveArtifacts({
          stone: { path: '/r/3.plan.src' },
          outputs: [],
          passage: null,
        }),
      ];

      then('@next-one skips the completed stone', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-one',
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.name).toEqual('2.criteria');
      });
    });

    when(
      '[t1] first two stones have outputs and auto:unguarded passage',
      () => {
        const artifacts = [
          new RouteStoneDriveArtifacts({
            stone: { path: '/r/1.vision.src' },
            outputs: ['1.vision.md'],
            passage: 'auto:unguarded',
          }),
          new RouteStoneDriveArtifacts({
            stone: { path: '/r/2.criteria.src' },
            outputs: ['2.criteria.md'],
            passage: 'auto:unguarded',
          }),
          new RouteStoneDriveArtifacts({
            stone: { path: '/r/3.plan.src' },
            outputs: [],
            passage: null,
          }),
        ];

        then('@next-one returns third stone', () => {
          const result = computeNextStones({
            stones,
            artifacts,
            query: '@next-one',
          });
          expect(result).toHaveLength(1);
          expect(result[0]?.name).toEqual('3.plan');
        });
      },
    );
  });

  given('[case5] all stones passed', () => {
    const stones = [
      new RouteStone({
        name: '1.vision',
        path: '/r/1.vision.stone',
        guard: null,
      }),
      new RouteStone({
        name: '2.criteria',
        path: '/r/2.criteria.stone',
        guard: null,
      }),
    ];
    const artifacts = [
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/1.vision.stone' },
        outputs: [],
        passage: '/r/.route/1.vision.passed',
      }),
      new RouteStoneDriveArtifacts({
        stone: { path: '/r/2.criteria.stone' },
        outputs: [],
        passage: '/r/.route/2.criteria.passed',
      }),
    ];

    when('[t0] @next-one is requested', () => {
      then('returns empty array', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-one',
        });
        expect(result).toHaveLength(0);
      });
    });

    when('[t1] @next-all is requested', () => {
      then('returns empty array', () => {
        const result = computeNextStones({
          stones,
          artifacts,
          query: '@next-all',
        });
        expect(result).toHaveLength(0);
      });
    });
  });
});
