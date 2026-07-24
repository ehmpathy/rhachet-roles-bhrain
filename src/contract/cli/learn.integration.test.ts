import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getDomainTermsPaths } from '@src/domain.operations/learn/getDomainTermsPaths';

/**
 * .what = the repo root, where jest runs; used to locate the real skill wrapper
 * .why = the wrapper is invoked by absolute path so it can run from a tempdir cwd
 *        (fs isolation) while node still resolves the package via the symlinked
 *        node_modules (rule.require.blackbox-via-selflink)
 */
const REPO_ROOT = process.cwd();
const WRAPPER = path.join(
  REPO_ROOT,
  'src/domain.roles/learner/skills/learn.domain.terms.sh',
);

/**
 * .what = the shape execSync throws on a non-zero child exit
 * .why = node's child_process has no precise type for a piped-stdio ExecException;
 *        declare the minimal contract this test depends on
 */
const isExecFailure = (
  error: unknown,
): error is { status: number; stdout: string; stderr: string } => {
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  return typeof error.status === 'number';
};

/**
 * .what = run the real skill wrapper from a given cwd with given args
 * .why = exercises the whole conformant path end-to-end (wrapper + node -e import
 *        + ts cli), the same way the onStop hook / clone invoke it
 * .note = execSync throws only on non-zero exit — allowlist that shape, rethrow
 *         all else (ENOENT, module-not-found) so infra faults are not fail-hidden
 */
