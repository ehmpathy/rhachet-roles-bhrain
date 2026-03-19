import { given, then, when } from 'test-fns';

import { RouteBouncerCache } from '@src/domain.objects/Driver';

import { getDecisionIsArtifactProtected } from './getDecisionIsArtifactProtected';

describe('getDecisionIsArtifactProtected', () => {
  given('[case1] an empty cache', () => {
    const cache = new RouteBouncerCache({
      protections: [],
    });

    when('[t0] any path is checked', () => {
      then('it should return not blocked', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/feature.ts',
          cache,
        });
        expect(decision.blocked).toBe(false);
        expect(decision.protection).toBeNull();
      });
    });
  });

  given('[case2] a cache with unpassed protection', () => {
    const cache = new RouteBouncerCache({
      protections: [
        {
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: false,
        },
      ],
    });

    when('[t0] a matched path is checked', () => {
      then('it should return blocked with protection', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/feature.ts',
          cache,
        });
        expect(decision.blocked).toBe(true);
        expect(decision.protection?.glob).toBe('src/**/*.ts');
        expect(decision.protection?.stone).toBe('3.blueprint');
      });
    });

    when('[t1] an unmatched path is checked', () => {
      then('it should return not blocked', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'tests/feature.test.ts',
          cache,
        });
        expect(decision.blocked).toBe(false);
        expect(decision.protection).toBeNull();
      });
    });
  });

  given('[case3] a cache with passed protection', () => {
    const cache = new RouteBouncerCache({
      protections: [
        {
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: true,
        },
      ],
    });

    when('[t0] a matched path is checked', () => {
      then('it should return not blocked (stone passed)', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/feature.ts',
          cache,
        });
        expect(decision.blocked).toBe(false);
        expect(decision.protection).toBeNull();
      });
    });
  });

  given('[case4] multiple protections (some passed, some not)', () => {
    const cache = new RouteBouncerCache({
      protections: [
        {
          glob: 'src/**/*.ts',
          stone: '2.research',
          guard: '.behavior/my-route/2.research.guard',
          route: '.behavior/my-route',
          passed: true,
        },
        {
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: false,
        },
      ],
    });

    when('[t0] a matched path is checked', () => {
      then('it should return blocked (unpassed protection exists)', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/feature.ts',
          cache,
        });
        expect(decision.blocked).toBe(true);
        expect(decision.protection?.stone).toBe('3.blueprint');
      });
    });
  });

  given('[case5] glob edge cases', () => {
    const cache = new RouteBouncerCache({
      protections: [
        {
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: false,
        },
      ],
    });

    when('[t0] deep nested path is checked', () => {
      then('it should match recursive glob', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/deep/nested/feature.ts',
          cache,
        });
        expect(decision.blocked).toBe(true);
      });
    });

    when('[t1] wrong extension is checked', () => {
      then('it should not match', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/feature.tsx',
          cache,
        });
        expect(decision.blocked).toBe(false);
      });
    });

    when('[t2] exact file path is checked', () => {
      then('it should match', () => {
        const decision = getDecisionIsArtifactProtected({
          path: 'src/index.ts',
          cache,
        });
        expect(decision.blocked).toBe(true);
      });
    });
  });
});
