import { given, then, when } from 'test-fns';

import { formatTreeBucket } from './formatTreeBucket';

describe('formatTreeBucket', () => {
  given('[case1] single line content', () => {
    when('[t0] formatted', () => {
      then('produces tree bucket with one content line', () => {
        const result = formatTreeBucket({
          label: 'stdout',
          content: 'hello world',
        });
        expect(result).toContain('├─ stdout');
        expect(result).toContain('│  │  hello world');
      });
    });
  });

  given('[case2] multi-line content', () => {
    when('[t0] formatted', () => {
      then('produces tree bucket with multiple content lines', () => {
        const result = formatTreeBucket({
          label: 'stderr',
          content: 'line 1\nline 2\nline 3',
        });
        expect(result).toContain('├─ stderr');
        expect(result).toContain('│  │  line 1');
        expect(result).toContain('│  │  line 2');
        expect(result).toContain('│  │  line 3');
      });
    });
  });

  given('[case3] empty content', () => {
    when('[t0] formatted', () => {
      then('produces tree bucket with blank content area', () => {
        const result = formatTreeBucket({
          label: 'stdout',
          content: '',
        });
        expect(result).toContain('├─ stdout');
        expect(result).toContain('│  ├─');
        expect(result).toContain('│  └─');
      });
    });
  });

  given('[case5] 🔴 clamp. content with a blank line inside it', () => {
    when('[t0] formatted', () => {
      then('the blank row is a bare rail, with no pad behind it', () => {
        const result = formatTreeBucket({
          label: 'stderr',
          content: 'line 1\n\nline 2',
        });
        expect(result.split('\n')).toEqual([
          '├─ stderr',
          '│  ├─',
          '│  │',
          '│  │  line 1',
          '│  │',
          '│  │  line 2',
          '│  │',
          '│  └─',
        ]);
      });
    });
  });

  given('[case4] snapshot verification', () => {
    when('[t0] formatted with typical content', () => {
      then('matches snapshot for visual verification', () => {
        const result = formatTreeBucket({
          label: 'stdout',
          content: 'API keys loaded\nReview complete\nNo blockers found',
        });
        expect(result).toMatchSnapshot();
      });
    });
  });
});
