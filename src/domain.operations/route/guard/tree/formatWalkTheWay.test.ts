import { given, then, when } from 'test-fns';

import { getSelfReviewArticulationPath } from '../review/self/getSelfReviewArticulationPath';
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
          getSelfReviewArticulationPath({
            route: '.behavior/v2026_03_05.behavior-example',
            stone: '1.vision',
            index: 1,
            slug: 'all-done',
          }),
        );
      });

      then(
        'carries the round caution — guard looks exactly here, write exactly this path',
        () => {
          const output = formatWalkTheWay({
            stone: '1.vision',
            slug: 'all-done',
            route: '.behavior/v2026_03_05.behavior-example',
            index: 1,
          });

          expect(output.join('\n')).toContain(
            'the guard looks precisely here, write exactly to this path',
          );
        },
      );

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
