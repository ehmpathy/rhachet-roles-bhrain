import { given, then, when } from 'test-fns';

import { RouteBouncerCache } from './RouteBouncerCache';
import { RouteBouncerProtection } from './RouteBouncerProtection';

describe('RouteBouncerCache', () => {
  given('[case1] an empty cache', () => {
    when('[t0] instantiated', () => {
      then('it should create the cache', () => {
        const cache = new RouteBouncerCache({
          protections: [],
        });
        expect(cache.protections).toEqual([]);
      });
    });
  });

  given('[case2] a cache with protections', () => {
    when('[t0] instantiated with protections', () => {
      then('it should hydrate nested protections', () => {
        const cache = new RouteBouncerCache({
          protections: [
            {
              glob: 'src/**/*.ts',
              stone: '3.blueprint',
              guard: '.behavior/my-route/3.blueprint.guard',
              route: '.behavior/my-route',
              passed: false,
            },
            {
              glob: 'src/**/*.tsx',
              stone: '3.blueprint',
              guard: '.behavior/my-route/3.blueprint.guard',
              route: '.behavior/my-route',
              passed: false,
            },
          ],
        });
        expect(cache.protections).toHaveLength(2);
        expect(cache.protections[0]).toBeInstanceOf(RouteBouncerProtection);
        expect(cache.protections[1]).toBeInstanceOf(RouteBouncerProtection);
        expect(cache.protections[0]!.glob).toEqual('src/**/*.ts');
        expect(cache.protections[1]!.glob).toEqual('src/**/*.tsx');
      });
    });
  });

  given('[case3] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON', () => {
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
        const json = JSON.stringify(cache);
        const parsed = JSON.parse(json);
        expect(parsed.protections).toHaveLength(1);
        expect(parsed.protections[0].glob).toEqual('src/**/*.ts');
        expect(parsed.protections[0].passed).toEqual(true);
      });
    });
  });
});
