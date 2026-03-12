import { given, then, when } from 'test-fns';

import { RouteBouncerProtection } from './RouteBouncerProtection';

describe('RouteBouncerProtection', () => {
  given('[case1] a valid protection', () => {
    when('[t0] instantiated', () => {
      then('it should create the protection', () => {
        const protection = new RouteBouncerProtection({
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: false,
        });
        expect(protection.glob).toEqual('src/**/*.ts');
        expect(protection.stone).toEqual('3.blueprint');
        expect(protection.guard).toEqual(
          '.behavior/my-route/3.blueprint.guard',
        );
        expect(protection.route).toEqual('.behavior/my-route');
        expect(protection.passed).toEqual(false);
      });
    });
  });

  given('[case2] a passed protection', () => {
    when('[t0] instantiated with passed=true', () => {
      then('it should reflect passed state', () => {
        const protection = new RouteBouncerProtection({
          glob: 'src/**/*.tsx',
          stone: '2.vision',
          guard: '.behavior/my-route/2.vision.guard',
          route: '.behavior/my-route',
          passed: true,
        });
        expect(protection.passed).toEqual(true);
      });
    });
  });

  given('[case3] serialization', () => {
    when('[t0] JSON serialized', () => {
      then('it should produce valid JSON', () => {
        const protection = new RouteBouncerProtection({
          glob: 'src/**/*.ts',
          stone: '3.blueprint',
          guard: '.behavior/my-route/3.blueprint.guard',
          route: '.behavior/my-route',
          passed: false,
        });
        const json = JSON.stringify(protection);
        const parsed = JSON.parse(json);
        expect(parsed.glob).toEqual('src/**/*.ts');
        expect(parsed.stone).toEqual('3.blueprint');
        expect(parsed.passed).toEqual(false);
      });
    });
  });
});
