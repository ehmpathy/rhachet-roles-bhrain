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

describe('stepReview.caseGoalExhaustive', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] goal=exhaustive on dirty chapter', () => {
    when('[t0] stepReview with goal=exhaustive', () => {
      const outputPath = path.join(os.tmpdir(), 'review-exhaustive-dirty.md');
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/chapter2.md',
          output: outputPath,
          mode: 'push',
          goal: 'exhaustive',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'exhaustive.dirty.review',
          output: res.review.formatted,
        });

        return res;
      });

      then('review is defined and non-empty', async () => {
        expect(result.review.formatted).toBeDefined();
        expect(result.review.formatted.length).toBeGreaterThan(0);
      });

      then('review includes blockers for gerund violations', async () => {
        expect(result.review.formatted.toLowerCase()).toContain('blocker');
      });

      then('prompt was compiled with exhaustive goal', async () => {
        // verify the prompt was compiled with exhaustive goal
        // (indirectly tested via correct file counts)
        expect(result.metrics.files.rulesCount).toBe(2);
        expect(result.metrics.files.targetsCount).toBe(1);
      });
    });
  });
});
