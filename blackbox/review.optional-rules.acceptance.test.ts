import * as fs from 'fs';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';
import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';

import { asRedactedOutput } from './.test/asRedactedOutput';
import { asReviewMetricsExpectedBlock } from './.test/invokeReviewBySkill';
import {
  execAsync,
  genTempDirForRhachet,
  invokeReviewSkill,
} from './.test/invokeReviewSkill';
import { invokeShellCommand } from './.test/invokeShellCommand';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = repeatable config for the one case that invokes a real brain review
 * .why = the no-op case (case7) runs a full LLM review, so its outcome is probabilistic;
 *        when.repeatably retries per rule.require.repeatable-for-llm-tests. the skip/error
 *        cases (1-6) return before any brain.ask() and stay deterministic.
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

/**
 * .what = masks the volatile parts of review output so a snapshot stays stable
 * .why = the shared stabilizer masks the log dir and the tempDir; this suite's skip output
 *        also prints the review path, so it adds that one mask on top rather than hold a
 *        second copy of the shared two (rule.require.contract-snapshot-exhaustiveness)
 */
const asRedactedOutputWithReviewPath = (raw: string): string =>
  asRedactedOutput(raw).replace(/(├─ review: ).*/g, '$1<REVIEW_PATH>');

/**
 * .what = acceptance tests for `--optional rules`
 * .why = when a repo has no local rules, an empty rules glob under `--optional rules` must
 *        skip gracefully (0 blockers / 0 nitpicks, exit 0) so the guard tallies approved and
 *        the stone proceeds — instead of the BadRequestError that forced a human overrule
 *        (issue #325). unsupported/absent supply names must still fail loud.
 *
 * .note = the skip returns before any brain.choice.ask(), so these cases invoke no LLM and
 *         are deterministic — no when.repeatably needed.
 */
