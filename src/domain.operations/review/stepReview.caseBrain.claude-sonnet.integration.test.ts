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

describe('stepReview.caseBrain.claude-sonnet', () => {
  // increase timeout for brain invocations (3 minutes)
  jest.setTimeout(180000);

  given('[case1] prose-author example with claude/sonnet', () => {
    when('[t0] stepReview on clean chapter', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-claude-sonnet-clean.md',
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
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'claude-sonnet.clean.review',
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
        'review-claude-sonnet-dirty.md',
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
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'claude-sonnet.dirty.review',
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

  given('[case2] multiple chapters with claude/sonnet', () => {
    when('[t0] stepReview on all chapters', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-claude-sonnet-multi.md',
      );
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/*.md',
          paths: 'chapters/*.md',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'claude-sonnet.multi.review',
          output: res.review.formatted,
        });

        return { result: res, outputPath };
      });

      then('review covers all target files', async () => {
        expect(result.result.metrics.files.targetsCount).toBe(3);
      });

      then('review is written to output path', async () => {
        const content = await fs.readFile(result.outputPath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
      });

      then('review contains blockers for dirty chapters', async () => {
        // chapter2.md has gerund violations, so review should contain blockers
        expect(result.result.review.formatted.toLowerCase()).toContain(
          'blocker',
        );
      });
    });
  });

  given('[case3] subset of rules against subset of paths', () => {
    when('[t0] single rule applied to single chapter', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-claude-sonnet-subset.md',
      );
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/rule.no-gerunds.md',
          paths: 'chapters/chapter1.md',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'claude-sonnet.subset.review',
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
    });

    when('[t1] single rule applied to multiple chapters', () => {
      const outputPath = path.join(
        os.tmpdir(),
        'review-claude-sonnet-subset-multi.md',
      );
      afterAll(async () => fs.rm(outputPath, { force: true }));

      // single API call, result shared across assertions
      const result = useThen('stepReview succeeds', async () => {
        const res = await stepReview({
          rules: '.agent/**/briefs/rules/rule.no-gerunds.md',
          paths: 'chapters/chapter*.md',
          output: outputPath,
          mode: 'push',
          goal: 'representative',
          brain: 'claude/sonnet',
          cwd: ASSETS_PROSE,
        });

        // log output for observability
        logOutputHead({
          label: 'claude-sonnet.subset-multi.review',
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
    });
  });
});
