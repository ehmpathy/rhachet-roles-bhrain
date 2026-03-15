import { given, then, when } from 'test-fns';

import { formatWalkTheWay } from './formatWalkTheWay';

describe('formatWalkTheWay', () => {
  given('[case1] articulation with drum blocks', () => {
    when('[t0] formatWalkTheWay called', () => {
      then('output matches snapshot (vibecheck)', () => {
        const output = formatWalkTheWay({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          index: 1,
        });

        expect(output.join('\n')).toMatchSnapshot();
      });

      then('contains walk the way header', () => {
        const output = formatWalkTheWay({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          index: 1,
        });

        expect(output.join('\n')).toContain('walk the way 🪷');
      });

      then('contains articulate into nested', () => {
        const output = formatWalkTheWay({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          index: 1,
        });

        expect(output.join('\n')).toContain('articulate into');
        expect(output.join('\n')).toContain(
          '.behavior/v2026_03_05.behavior-example/review/self/1.vision.1.all-done.md',
        );
      });

      then('contains for each found issue drum block', () => {
        const output = formatWalkTheWay({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          index: 1,
        });

        expect(output.join('\n')).toContain('for each found issue 🪘');
        expect(output.join('\n')).toContain('articulate how it was fixed');
        expect(output.join('\n')).toContain('so you remember for next time');
      });

      then('contains for each non issue drum block', () => {
        const output = formatWalkTheWay({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          index: 1,
        });

        expect(output.join('\n')).toContain('for each non issue 🪘');
        expect(output.join('\n')).toContain('articulate why it holds');
        expect(output.join('\n')).toContain('so others can learn from it');
      });
    });
  });
});