describe('review.optional-rules.acceptance', () => {
  given('[case1] rules glob matches zero files, with --optional rules', () => {
    when('[t0] review skill invoked', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-rules-skip',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-optional-rules.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          rules: 'rules/DOES_NOT_EXIST/*.md',
          paths: 'src/clean.ts',
          optional: 'rules',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        return {
          cli,
          outputPath,
          review: fs.readFileSync(outputPath, 'utf-8'),
        };
      });

      then('cli exits 0 (skip is not an error)', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout announces a distinct skip', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('🌙 skipped');
        expect(output.toLowerCase()).toContain('no rules found');
      });

      then('stdout carries the 0/0 counts the guard tallies as approved', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('0 blockers');
        expect(output).toContain('0 nitpicks');
      });

      then('the --output review file is written with the skip verdict', () => {
        expect(res.review).toContain('🌙 skipped');
        expect(res.review).toContain('0 blockers');
        expect(res.review).toContain('0 nitpicks');
      });

      then('the skip output matches its snapshot (format regression guard)', () => {
        // the review file holds exactly the skip report (header + body), so it is the
        // cleanest artifact to snap (rule.require.contract-snapshot-exhaustiveness)
        expect(asRedactedOutputWithReviewPath(res.review)).toMatchSnapshot();
      });

      then('the skip stdout matches its snapshot (the caller-visible tree)', () => {
        // the file above is the report; stdout is the tree a caller reads. both are
        // contract surfaces, so both are pinned (rule.require.contract-snapshot-exhaustiveness)
        expect(asRedactedOutputWithReviewPath(res.cli.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] rules glob matches zero files, WITHOUT --optional', () => {
    when('[t0] review skill invoked (strict default)', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-rules-strict',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-strict.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          rules: 'rules/DOES_NOT_EXIST/*.md',
          paths: 'src/clean.ts',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails loud (exit 2) — strict default unchanged', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr explains the ineffective rules glob', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output.toLowerCase()).toContain('rules glob');
      });

      then('the strict-error output matches its snapshot', () => {
        expect(asRedactedOutputWithReviewPath(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case3] --optional refs (deferred, not yet supported)', () => {
    when('[t0] review skill invoked', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-refs-rejected',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-optional-refs.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          rules: 'rules/rule.verify-refs-included.md',
          paths: 'src/clean.ts',
          optional: 'refs',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails loud (exit 2)', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the unsupported supply', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('does not support');
        expect(output).toContain('refs');
      });

      then('the unsupported-refs error output matches its snapshot', () => {
        expect(asRedactedOutputWithReviewPath(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case4] --optional with an unknown supply name', () => {
    when('[t0] review skill invoked', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-unknown-rejected',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-optional-unknown.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          rules: 'rules/rule.verify-refs-included.md',
          paths: 'src/clean.ts',
          optional: 'foo',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli fails loud (exit 2)', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the unsupported supply', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('does not support');
        expect(output).toContain('foo');
      });

      then('the unknown-supply error output matches its snapshot', () => {
        expect(asRedactedOutputWithReviewPath(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case5] a bare --optional with no supply value', () => {
    when('[t0] review skill invoked (next token is another flag)', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-bare-rejected',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-optional-bare.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        // .why = invokeReviewSkill maps each supply to `--optional "<supply>"`, so it cannot
        //        emit a bare `--optional`. build the raw command directly to prove the
        //        empty-value fail-loud path (Q7) end-to-end. `--optional` is immediately
        //        followed by `--rules`, so the parser records `optional = []` and review()
        //        must exit 2 rather than silently disable strictness.
        const skillPath = path.join(
          tempDir,
          '.agent/repo=bhrain/role=reviewer/skills/review.sh',
        );
        const cmd = [
          `bash "${skillPath}"`,
          '--optional',
          `--rules "rules/rule.verify-refs-included.md"`,
          `--paths "src/clean.ts"`,
          `--output "${outputPath}"`,
          '--focus push',
          '--goal representative',
          `--brain "${DEFAULT_TEST_BRAIN_VIA_CLI}"`,
        ].join(' ');

        // the shared exec wrapper allowlists non-zero exits and rethrows aught else
        const cli = await invokeShellCommand({
          cmd,
          cwd: tempDir,
          env: { ...process.env },
        });

        return { cli };
      });

      then('cli fails loud (exit 2) — never silently disables strictness', () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr demands a supply name', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain('requires a supply name');
      });

      then('the bare-optional error output matches its snapshot', () => {
        expect(asRedactedOutputWithReviewPath(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  given('[case6] skip with an --output that sits outside the cwd', () => {
    when('[t0] review skill invoked', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-outside-output',
          clone: ASSETS_DIR,
        });
        // .why = an --output outside the cwd makes its cwd-relative path start with `..`;
        //        the skip must then display the ABSOLUTE path (not a `../../..` crawl),
        //        matching the normal path's display rule. a sibling of tempDir is outside it.
        //        tempDir is absolute, so path.join collapses `..` into an absolute path.
        const outputPath = path.join(
          tempDir,
          '..',
          'review-optional-outside.md',
        );

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          rules: 'rules/DOES_NOT_EXIST/*.md',
          paths: 'src/clean.ts',
          optional: 'rules',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        return { cli, outputPath };
      });

      then('cli exits 0 (skip is not an error)', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout displays the absolute output path, never a `..` crawl', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).toContain(`review: ${res.outputPath}`);
        expect(output).not.toContain('review: ..');
      });

      then('the skip review file is written at that absolute path', () => {
        // .why = the guard consumes the --output artifact, not only stdout; the skip must
        //        write a clean 0/0 skip review to that outside-cwd absolute location too
        const contents = fs.readFileSync(res.outputPath, 'utf-8');
        expect(contents).toContain('🌙 skipped');
        expect(contents).toContain('0 blockers');
        expect(contents).toContain('0 nitpicks');
      });

      then('the skip stdout matches its snapshot (the caller-visible tree)', () => {
        // the absolute path is per-run, so it is masked; the line it sits on, and every
        // other byte of the tree, are pinned
        expect(
          asRedactedOutputWithReviewPath(res.cli.stdout).replace(
            res.outputPath,
            '<OUTPUT_PATH>',
          ),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case7] --optional rules set, but the rules glob DOES match files', () => {
    // .why = the vision's edgecase table promises the flag is a NO-OP when the glob is
    //        effective: "--optional rules but rules glob does match files → normal review".
    //        this guards against a regression where --optional short-circuits a real review.
    //        this case runs a full brain review, so it is probabilistic → when.repeatably.
    when.repeatably(REPEATABLE_CONFIG)('[t0] review skill invoked', () => {
      const res = useThen('invoke review skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-optional-rules-noop',
          clone: ASSETS_DIR,
        });
        const outputPath = path.join(tempDir, 'review-optional-noop.md');

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkill({
          // an effective rules glob (matches a real fixture rule) paired with --optional rules
          rules: 'rules/rule.require.arrow-only.md',
          paths: 'src/clean.ts',
          optional: 'rules',
          output: outputPath,
          focus: 'push',
          goal: 'representative',
          brain: DEFAULT_TEST_BRAIN_VIA_CLI,
          cwd: tempDir,
        });

        const review = fs.readFileSync(outputPath, 'utf-8');
        return { cli, review };
      });

      then('cli exits 0 (normal review succeeds)', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('the review did NOT skip — no 🌙 skipped header anywhere', () => {
        const output = res.cli.stdout + res.cli.stderr;
        expect(output).not.toContain('🌙 skipped');
        expect(res.review).not.toContain('🌙 skipped');
      });

      then('a real review ran — output carries the rules count, not a skip body', () => {
        // the skip body reads "no rules matched the --optional rules glob"; a real review
        // must never emit it. the normal stdout reports the enumerated rules instead.
        expect(res.review).not.toContain('review skipped');
        expect(res.cli.stdout).toContain('rules');
      });

      then('the metrics.expected block matches its snapshot (computed before the brain)', () => {
        // the scope tree and estimate are deterministic; the verdict summary is the brain's
        expect(asReviewMetricsExpectedBlock({ stdout: res.cli.stdout })).toMatchSnapshot();
      });
    });
  });
});
