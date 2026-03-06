import { given, then, when } from 'test-fns';

import { formatPatienceFriend } from './formatPatienceFriend';

describe('formatPatienceFriend', () => {
  given('[case1] challenged review.self', () => {
    when('[t0] formatPatienceFriend called', () => {
      then('output matches snapshot (vibecheck)', () => {
        const output = formatPatienceFriend({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
        });

        expect(output).toMatchSnapshot();
      });

      then('contains stone header', () => {
        const output = formatPatienceFriend({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
        });

        expect(output).toContain('🗿 patience, friend');
      });

      then('contains zen challenge sections', () => {
        const output = formatPatienceFriend({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
        });

        expect(output).toContain('the pond barely rippled');
        expect(output).toContain('be here now 🪷');
        expect(output).toContain('trust the way 🪷');
        expect(output).toContain('the review is the work.');
        expect(output).toContain('you are not the author.');
        expect(output).toContain('you are the reviewer.');
      });

      then('contains articulation section', () => {
        const output = formatPatienceFriend({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
        });

        expect(output).toContain('articulate into');
        expect(output).toContain(
          '.behavior/v2026_03_05.behavior-example/review/self/1.vision.all-done.md',
        );
      });

      then('contains final instruction', () => {
        const output = formatPatienceFriend({
          stone: '1.vision',
          slug: 'all-done',
          route: '.behavior/v2026_03_05.behavior-example',
        });

        expect(output).toContain("when you've truly reflected, run");
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as promised --that all-done',
        );
      });
    });
  });
});
