import { given, then, when } from 'test-fns';

import { genReviewByRubricStreamer } from './genReviewByRubricStreamer';
import type { ReviewVerdict } from './ReviewByResult';

/**
 * .what = a non-tty stream that records every write
 * .why = the streamer's settled blocks are the contract; a pipe shows them with no spinner
 */
const asStreamRecorder = () => {
  const chunks: string[] = [];
  const out = {
    isTTY: false,
    write: (chunk: string) => {
      chunks.push(chunk);
      return true;
    },
  } as unknown as NodeJS.WriteStream;
  return { out, text: () => chunks.join('') };
};

const VERDICT_PASSED: ReviewVerdict = {
  blockers: 0,
  nitpicks: 0,
  outcome: 'passed',
  tallier: 'deterministic',
  talliedBy: null,
};

const VERDICT_REJECTED: ReviewVerdict = {
  blockers: 2,
  nitpicks: 1,
  outcome: 'rejected',
  tallier: 'deterministic',
  talliedBy: null,
};

describe('genReviewByRubricStreamer', () => {
  given('[case1] two rubrics poured at once, the second settles first', () => {
    when('[t0] both run to done', () => {
      const recorder = asStreamRecorder();
      const streamer = genReviewByRubricStreamer({ out: recorder.out });
      streamer.onProgress({
        phase: 'start',
        index: 1,
        total: 2,
        slug: 'alpha',
      });
      streamer.onProgress({ phase: 'start', index: 2, total: 2, slug: 'beta' });
      streamer.onProgress({
        phase: 'done',
        index: 2,
        total: 2,
        slug: 'beta',
        verdict: VERDICT_REJECTED,
        durationMs: 2000,
        outputPath: '.reviews/by=mechanic/rubric=beta.md',
      });
      const textAfterBeta = recorder.text();
      streamer.onProgress({
        phase: 'done',
        index: 1,
        total: 2,
        slug: 'alpha',
        verdict: VERDICT_PASSED,
        durationMs: 1000,
        outputPath: '.reviews/by=mechanic/rubric=alpha.md',
      });
      streamer.done();
      const text = recorder.text();

      then('🔴 the later rubric is held until the earlier one lands', () => {
        expect(textAfterBeta).toEqual('');
      });
      then('both rows land whole, in declared order', () => {
        expect(text.indexOf('alpha')).toBeGreaterThanOrEqual(0);
        expect(text.indexOf('alpha')).toBeLessThan(text.indexOf('beta'));
        expect(text).toContain('rubric=alpha.md');
        expect(text).toContain('rubric=beta.md');
      });
      then('the stream matches the snapshot', () => {
        expect(text).toMatchSnapshot();
      });
    });
  });

  given('[case2] a rubric that never reports done', () => {
    when('[t0] the run ends', () => {
      const recorder = asStreamRecorder();
      const streamer = genReviewByRubricStreamer({ out: recorder.out });
      streamer.onProgress({
        phase: 'start',
        index: 1,
        total: 2,
        slug: 'alpha',
      });
      streamer.onProgress({ phase: 'start', index: 2, total: 2, slug: 'beta' });
      streamer.onProgress({
        phase: 'done',
        index: 2,
        total: 2,
        slug: 'beta',
        verdict: VERDICT_PASSED,
        durationMs: 1000,
        outputPath: '.reviews/by=mechanic/rubric=beta.md',
      });
      streamer.done();

      then('🔴 the held row is released, never lost behind the gap', () => {
        expect(recorder.text()).toContain('rubric=beta.md');
      });
    });
  });
});
