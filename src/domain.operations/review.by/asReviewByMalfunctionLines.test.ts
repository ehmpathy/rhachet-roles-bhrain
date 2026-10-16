import { given, then, when } from 'test-fns';

import { asReviewByMalfunctionLines } from './asReviewByMalfunctionLines';
import type { ReviewByResult, ReviewRubricResult } from './ReviewByResult';

const genRubric = (
  input: Pick<ReviewRubricResult, 'slug' | 'stderr'> & {
    verdict: Partial<ReviewRubricResult['verdict']> &
      Pick<ReviewRubricResult['verdict'], 'outcome'>;
  },
): ReviewRubricResult => ({
  slug: input.slug,
  verdict: {
    blockers: 0,
    nitpicks: 0,
    tallier: null,
    talliedBy: null,
    ...input.verdict,
  },
  outputPath: `.reviews/${input.slug}.md`,
  durationMs: null,
  stdout: '',
  stderr: input.stderr,
});

const genResult = (input: {
  results: ReviewRubricResult[];
}): ReviewByResult => ({
  role: 'mechanic',
  for: null,
  vibe: { mascot: '🦉', artifact: '🔍' },
  results: input.results,
  blockersTotal: input.results.reduce(
    (sum, one) => sum + one.verdict.blockers,
    0,
  ),
  nitpicksTotal: 0,
});

describe('asReviewByMalfunctionLines', () => {
  given('[case1] one rubric found blockers and another malfunctioned', () => {
    const result = genResult({
      results: [
        genRubric({
          slug: 'detect-blockers',
          stderr: '',
          verdict: { outcome: 'rejected', blockers: 2 },
        }),
        genRubric({
          slug: 'faulted',
          stderr: 'ReviewBrainCallError: the reply was cut off\n',
          verdict: { outcome: 'malfunctioned', reason: 'no count detected' },
        }),
      ],
    });

    when('[t0] the lines are rendered', () => {
      const lines = asReviewByMalfunctionLines({ result });

      then('the faulted rubric is named, with its reason and stderr', () => {
        expect(lines).toEqual([
          '💥 MalfunctionError: rubric malfunctioned: faulted',
          '   no count detected',
          'ReviewBrainCallError: the reply was cut off',
        ]);
      });

      then('the rubric that found blockers adds no line', () => {
        expect(lines.join('\n')).not.toContain('detect-blockers');
      });
    });
  });

  given('[case2] no rubric malfunctioned', () => {
    when('[t0] the lines are rendered', () => {
      then('no line is rendered', () => {
        const result = genResult({
          results: [
            genRubric({
              slug: 'clean',
              stderr: '',
              verdict: { outcome: 'passed' },
            }),
          ],
        });
        expect(asReviewByMalfunctionLines({ result })).toEqual([]);
      });
    });
  });

  given('[case3] a malfunction with no reason and an empty stderr', () => {
    when('[t0] the lines are rendered', () => {
      then('only the header line is rendered', () => {
        const result = genResult({
          results: [
            genRubric({
              slug: 'bare',
              stderr: '   ',
              verdict: { outcome: 'malfunctioned' },
            }),
          ],
        });
        expect(asReviewByMalfunctionLines({ result })).toEqual([
          '💥 MalfunctionError: rubric malfunctioned: bare',
        ]);
      });
    });
  });
});
