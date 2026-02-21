import { given, then, when } from 'test-fns';

import { formatCheckYoself } from './formatCheckYoself';

describe('formatCheckYoself', () => {
  given('[case1] a self-review with inline say content', () => {
    when('[t0] formatted', () => {
      then('returns check yo self header', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toContain(`🔍 check yo'self`);
      });

      then('includes review.self index/total', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toContain('review.self 1/2');
      });

      then('includes slug', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toContain('slug = all-done');
      });

      then('includes promise command', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toContain(
          'rhx route.stone.set --stone 1.vision --as promised --that all-done',
        );
      });

      then('includes guide content', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toContain('did you complete all that was requested?');
      });
    });
  });

  given('[case2] a self-review with multiline say content', () => {
    when('[t0] formatted', () => {
      then('includes all lines of guide content', () => {
        const result = formatCheckYoself({
          stone: '2.research',
          reviewSelf: {
            slug: 'tests-pass',
            say: 'do all tests pass?\nhave you run the full test suite?',
          },
          index: 2,
          total: 3,
        });
        expect(result).toContain('do all tests pass?');
        expect(result).toContain('have you run the full test suite?');
      });
    });
  });

  given('[case3] a self-review that was invalidated', () => {
    when('[t0] formatted', () => {
      then('includes invalidated status', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?',
          },
          index: 1,
          total: 2,
          invalidated: true,
        });
        expect(result).toContain('status = invalidated (source hash changed)');
      });
    });
  });

  given('[case4] a self-review output snapshot', () => {
    when('[t0] formatted', () => {
      then('matches expected structure', () => {
        const result = formatCheckYoself({
          stone: '1.vision',
          reviewSelf: {
            slug: 'all-done',
            say: 'did you complete all that was requested?\nhave you verified each requirement?',
          },
          index: 1,
          total: 2,
        });
        expect(result).toMatchSnapshot();
      });
    });
  });
});
