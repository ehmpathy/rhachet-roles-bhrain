import { given, then, when } from 'test-fns';

import { genDefaultReviewOutputPath } from './genDefaultReviewOutputPath';

describe('genDefaultReviewOutputPath', () => {
  given('[case1] a git repository', () => {
    when('[t0] genDefaultReviewOutputPath is called', () => {
      const result = genDefaultReviewOutputPath({ cwd: process.cwd() });

      then('path starts with ".review/"', () => {
        expect(result.startsWith('.review/')).toBe(true);
      });

      then('path ends with ".output.md"', () => {
        expect(result.endsWith('.output.md')).toBe(true);
      });

      then('path has three segments', () => {
        // .review/branch/timestamp.output.md
        const segments = result.split('/');
        expect(segments.length).toBe(3);
        expect(segments[0]).toBe('.review');
      });

      then('branch segment is sanitized (no slashes)', () => {
        const segments = result.split('/');
        const branchSegment = segments[1];
        expect(branchSegment).toBeDefined();
        expect(branchSegment).not.toContain('/');
      });

      then('timestamp segment is filesystem-safe (no colons)', () => {
        const segments = result.split('/');
        const filenameSegment = segments[2];
        expect(filenameSegment).toBeDefined();
        expect(filenameSegment).not.toContain(':');
      });

      then('timestamp segment matches ISO format pattern', () => {
        const segments = result.split('/');
        const filenameSegment = segments[2]!;
        // pattern: YYYY-MM-DDTHH-MM-SS-mmmZ.output.md
        const timestampPart = filenameSegment.replace('.output.md', '');
        expect(timestampPart).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/,
        );
      });
    });
  });
});
