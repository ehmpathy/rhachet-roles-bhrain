import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTestBrainContext } from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';
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

describe('stepReview.caseBrain.grok-code-fast-1.case3', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(180000);

  const scene = useBeforeAll(async () => ({
    brain: genTestBrainContext({ brain: 'xai/grok/code-fast-1' }),
  }));

  given('[case1] subset of rules against subset of paths', () => {
    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] single rule applied to single chapter',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-grok-code-fast-1-subset.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/rule.no-gerunds.md',
              paths: 'chapters/chapter1.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

          // log output for observability
          logOutputHead({
            label: 'grok-code-fast-1.subset.review',
            output: res.review.formatted,
          });

          return res;
        });

        then('uses only the specified rule', async () => {
          expect(result.metrics.files.rulesCount).toBe(1);
        });

        then('targets only the specified file', async () => {
          expect(result.metrics.files.targetsCount).toBe(1);
        });

        then('review is defined', async () => {
          expect(result.review.formatted).toBeDefined();
        });
      },
    );

    when.repeatably(REPEATABLY_CONFIG)(
      '[t1] single rule applied to multiple chapters',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-grok-code-fast-1-subset-multi.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/rule.no-gerunds.md',
              paths: 'chapters/chapter*.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

          // log output for observability
          logOutputHead({
            label: 'grok-code-fast-1.subset-multi.review',
            output: res.review.formatted,
          });

          return res;
        });

        then('uses only the specified rule', async () => {
          expect(result.metrics.files.rulesCount).toBe(1);
        });

        then('applies rule to all matched paths', async () => {
          expect(result.metrics.files.targetsCount).toBe(3);
        });

        then('review is defined', async () => {
          expect(result.review.formatted).toBeDefined();
        });

        then('review detects violations in dirty chapters', async () => {
          // chapter2.md has gerund violations
          expect(result.review.formatted.toLowerCase()).toContain('blocker');
        });
      },
    );
  });
});