const runSkill = (input: {
  cwd: string;
  args: string;
}): { exitCode: number; stdout: string; stderr: string } => {
  try {
    const stdout = execSync(`bash ${WRAPPER} ${input.args}`, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (error) {
    // a non-zero child exit is the expected shape (hook exit 2) — unpack it.
    // any other throw is an infra fault (bash absent, wrapper path wrong,
    // module not found); rethrow with a hint that names the fix (test failloud)
    if (!isExecFailure(error))
      throw new Error(
        `learn skill wrapper did not run — verify bash is installed and the wrapper exists at ${WRAPPER}. cause: ${String(error)}`,
      );
    return {
      exitCode: error.status,
      stdout: error.stdout,
      stderr: error.stderr,
    };
  }
};

describe('learnDomainTerms (integration)', () => {
  const paths = getDomainTermsPaths();

  given('[case1] the clone face — reflect-and-distill', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-clone',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] the skill runs with no --when', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({ cwd: tempDir, args: '' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it findserts the glossary scaffold on disk', async () => {
        // the readme is a symlink back to the learner briefs; in a bare tempDir the
        // install-managed target is absent, so assert the LINK (readlink), not its
        // content — the resolved content is proven by the boot-reachability test
        const target = await fs.readlink(
          path.join(tempDir, paths.readmeSymlink.at),
        );
        expect(target).toEqual(paths.readmeSymlink.to);
      });

      then('it guides the reflection + names the progress sentinel', () => {
        expect(result.stdout).toContain('tend the terms');
        expect(result.stdout).toContain(paths.progressPath);
        // the clone face renders the SAME shared how + canon body the onStop nudge
        // does (emitDistillMoves) — assert its markers so a future divergence between
        // the two faces fails loud (rule.require.single-source-of-truth-for-render)
        expect(result.stdout).toContain('do this now');
        expect(result.stdout).toContain('term=<x>._.choice.reason.md');
        expect(result.stdout).toContain('the canon');
      });

      then('the guide output matches snapshot (aesthetic review)', () => {
        // the guide is user-faced cli output; snapshot it so reviewers can
        // vibecheck the tree render (rule.require.snapshots) — paired with the
        // toContain assertions above for functional verification. the output is
        // deterministic: only static strings + repo-relative constant paths
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] the skill runs again (scaffold already present)', () => {
      const result = useThen('it exits 0 on the no-op run', () => {
        // the clone face has a SECOND stdout variant a user sees on any
        // re-invocation: the scaffold section is SILENT (every piece already
        // converged, so there is no news to report). run twice here so this case
        // is self-contained, then snap the silent variant too
        // (rule.require.contract-snapshot-exhaustiveness)
        runSkill({ cwd: tempDir, args: '' });
        const out = runSkill({ cwd: tempDir, args: '' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it stays silent about the scaffold (no news on a no-op)', () => {
        // an unchanged scaffold is not a change, so the guide reports no scaffold
        // line at all — neither a 'written' block nor an 'already present' note
        expect(result.stdout).not.toContain('scaffold written');
        expect(result.stdout).not.toContain('scaffold already present');
      });

      then(
        'it still guides the reflection (the distillation is the point)',
        () => {
          // the scaffold status may go quiet, but the reflect-and-distill guide is
          // the reason the clone face exists — it always shows
          expect(result.stdout).toContain('tend the terms');
          expect(result.stdout).toContain('do this now');
        },
      );

      then('the no-op guide output matches snapshot (aesthetic review)', () => {
        // the silent variant is a distinct user-faced output; snapshot it so a
        // reviewer can vibecheck the quiet scaffold section + catch drift
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] the onStop hook face — a stale distillation', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-stale',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] the hook runs with no sentinel yet', () => {
      const result = useThen('it exits 2 (holds the stop)', () => {
        const out = runSkill({ cwd: tempDir, args: '--when hook.onStop' });
        expect(out.exitCode).toEqual(2);
        return out;
      });

      then('it emits the gentle owl nudge to stderr', () => {
        expect(result.stderr).toContain('time again, to tend the terms');
        // the nudge is self-sufficient: it carries the ask, the full reflect-and-
        // distill steps (incl. the choice.* cluster shape), the booted canon, and
        // that the moment to act is now — no second command needed to grok it
        expect(result.stderr).toContain('the ask');
        expect(result.stderr).toContain('do this now');
        expect(result.stderr).toContain('conform-or-dispute');
        expect(result.stderr).toContain('pave the path');
        expect(result.stderr).toContain('term=<x>._.choice.reason.md');
        expect(result.stderr).toContain('the time to capture is now');
      });

      then('the nudge output matches snapshot (aesthetic review)', () => {
        // the nudge is user-faced cli output; snapshot it so reviewers can
        // vibecheck the tree render (rule.require.snapshots) — paired with the
        // toContain assertions above. deterministic: static strings + the
        // repo-relative constant sentinel path
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] the onStop hook face — a fresh distillation', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-fresh',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] the sentinel was written moments ago', () => {
      const result = useThen('it exits 0 (lets the session rest)', async () => {
        // write a fresh, ARTICULATED sentinel at the exact hook-keyed path — recent
        // mtime alone is not enough; the content must clear the articulation floor
        const sentinel = path.join(tempDir, paths.progressPath);
        await fs.mkdir(path.dirname(sentinel), { recursive: true });
        await fs.writeFile(
          sentinel,
          '## round\n\nno new terms this round — all names decomposed to sanctioned verbs.',
          'utf-8',
        );

        const out = runSkill({ cwd: tempDir, args: '--when hook.onStop' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it stays silent (no nudge)', () => {
        expect(result.stderr).toEqual('');
      });

      then('the silent-run stderr matches snapshot (aesthetic review)', () => {
        // the fresh-run variant (empty stderr, exit 0) is a distinct user-visible
        // outcome; snapshot it so a stray future stderr write is caught as drift
        // (rule.require.contract-snapshot-exhaustiveness)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] the hook face — an invalid --when value', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-bad-when',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when carries an unsupported value', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          const out = runSkill({ cwd: tempDir, args: '--when hook.onBoot' });
          // a bad --when must NOT silently fall through to the clone face — it is a
          // caller-constraint, so it exits 2 (rule.require.exit-code-semantics), not
          // the wrapper's exit-1 malfunction backstop and never 0 (the guide)
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the invalid value + the supported one', () => {
        expect(result.stderr).toContain('invalid --when');
        expect(result.stderr).toContain('hook.onStop');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // the invalid-input error is a friction point; snapshot it so reviewers
        // can vibecheck the message + catch drift (rule.require.snapshots)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case5] the --help flag', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-help',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] the skill runs with --help', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({ cwd: tempDir, args: '--help' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints usage for both faces', () => {
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('--when hook.onStop');
        expect(result.stdout).toContain('clone');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        // safe-by-default: --help must never mutate the repo
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the help output matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] the hook face — --when with no value at all', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-when-absent',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when is the last arg, its value absent', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          // a --when at the end with no value must NOT fall through to the clone
          // face — an absent value is a caller-constraint, same as a wrong value
          // (rule.require.exit-code-semantics, rule.forbid.failhide)
          const out = runSkill({ cwd: tempDir, args: '--when' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the absent value + the supported one', () => {
        expect(result.stderr).toContain('invalid --when');
        expect(result.stderr).toContain('(absent)');
        expect(result.stderr).toContain('hook.onStop');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // parity with case4: the absent-value error is a friction point too —
        // snapshot it so reviewers vibecheck the '(absent)' phrase + catch drift
        // (rule.require.snapshots). deterministic: the message names the fix, no path
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case7] an unrecognized flag (a typo)', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-unknown-flag',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] a typo flag is passed', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          // an unknown flag (here a --when typo) must NOT silently fall through to
          // the clone face, which writes the scaffold — a surprise to the caller who
          // meant the hook face. it is a caller-constraint, exit 2
          // (rule.forbid.friction-hazards, rule.require.exit-code-semantics)
          const out = runSkill({ cwd: tempDir, args: '--wen hook.onStop' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the unexpected token(s) + the supported surface', () => {
        // --wen is a typo (unknown flag) and, since it is NOT --when, the trailing
        // hook.onStop is a stray positional — both are named; the skill takes neither
        expect(result.stderr).toContain('unexpected arg(s)');
        expect(result.stderr).toContain('--wen');
        expect(result.stderr).toContain('--when hook.onStop');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // the unknown-flag error is a friction point; snapshot it so reviewers
        // vibecheck the message + catch drift (rule.require.snapshots)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case8] the combined --when=value form', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-when-combined',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when=hook.onStop is passed (equals form)', () => {
      const result = useThen('it selects the hook face', () => {
        // the equals form is a conventional node/posix flag shape; it must parse
        // the same as `--when hook.onStop` (rule.forbid.friction-hazards). no
        // sentinel here, so the hook face reads stale → exit 2, never the clone face
        const out = runSkill({ cwd: tempDir, args: '--when=hook.onStop' });
        expect(out.exitCode).toEqual(2);
        return out;
      });

      then('it runs the hook face (stale nudge), not the clone face', () => {
        expect(result.stderr).toContain('time again, to tend the terms');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });
    });
  });

  given('[case9] the posix -- end-of-options marker', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-endopts',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] a bare -- is passed', () => {
      const result = useThen('it is accepted as a no-op', () => {
        // `--` is the posix end-of-options marker; the skill has no positional
        // args, so it is a harmless no-op that must NOT read as an unknown flag.
        // the clone face runs normally → exit 0 (rule.forbid.friction-hazards)
        const out = runSkill({ cwd: tempDir, args: '--' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('the clone face runs (the marker did not block it)', () => {
        expect(result.stdout).toContain('tend the terms');
      });
    });
  });

  given('[case10] the combined --when= form with an empty value', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-when-empty',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when= carries an empty value', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          const out = runSkill({ cwd: tempDir, args: '--when=' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the empty value legibly, not a blank', () => {
        // an empty value must read '(empty)', never a blank before the period
        expect(result.stderr).toContain('invalid --when: (empty)');
        expect(result.stderr).toContain('hook.onStop');
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // the empty-value error is a friction point; snapshot it so reviewers
        // vibecheck the message + catch drift (rule.require.snapshots)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case11] a --when value that starts with a dash', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-when-dashvalue',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when -x is passed (value looks like a flag)', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          const out = runSkill({ cwd: tempDir, args: '--when -x' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it reads -x as the --when value, not an unknown flag', () => {
        // the token after --when is its value; the error must name the invalid
        // --when value, not a generic unknown-flag message
        expect(result.stderr).toContain('invalid --when: -x');
        expect(result.stderr).not.toContain('unknown flag');
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // the dash-value error is a friction point; snapshot it so reviewers
        // vibecheck the message + catch drift (rule.require.snapshots)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case12] the combined --when= form with an invalid value', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-when-combined-invalid',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --when=hook.onBoot is passed (equals form, bad value)', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          // the equals form must route its value through the same validation as
          // the space form; an invalid value fails loud, never writes the scaffold
          const out = runSkill({ cwd: tempDir, args: '--when=hook.onBoot' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the invalid combined-form value', () => {
        expect(result.stderr).toContain('invalid --when: hook.onBoot');
        expect(result.stderr).toContain('hook.onStop');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        // the invalid combined-form error is a friction point; snapshot it so
        // reviewers vibecheck the message + catch drift (rule.require.snapshots)
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case13] a stray bare positional arg', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-positional',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] a bare token (no dash prefix) is passed', () => {
      const result = useThen(
        'it fails loud with the constraint code (2)',
        () => {
          // this skill has ZERO positional args; a stray token must fail loud, never
          // silently fall through to the clone face that writes (safe-by-default).
          // the eval-mode slice must KEEP the token so this guard can reject it —
          // the exact drop-bug the shared getInvocationArgs primitive fixed
          const out = runSkill({ cwd: tempDir, args: 'foo' });
          expect(out.exitCode).toEqual(2);
          return out;
        },
      );

      then('it names the unexpected arg', () => {
        expect(result.stderr).toContain('unexpected arg(s): foo');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });

      then('the error output matches snapshot (aesthetic review)', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case14] the combined --help= form', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-help-combined',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] --help=x is passed (equals form)', () => {
      const result = useThen('it shows help and exits 0', () => {
        // the combined --help=x form must still short-circuit to help, never fall
        // through to the clone face that writes (rule.require.help-on-demand)
        const out = runSkill({ cwd: tempDir, args: '--help=x' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints the help, not the guide', () => {
        // 'usage:' is unique to the help output — the clone guide never prints it
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('faces:');
      });

      then('it did NOT run the clone face (no scaffold written)', async () => {
        const readmeAbsent = await fs
          .access(path.join(tempDir, paths.readmePath))
          .then(() => false)
          .catch(() => true);
        expect(readmeAbsent).toEqual(true);
      });
    });
  });

  given(
    '[case15] the rhachet-injected identity flags (real hook shape)',
    () => {
      // the REAL runtime path: `rhx learn.domain.terms --when hook.onStop` hands the wrapper
      // argv with the harness-injected --skill/--role/--repo flags PREPENDED. the earlier
      // cases invoke the wrapper directly (no harness), so they never exercised this shape —
      // the exact blind spot that let a strict-allowlist regression ship. these cases pin it
      const tempDir = genTempDir({
        slug: 'test-learn-domain-terms-injected-hook',
        git: true,
        symlink: [{ at: 'node_modules', to: 'node_modules' }],
      });

      when('[t0] the hook face runs with the injected flags', () => {
        const result = useThen('it holds the stop (stale), exit 2', () => {
          // no sentinel yet → stale → the hook face must run + exit 2, NOT reject the
          // harness's own --skill/--role/--repo flags as unexpected args
          const out = runSkill({
            cwd: tempDir,
            args: '--skill learn.domain.terms --role learner --repo bhrain --when hook.onStop',
          });
          expect(out.exitCode).toEqual(2);
          return out;
        });

        then('it runs the hook face (stale nudge), not an arg error', () => {
          expect(result.stderr).toContain('time again, to tend the terms');
          expect(result.stderr).not.toContain('unexpected arg(s)');
        });
      });
    },
  );

  given('[case16] the injected identity flags on the clone face', () => {
    const tempDir = genTempDir({
      slug: 'test-learn-domain-terms-injected-clone',
      git: true,
      symlink: [{ at: 'node_modules', to: 'node_modules' }],
    });

    when('[t0] the clone face runs with the injected flags (no --when)', () => {
      const result = useThen('it prints the guide, exit 0', () => {
        // the harness injects --skill/--role/--repo even for the clone invocation;
        // they must pass through so the guide runs, not trip the strict allowlist
        const out = runSkill({
          cwd: tempDir,
          args: '--skill learn.domain.terms --role learner --repo bhrain',
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it runs the clone guide, not an arg error', () => {
        expect(result.stdout).toContain('tend the terms');
        expect(result.stderr).not.toContain('unexpected arg(s)');
      });
    });
  });

  given(
    '[case17] the hook face — a fresh mtime but NO real articulation (a bare touch)',
    () => {
      // the content-shape guard: a recent mtime is NOT enough. a bare `touch` (an empty
      // sentinel) must NOT silence the nudge — the wish's one hard requirement is that
      // the learner articulates what it distilled + why. this pins that a present-but-
      // empty sentinel still holds the stop, so the guarantee is not bypassable
      const tempDir = genTempDir({
        slug: 'test-learn-domain-terms-touch-bypass',
        git: true,
        symlink: [{ at: 'node_modules', to: 'node_modules' }],
      });

      when(
        '[t0] the sentinel exists but is empty (touched, not articulated)',
        () => {
          const result = useThen(
            'it holds the stop (stale), exit 2',
            async () => {
              // write an EMPTY sentinel with a fresh mtime — the mtime-only check would
              // read this as fresh; the content-shape guard must catch it as stale
              const sentinel = path.join(tempDir, paths.progressPath);
              await fs.mkdir(path.dirname(sentinel), { recursive: true });
              await fs.writeFile(sentinel, '', 'utf-8');

              const out = runSkill({
                cwd: tempDir,
                args: '--when hook.onStop',
              });
              expect(out.exitCode).toEqual(2);
              return out;
            },
          );

          then(
            'it still emits the nudge (the touch did not silence it)',
            () => {
              expect(result.stderr).toContain('time again, to tend the terms');
            },
          );
        },
      );
    },
  );
});
