import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { asExecResultOrThrow } from './.test/asExecResultOrThrow';
import { sanitizeTimeForSnapshot } from './.test/invokeRouteSkill';
import { execAsync, genTempDirForRhachet } from './.test/invokeReviewSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/codebase-mechanic');

/**
 * .what = invokes the review skill's shell entrypoint with a raw arg string
 * .why = the two rejections here (an unrecognized flag, a bare --paths-with) are not
 *        part of invokeReviewSkill's typed contract — each is a malformed invocation
 *        by construction, so this bypasses the typed helper to compose one directly
 */
const invokeReviewSkillRaw = async (input: {
  args: string;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );
  const cmd = `bash "${skillPath}" ${input.args}`;
  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    // a nonzero exit is a skill result; any other fault rethrows (rule.forbid.failhide)
    return asExecResultOrThrow({ error });
  }
};

describe('review.failfast-flags.acceptance', () => {
  /**
   * usecase: an unrecognized flag is passed
   */
  given('[case1] an unrecognized flag is passed', () => {
    when('[t0] review skill invoked with a flag it does not know', () => {
      const res = useThen('invoke review skill with an unknown flag', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-unknown',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --bogus-flag`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      // .retired = this case once asserted `unrecognized flag(s): --bogus-flag`. retired on
      //            purpose: the refusal now reads `✋ ConstraintError: 1 unknown flag: …`, the one
      //            counted-noun headline review, review.by, and review._.cost all share (asCountedNoun)
      then('stderr names the unknown flag', async () => {
        expect(res.cli.stderr).toContain('unknown flag: --bogus-flag');
      });

      then('stderr points to --help', async () => {
        expect(res.cli.stderr).toContain('run with --help for the full flag list');
      });

      // .why = stderr is a caller-visible cli contract surface; snapshot it so a
      //        reword ships visible in the pr diff (rule.require.contract-snapshot-exhaustiveness)
      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --paths-with is given with no glob after it
   */
  given('[case2] --paths-with is given with no glob', () => {
    when('[t0] review skill invoked with a bare --paths-with', () => {
      const res = useThen('invoke review skill with a bare --paths-with', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-paths-with',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths-with`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --paths-with requires a glob', async () => {
        expect(res.cli.stderr).toContain('--paths-with requires a glob pattern');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --paths-wout is given with no glob after it
   */
  given('[case3] --paths-wout is given with no glob', () => {
    when('[t0] review skill invoked with a bare --paths-wout', () => {
      const res = useThen('invoke review skill with a bare --paths-wout', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-paths-wout',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths-with "src/**/*.ts" --paths-wout`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --paths-wout requires a glob', async () => {
        expect(res.cli.stderr).toContain('--paths-wout requires a glob pattern');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --polluters is given a mode that is neither drop nor keep
   * .why = a silent fallthrough would hand the caller the scope they asked to keep,
   *        with no signal — unlike every other refusal here, this one would have run
   *        fine and reviewed the wrong corpus
   *        (rule.forbid.failhide, rule.require.exclude-review-scope-polluters)
   */
  given('[case4] --polluters is given an unrecognized mode', () => {
    when('[t0] review skill invoked with --polluters keepp', () => {
      const res = useThen('invoke review skill with a typo mode', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bad-polluters',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --polluters keepp`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names both valid modes', async () => {
        expect(res.cli.stderr).toContain('--polluters must be drop or keep');
      });

      // the value is echoed back, so the caller sees their own typo rather than a
      // restatement of the rule they already read (rule.require.errors-name-the-fix)
      then('stderr echoes the rejected value', async () => {
        expect(res.cli.stderr).toContain('received: keepp');
      });

      // the refusal must happen instead of a review, never beside one
      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --focus, --join, and --goal are given unrecognized modes
   * .why = an unmatched mode must never fall through to its opposite in silence —
   *        `--focus pul` is the sharpest: a "not push" read sends paths only, while
   *        the brain reads only the literal `pull` and reports an empty read as a
   *        review. all three typos ride one call, so the clamp proves one round
   *        names every refusal, not merely the first (rule.forbid.failhide).
   */
  given('[case5] --focus, --join, and --goal are given unrecognized modes', () => {
    when('[t0] review skill invoked with --focus pul --join unoin --goal all', () => {
      const res = useThen('invoke review skill with typo modes', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bad-choices',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --focus pul --join unoin --goal all`,
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the valid modes of each flag, with its typo', async () => {
        expect(res.cli.stderr).toContain(
          '--focus must be push or pull (received: pul)',
        );
        expect(res.cli.stderr).toContain(
          '--join must be intersect or union (received: unoin)',
        );
        expect(res.cli.stderr).toContain(
          '--goal must be exhaustive or representative (received: all)',
        );
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: a flag that expects a value is typed with its value forgotten
   *
   * .why = a bare `--diffs` would otherwise run on the default range while the
   *      driver believes they chose one (rule.forbid.unexpected-defaults). the
   *      generic refusal is pinned here so a reword or a dropped `--help` line
   *      cannot ship unseen
   */
  given('[case6] a flag that expects a value is given none', () => {
    when('[t0] review skill invoked with a bare --diffs', () => {
      const res = useThen('invoke review skill with a bare --diffs', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-valueless',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --diffs`,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the flag, with a count that agrees', async () => {
        expect(res.cli.stderr).toContain('1 flag given with no value: --diffs');
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: a brain slug that no package registers
   * .why = the cli's try must build the brain, so this refusal reaches the human as a
   *        `✋ ConstraintError:` header, never a raw `BadRequestError:` with a stack
   */
  given('[case7] --brain names a slug no package registers', () => {
    when('[t0] review skill invoked with that brain', () => {
      const res = useThen('invoke review skill with the ghost brain', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-brain-ghost',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --brain ghost/model/tier`,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr leads with the qualified constraint header', async () => {
        expect(res.cli.stderr).toContain(
          "✋ ConstraintError: brain 'ghost/model/tier' is not registered",
        );
      });

      then('the raw class never reaches the human', async () => {
        expect(res.cli.stderr).not.toContain('BadRequestError:');
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --refs is given with no glob after it
   * .why = `--refs` is repeatable, so a bare mention lands as an empty list rather
   *        than a valueless flag. a review would then run with no references while
   *        the driver believes some were supplied — a verdict indistinguishable from
   *        refs that matched naught (rule.forbid.failhide)
   */
  given('[case8] --refs is given with no glob', () => {
    when('[t0] review skill invoked with a bare --refs beside a valid scope', () => {
      const res = useThen('invoke review skill with a bare --refs', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-refs',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --refs`,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --refs requires a glob', async () => {
        expect(res.cli.stderr).toContain(
          '✋ ConstraintError: --refs requires a glob pattern',
        );
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
  /**
   * usecase: a flag form the cost cli already reads, or a token no flag reads
   *
   * .why = review and review._.cost share one argv reader (asArgvSpaced), so
   *      `--flag=value` reads the same way in both. a repeated single-value flag,
   *      a stray positional, and an unknown short flag would otherwise be dropped
   *      in silence, and the run would read as though each applied
   */
  given('[case9] a flag form or token the parser must read or refuse', () => {
    when('[t0] --brain=value names a slug no package registers', () => {
      const res = useThen('invoke review skill with --brain=value', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-eq-form',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: '--rules "rules/*.md" --paths "src/dirty.ts" --brain=ghost/model/tier',
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('the value is read, never refused as an unknown flag', async () => {
        expect(res.cli.stderr).not.toContain('unknown flag');
        expect(res.cli.stderr).toContain('is not registered');
      });

      then('the value survives the split whole', async () => {
        expect(res.cli.stderr).toContain("brain 'ghost/model/tier'");
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t1] --focus is given twice', () => {
      const res = useThen('invoke review skill with --focus twice', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-repeated',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: '--rules "rules/*.md" --paths "src/dirty.ts" --focus push --focus pull',
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the repeated flag', async () => {
        expect(res.cli.stderr).toContain('1 flag given more than once: --focus');
      });

      then('the hint names every flag the parser lets repeat', async () => {
        // the hint is read from FLAGS_REPEATABLE; a hand-typed list once dropped --rules
        expect(res.cli.stderr).toContain(
          'only --rules, --refs, --optional, --paths-with, --paths-wout, --partition repeat',
        );
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t2] a stray positional no flag reads', () => {
      const res = useThen('invoke review skill with a stray positional', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-stray',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: '--rules "rules/*.md" --paths "src/dirty.ts" src/dirty.ts',
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the stray argument', async () => {
        expect(res.cli.stderr).toContain('1 argument no flag reads: src/dirty.ts');
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });

    when('[t3] an unknown short flag', () => {
      const res = useThen('invoke review skill with -j', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-short',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: '--rules "rules/*.md" --paths "src/dirty.ts" -j',
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr names the short flag as unknown', async () => {
        expect(res.cli.stderr).toContain('1 unknown flag: -j');
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });

  /**
   * usecase: --partition is given with no declaration
   * .why = `--partition` is repeatable, so a bare mention lands as an empty list. it would
   *        read as "may split" with no partition to split into, and an overflow would then
   *        refuse while the caller believes a split was declared (the --refs twin, [case8])
   */
  given('[case10] --partition is given with no declaration', () => {
    when('[t0] review skill invoked with a bare --partition beside a valid scope', () => {
      const res = useThen('invoke review skill with a bare --partition', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'review-failfast-flags-bare-partition',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role reviewer', {
          cwd: tempDir,
        });

        const cli = await invokeReviewSkillRaw({
          args: `--rules "rules/*.md" --paths "src/dirty.ts" --partition`,
          cwd: tempDir,
        });

        return { cli };
      });

      then('cli exits with a constraint code', async () => {
        expect(res.cli.code).toEqual(2);
      });

      then('stderr states --partition requires a declaration', async () => {
        expect(res.cli.stderr).toContain(
          "--partition requires a declaration, '<slug>=<globs>'",
        );
      });

      then('no review ran', async () => {
        expect(res.cli.stdout).not.toContain('blockers');
      });

      then('the full stderr body is pinned', async () => {
        expect(sanitizeTimeForSnapshot(res.cli.stderr)).toMatchSnapshot();
      });
    });
  });
});
