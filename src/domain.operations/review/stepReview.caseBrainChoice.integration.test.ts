import * as fs from 'fs/promises';
import { getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import { logOutputHead } from '@src/.test/logOutputHead';

import { stepReview } from './stepReview';

/**
 * .what = paths to the static test assets
 * .why = enables reuse of test fixtures across test cases
 */
const ASSETS_PROSE = path.join(
  __dirname,
  '.test/assets/example.repo/prose-author',
);

describe('stepReview.caseBrainChoice', () => {
  given('[case1] default brain', () => {
    when('[t0] stepReview called without brain arg', () => {
      const outputPath = path.join(os.tmpdir(), 'review-default-brain.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'brainChoice.default.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] explicit brain xai/grok-code-fast-1', () => {
    when('[t0] stepReview called with brain arg', () => {
      const outputPath = path.join(os.tmpdir(), 'review-xai-brain.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          brain: 'xai/grok-code-fast-1',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'brainChoice.xai.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case3] explicit brain claude/sonnet', () => {
    when('[t0] stepReview called with anthropic brain', () => {
      const outputPath = path.join(os.tmpdir(), 'review-claude-brain.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'brainChoice.claude.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });
    });
  });

  given('[case4] invalid brain ref', () => {
    when('[t0] stepReview called with invalid brain', () => {
      then('throws BadRequestError with available brains', async () => {
        const error = await getError(
          stepReview({
            rules: '.agent/**/briefs/rules/*.md',
            paths: 'chapters/chapter2.fixed.md',
            output: '/tmp/review.md',
            mode: 'push',
            brain: 'invalid/brain/ref',
            cwd: ASSETS_PROSE,
          }),
        );

        expect(error).toBeDefined();
        expect(error.message).toContain('brain not found');
        expect(error.message).toContain('available brains');
      });
    });
  });

  given('[case5] metrics with brain choice', () => {
    when('[t0] stepReview called with brain', () => {
      const outputPath = path.join(os.tmpdir(), 'review-metrics-brain.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'brainChoice.metrics.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('metrics.files shows correct counts', async () => {
        expect(result.metrics.files.rulesCount).toBe(2);
        expect(result.metrics.files.targetsCount).toBe(1);
      });

      then('metrics.expected contains token estimates', async () => {
        expect(result.metrics.expected.tokens.estimate).toBeGreaterThan(0);
      });

      then('metrics.realized contains placeholder values', async () => {
        // todo: expose usage via rhachet BrainAtom and BrainRepl on responses
        // for now, metrics.realized contains placeholder values
        expect(result.metrics.realized.tokens.input).toBe(0);
        expect(result.metrics.realized.tokens.output).toBe(0);
        expect(result.metrics.realized.cost.total).toBe(0);
      });
    });
  });
});
