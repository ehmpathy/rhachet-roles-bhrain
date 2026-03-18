import { given, then, when } from 'test-fns';

import { formatLetsReflect } from './formatLetsReflect';
import { getSelfReviewArticulationPath } from './getSelfReviewArticulationPath';

describe('formatLetsReflect', () => {
  given('[case1] standard review.self', () => {
    when('[t0] formatLetsReflect called', () => {
      then('output matches snapshot (vibecheck)', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested in this stone?\nhave you re-read the stone goal and verified each requirement?',
          },
          index: 1,
          total: 2,
        });

        expect(output).toMatchSnapshot();
      });

      then('contains warm frame sections', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
        });

        expect(output).toContain('🌕 lets reflect');
        expect(output).toContain('stillness 🪷');
        expect(output).toContain('before you begin 🪷');
        expect(output).toContain('be here now 🪷');
        expect(output).toContain('tea first. then, we proceed 🍵');
      });

      then('contains guide content', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
        });

        expect(output).toContain("here's the guide");
        expect(output).toContain('review guide content');
      });

      then('contains walk the way section', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
        });

        expect(output).toContain('walk the way 🪷');
        expect(output).toContain('articulate into');
        expect(output).toContain(
          getSelfReviewArticulationPath({
            route: '.behavior/v2026_03_05.behavior-example',
            stone: '1.vision',
            index: 1,
            slug: 'all-done',
          }),
        );
        expect(output).toContain('for each found issue 🪘');
        expect(output).toContain('for each non issue 🪘');
      });

      then('contains final instruction', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
        });

        expect(output).toContain("when you've truly reflected, run");
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as promised --that all-done',
        );
      });
    });
  });
});
