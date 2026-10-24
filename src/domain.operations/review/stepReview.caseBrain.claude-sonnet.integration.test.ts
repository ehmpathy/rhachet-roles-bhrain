import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { genTestBrainContext } from '@src/.test/genTestBrainContext';
import { BRAIN_CALL_TEST_TIMEOUT_MS } from '@src/.test/infra/brainCallTestTimeout';
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

/**
 * .what = the skeleton of a review's first section, with the brain's words masked
 * .why = the brain's prose varies per run; the shape `formatReviewOutput` wraps it in does not.
 *        a header, a rule line, a locations list, and a fenced snippet are what a caller parses
 * .note = parsed by the formatter's own seams (`\n\n` between parts, the snippet last), never
 *         line by line, so a bullet or a fence inside the brain's prose cannot leak into it
 */
const asSkeletonOfReview = (input: { formatted: string }): string => {
  // the first section, and its head (all before the snippet)
  const section = input.formatted.split('\n\n---\n\n')[0]!;
  const head = section.slice(0, section.lastIndexOf('\n\n**snippet**:\n'));
  const parts = head.split('\n\n');
  const [header = '', rule = '', third = ''] = parts;

  // each part the formatter writes, with the brain's words in it masked
  const kind = header.match(/^# (blocker|nitpick)\.\d+: /)?.[1] ?? '<absent>';
  const hasLocations = third.startsWith('**locations**:\n- ');
  const description = parts
    .slice(hasLocations ? 3 : 2)
    .join('\n\n')
    .trim();
  return [
    `# ${kind}.<n>: <title>`,
    rule.startsWith('**rule**: ') ? '**rule**: <rule>' : '<absent rule>',
    ...(hasLocations ? ['**locations**:\n- <location>'] : []),
    description ? '<description>' : '<absent description>',
    section.includes('\n\n**snippet**:\n```')
      ? '**snippet**:\n```<lang>\n<code>\n```'
      : '<absent snippet>',
  ].join('\n\n');
};

/**
 * .what = the key tree of a value, each leaf masked as its type
 * .why = the metrics figures vary per run; the keys a caller reads do not
 */
const asShapeOfValue = (input: { value: unknown }): unknown => {
  if (input.value === null) return 'null';
  if (Array.isArray(input.value)) return 'array';
  if (typeof input.value !== 'object') return typeof input.value;
  return Object.fromEntries(
    Object.entries(input.value).map(([key, value]) => [
      key,
      asShapeOfValue({ value }),
    ]),
  );
};

/**
 * .what = the review contract, exercised on one premium model
 * .why = the cheap default brain covers the contract on every run; this suite proves a
 *        premium model also returns a verdict the guard can read
 * .note = to run it alone:
 *         rhx git.repo.test --what integration --scope 'path://stepReview.caseBrain.claude-sonnet' --mode apply
 */
describe('stepReview.caseBrain.claude-sonnet', () => {
  // bound brain invocations at the shared real-brain test bound
  jest.setTimeout(BRAIN_CALL_TEST_TIMEOUT_MS);

  const scene = useBeforeAll(async () => ({
    brain: await genTestBrainContext({ brain: 'anthropic/claude/sonnet' }),
  }));

  given('[case1] prose-author example with anthropic/claude/sonnet', () => {
    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] stepReview on clean chapter',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-claude-sonnet-clean.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/*.md',
              paths: 'chapters/chapter2.fixed.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

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
          expect(result.review.formatted.toLowerCase()).not.toContain(
            'blocker',
          );
        });

        then(
          'the clean review is the formatter render: complete, or nitpicks alone',
          async () => {
            // .note = no issues renders a fixed text, pinned whole; a run that found only
            //         nitpicks renders sections, whose skeleton must lead with a nitpick
            const formatted = result.review.formatted;
            if (formatted.startsWith('# review complete'))
              return expect(formatted).toEqual(
                '# review complete\n\nno issues found.\n',
              );
            expect(asSkeletonOfReview({ formatted })).toMatch(
              /^# nitpick\.<n>: <title>\n\n\*\*rule\*\*: <rule>\n\n(\*\*locations\*\*:\n- <location>\n\n)?<description>\n\n\*\*snippet\*\*:\n```<lang>\n<code>\n```$/,
            );
          },
        );

        then('metrics.files shows correct counts', async () => {
          expect(result.metrics.files.rulesCount).toBe(2);
          expect(result.metrics.files.targetsCount).toBe(1);
        });

        then('metrics.expected contains token estimates', async () => {
          expect(result.metrics.expected.tokens.estimate).toBeGreaterThan(0);
        });

        then('the metrics shape matches the snapshot', async () => {
          // .note = each figure varies per run, so each leaf is masked as its type. the snapshot
          //         is inline: a file snapshot keys on the test name, which carries the retry's
          //         attempt number, so a retry on ci would meet a key never written
          expect({
            files: asShapeOfValue({ value: result.metrics.files }),
            expected: asShapeOfValue({ value: result.metrics.expected }),
          }).toMatchInlineSnapshot(`
            {
              "expected": {
                "cost": {
                  "estimate": "string",
                },
                "tokens": {
                  "contextWindowPercent": "number",
                  "estimate": "number",
                },
              },
              "files": {
                "conversationCount": "number",
                "refsCount": "number",
                "rulesCount": "number",
                "targetsCount": "number",
              },
            }
          `);
        });
      },
    );

    when.repeatably(REPEATABLY_CONFIG)(
      '[t1] stepReview on dirty chapter',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-claude-sonnet-dirty.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/*.md',
              paths: 'chapters/chapter2.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

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

        then('the review skeleton matches the snapshot', async () => {
          // .note = the brain's words are masked; the markup the formatter writes is pinned.
          //         inline, so each retry attempt meets the same snapshot
          expect(
            asSkeletonOfReview({ formatted: result.review.formatted }),
          ).toMatchInlineSnapshot(`
            "# blocker.<n>: <title>

            **rule**: <rule>

            **locations**:
            - <location>

            <description>

            **snippet**:
            \`\`\`<lang>
            <code>
            \`\`\`"
          `);
        });
      },
    );
  });

  given('[case2] multiple chapters with anthropic/claude/sonnet', () => {
    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] stepReview on all chapters',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-claude-sonnet-multi.md',
        );
        afterAll(async () => fs.rm(outputPath, { force: true }));

        // single API call, result shared across assertions
        const result = useThen('stepReview succeeds', async () => {
          const res = await stepReview(
            {
              rules: '.agent/**/briefs/rules/*.md',
              paths: 'chapters/*.md',
              output: outputPath,
              focus: 'push',
              goal: 'representative',
              cwd: ASSETS_PROSE,
            },
            { brain: scene.brain },
          );

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
      },
    );
  });

  given('[case3] subset of rules against subset of paths', () => {
    when.repeatably(REPEATABLY_CONFIG)(
      '[t0] single rule applied to single chapter',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-claude-sonnet-subset.md',
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
      },
    );

    when.repeatably(REPEATABLY_CONFIG)(
      '[t1] single rule applied to multiple chapters',
      () => {
        const outputPath = path.join(
          os.tmpdir(),
          'review-claude-sonnet-subset-multi.md',
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
      },
    );
  });
});
