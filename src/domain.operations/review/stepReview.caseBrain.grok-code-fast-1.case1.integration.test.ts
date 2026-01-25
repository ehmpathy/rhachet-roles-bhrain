import * as fs from 'fs/promises';
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

describe('stepReview.caseBrain.grok-code-fast-1.case1', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] prose-author example with xai/grok/code-fast-1', () => {
    when('[t0] stepReview on clean chapter', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-grok-code-fast-1-clean.md',
      );
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.fixed.md',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'grok-code-fast-1.clean.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });

      then('review contains no blockers', async () => {
        expect(result.review.formatted.toLowerCase()).not.toContain('blocker');
      });

      then('metrics.files shows correct counts', async () => {
        expect(result.metrics.files.rulesCount).toBe(2);
        expect(result.metrics.files.targetsCount).toBe(1);
      });

      then('metrics.expected contains token estimates', async () => {
        expect(result.metrics.expected.tokens.estimate).toBeGreaterThan(0);
      });
    });

    when('[t1] stepReview on dirty chapter', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-grok-code-fast-1-dirty.md',
      );
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.md',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'xai/grok/code-fast-1',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'grok-code-fast-1.dirty.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });

      then('review contains blockers for gerund violations', async () => {
        expect(result.review.formatted.toLowerCase()).toContain('blocker');
      });
    });
  });
});
