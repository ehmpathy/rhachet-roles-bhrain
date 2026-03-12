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
