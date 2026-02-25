import { given, then, when } from 'test-fns';

import { formatLetsReflect } from './formatLetsReflect';

describe('formatLetsReflect', () => {
  given('[case1] standard self-review', () => {
    when('[t0] formatLetsReflect called', () => {
      then('output matches snapshot (vibecheck)', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
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
        expect(output).toContain('after you finish 🪷');
        expect(output).toContain('tea first. then, we proceed 🍵');
      });

      then('contains guide content', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
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

      then('contains promise command', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
        });

        expect(output).toContain('promise its done? if so, run');
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as promised --that all-done',
        );
      });
    });
  });

  given('[case2] invalidated self-review', () => {
    when('[t0] formatLetsReflect called with invalidated=true', () => {
      then('shows invalidated status', () => {
        const output = formatLetsReflect({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'review guide content',
          },
          index: 1,
          total: 1,
          invalidated: true,
        });

        expect(output).toContain('status = invalidated (source hash changed)');
      });
    });
  });
});
