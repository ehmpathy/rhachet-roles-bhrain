import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';
import { pathToFileURL } from 'url';
import { getUuid } from 'uuid-fns';

import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

/**
 * .what = clamps that a hand review with `--warmer on` says what became of its warmer
 * .why = a hand review has no lane, so the spawn is correctly skipped; the emit must
 *        still say so. the two were once gated together, and a laneless review printed
 *        no word at all. every warmer unit calls the parts directly, so only this
 *        cli-level case can see the wire between them
 * .note = cwd must be this repo's root: the brain registry is read from `.agent/`
 *         under cwd (rule.forbid.cwd-outside-gitroot), so the fixture is reached by flags
 * .note = one real brain call, ~$0.0009 — the emit sits after a review that succeeded,
 *         so no refusal path reaches it
 * .note = asserts the laneless branch only. a real spawn in CI would leave a detached
 *         spender with no driver; `genReviewWarmer.integration.test.ts [case4]` covers it
 */
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/review'),
).href;
const CLI_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.review())`;

/** one small rules file and one small target: the review must succeed, cheaply */
const SUPPLY_OF_REVIEW = {
  rules:
    '.agent/repo=.this/role=any/briefs/rule.forbid.stdout-on-exit-errors.md.min',
  target: 'src/domain.operations/review/warmer/asReviewWarmerPlan.ts',
} as const;

/** masks the run-to-run bytes of a live stderr, so its snapshot holds */
const asStderrMasked = (input: { text: string }): string =>
  input.text
    .replace(/\.log\/[^\s)]+/g, '<log-path>')
    .replace(/\d{4}-\d{2}-\d{2}T[\d:.-]+Z/g, '<instant>')
    .replace(/pid\d+/g, 'pid<n>')
    .replace(/\$\d+(\.\d+)?/g, '$<n>')
    .replace(/\d[\d,]*(\.\d+)?/g, '<n>');

/**
 * .what = the `🔭 metrics.expected` block of a live stdout, masked
 * .why = that block is computed before the brain is called, so it is the deterministic
 *        part of the stdout a driver reads; the verdict below it is not. the target is a
 *        live repo file, so its figures are masked as the stderr's are
 * .note = an absent block yields '' so the snapshot fails loud
 */
const asStdoutMetricsExpectedMasked = (input: { text: string }): string =>
  asStderrMasked({
    text:
      input.text
        // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
        .replace(/\x1b\[[0-9;]*m/g, '')
        .split(/\n\s*\n/)
        .find((block) => /^\s*🔭 metrics\.expected/.test(block))
        ?.trim() ?? '',
  });

const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

describe('reviewWarmerSilence.acceptance', () => {
  given('[case1] a hand review with --warmer on', () => {
    // a path outside the guard grammar, so `asReviewRunIdentity` answers null;
    // uuid'd so parallel runs cannot collide
    const output = path.join(
      '.log',
      'test',
      'warmer-silence',
      `${getUuid()}.output.md`,
    );

    afterAll(() => {
      const at = path.join(REPO_ROOT, output);
      if (fs.existsSync(at)) fs.rmSync(at);
    });

    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the driver reads the warmer aside',
      () => {
        // the live review runs inside the repeatable block, so each attempt re-rolls it
        const ran = useThen('the hand review runs', async () => {
          const result = spawnSync(
            'node',
            [
              '-e',
              CLI_COMMAND,
              '--',
              '--rules',
              SUPPLY_OF_REVIEW.rules,
              '--paths-with',
              SUPPLY_OF_REVIEW.target,
              '--output',
              output,
              '--brain',
              DEFAULT_TEST_BRAIN_VIA_CLI,
              '--warmer',
              'on',
            ],
            {
              cwd: REPO_ROOT,
              encoding: 'utf-8',
              stdio: ['ignore', 'pipe', 'pipe'],
            },
          );
          return {
            stdout: result.stdout ?? '',
            stderr: result.stderr ?? '',
            exitCode: result.status ?? 1,
          };
        });

        then('the review itself succeeded, so the emit was reachable', () => {
          // a failed review would satisfy every silence assertion below for the
          // wrong reason (rule.forbid.failhide)
          expect(ran.exitCode).toEqual(0);
          expect(ran.stdout).toContain('blockers');
        });

        then('it is NOT silent about the warmer', () => {
          expect(ran.stderr).toContain('warmer:');
        });

        then('and it says the warmer did not spend', () => {
          expect(ran.stderr).toContain('warmer: none');
        });

        then('and it names why — no lane identity', () => {
          expect(ran.stderr).toContain('no lane identity');
        });

        then(
          'and the reason names the absence, never a fact about the guard',
          () => {
            // a guard-driven `review.by` is laneless too, so "no guard drove" would be
            // false there
            expect(ran.stderr).not.toContain('no guard drove');
          },
        );

        then('it spawned no warmer', () => {
          expect(ran.stderr).not.toContain('pid:');
          expect(ran.stderr).not.toContain('warmer: awake');
        });

        then('and the whole stderr renders, diffable in the PR', () => {
          // the whole stderr, masked — never a filtered cut
          // (rule.require.contract-snapshot-exhaustiveness)
          expect(asStderrMasked({ text: ran.stderr })).toMatchSnapshot();
        });

        then('the warmer renders not one line on the parsed stream', () => {
          // the guard parses stdout for its verdict (contract.reviewer-output), so a
          // stray line there blocks a stone. keyed on the render label, since the
          // fixture path itself carries the word `warmer`
          expect(ran.stdout).not.toContain('warmer:');
          expect(ran.stdout).not.toContain('🦉 warmer');
        });

        then('and the verdict the guard reads is still there', () => {
          expect(ran.stdout).toContain('blockers');
          expect(ran.stdout).toContain('nitpicks');
        });

        then('and the deterministic stdout renders, diffable in the PR', () => {
          // the pre-brain block, masked — the verdict that follows is the brain's
          // (rule.require.contract-snapshot-exhaustiveness)
          const block = asStdoutMetricsExpectedMasked({ text: ran.stdout });
          expect(block).toContain('metrics.expected');
          expect(block).toMatchSnapshot();
        });
      },
    );
  });

  given('[case2] a hand review with the warmer left at its default', () => {
    // default is off: no spawn, and no word about a warmer nobody asked for
    const output = path.join(
      '.log',
      'test',
      'warmer-silence',
      `${getUuid()}.output.md`,
    );

    afterAll(() => {
      const at = path.join(REPO_ROOT, output);
      if (fs.existsSync(at)) fs.rmSync(at);
    });

    when.repeatably(REPEATABLE_CONFIG)('[t0] the review runs', () => {
      const ran = useThen('the hand review runs', async () => {
        const result = spawnSync(
          'node',
          [
            '-e',
            CLI_COMMAND,
            '--',
            '--rules',
            SUPPLY_OF_REVIEW.rules,
            '--paths-with',
            SUPPLY_OF_REVIEW.target,
            '--output',
            output,
            '--brain',
            DEFAULT_TEST_BRAIN_VIA_CLI,
          ],
          {
            cwd: REPO_ROOT,
            encoding: 'utf-8',
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        return {
          stdout: result.stdout ?? '',
          stderr: result.stderr ?? '',
          exitCode: result.status ?? 1,
        };
      });

      then('the review succeeded', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('blockers');
      });

      then('it spawned no warmer', () => {
        expect(ran.stderr).not.toContain('pid:');
        expect(ran.stderr).not.toContain('warmer: awake');
      });

      then('🔴 and it says naught of a warmer — the default is off', () => {
        // under a default of ON, this laneless run would print `warmer: none — no
        // lane identity`, as case1 does. so this line is what tells the two apart
        expect(ran.stderr).not.toContain('warmer:');
      });

      then('and the whole stderr renders, diffable in the PR', () => {
        expect(asStderrMasked({ text: ran.stderr })).toMatchSnapshot();
      });

      then('and the deterministic stdout renders, diffable in the PR', () => {
        const block = asStdoutMetricsExpectedMasked({ text: ran.stdout });
        expect(block).toContain('metrics.expected');
        expect(block).toMatchSnapshot();
      });
    });
  });
});
