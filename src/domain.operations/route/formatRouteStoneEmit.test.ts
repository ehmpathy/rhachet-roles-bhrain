import { given, then, when } from 'test-fns';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';

describe('formatRouteStoneEmit', () => {
  given('[case1] challenge:absent action', () => {
    when('[t0] formatRouteStoneEmit called with challenge:absent', () => {
      then('output contains what have you seen header', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '3.1.blueprint',
          action: 'challenge:absent',
          slug: 'design',
          route: '.behavior/v2026_03_08.feature',
          articulationPath:
            '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md',
        });
        expect(output).toContain('🍂 what have you seen?');
      });

      then('output contains articulation path', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '3.1.blueprint',
          action: 'challenge:absent',
          slug: 'design',
          route: '.behavior/v2026_03_08.feature',
          articulationPath:
            '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md',
        });
        expect(output).toContain(
          '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md',
        );
      });

      then('output contains patience friend message', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '3.1.blueprint',
          action: 'challenge:absent',
          slug: 'design',
          route: '.behavior/v2026_03_08.feature',
          articulationPath:
            '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md',
        });
        expect(output).toContain('🗿 patience, friend');
      });

      then('snapshot matches vision', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '3.1.blueprint',
          action: 'challenge:absent',
          slug: 'design',
          route: '.behavior/v2026_03_08.feature',
          articulationPath:
            '.behavior/v2026_03_08.feature/review/self/3.1.blueprint.design.md',
        });
        expect(output).toMatchSnapshot();
      });
    });
  });
});
