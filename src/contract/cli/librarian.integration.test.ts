import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { getStdoutFormDefects } from '@src/domain.operations/cli/stdout/getStdoutFormDefects';

/**
 * .what = the repo root, where jest runs; used to locate the real skill wrappers
 * .why = a wrapper is invoked by absolute path so it can run from a tempdir cwd (fs isolation)
 *        while node still resolves the package via the symlinked node_modules
 *        (rule.require.blackbox-via-selflink)
 */
const REPO_ROOT = process.cwd();
const getWrapperPath = (input: { skill: string }): string =>
  path.join(REPO_ROOT, `src/domain.roles/librarian/skills/${input.skill}.sh`);

/**
 * .what = the shape execSync throws on a non-zero child exit
 */
const isExecFailure = (
  error: unknown,
): error is { status: number; stdout: Buffer; stderr: Buffer } => {
  if (typeof error !== 'object' || error === null) return false;
  if (!('status' in error)) return false;
  return typeof error.status === 'number';
};

/**
 * .what = run a real librarian skill wrapper from a given cwd with given args
 * .why = exercises the whole path end to end (wrapper, node -e import, ts cli), the way a
 *        clone invokes it. a non-zero exit is the expected shape for bad input; any other
 *        throw is an infra fault (bash absent, wrapper absent, module absent) and is rethrown
 */
const runSkill = (input: {
  skill: 'census.minpeer' | 'census.cues' | 'brief.min.moveout';
  cwd: string;
  args: string;
}): { exitCode: number; stdout: string; stderr: string } => {
  try {
    const stdout = execSync(
      `bash ${getWrapperPath({ skill: input.skill })} ${input.args}`,
      { cwd: input.cwd, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    return { exitCode: 0, stdout: stdout.toString(), stderr: '' };
  } catch (error) {
    if (!isExecFailure(error))
      throw new Error(
        `librarian skill wrapper did not run — verify bash is installed, the wrapper exists, and dist is built (npm run build). cause: ${String(error)}`,
      );
    return {
      exitCode: error.status,
      stdout: error.stdout.toString(),
      stderr: error.stderr.toString(),
    };
  }
};

/**
 * .what = a temp dir of briefs, each a `.md` with a `.md.min` beside it, one per outcome
 * .why = one fixture holds every case the three commands tell apart:
 *        - rule.a: a why section the md holds in full, so it moves
 *        - rule.b: a drifted cue line and a why line the md lacks, so lines are absent and the section is held
 *        - rule.c: a min with no md peer
 *        - rule.h: a why section with a cue line, so it is held
 *        - rule.s: a symlinked min, whose source is edited where it lives
 */
const genBriefsFixture = (input: { slug: string }): string => {
  const dir = genTempDir({
    slug: input.slug,
    git: true,
    symlink: [{ at: 'node_modules', to: 'node_modules' }],
  });
  const put = (file: string, lines: string[]): void => {
    fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
    fs.writeFileSync(path.join(dir, file), lines.join('\n'));
  };

  put('briefs/rule.a.md', [
    '# rule.a',
    '- a cue',
    '## .why',
    'the argument one',
    'the argument two',
    '## .the test',
    '> a quote',
  ]);
  put('briefs/rule.a.md.min', [
    '# rule.a',
    '- a cue',
    '## .why',
    'the argument one',
    '## .the test',
    '> a quote',
  ]);

  put('briefs/rule.b.md', ['# rule.b', '- a cue', '## .why', 'the argument']);
  put('briefs/rule.b.md.min', [
    '# rule.b',
    '- a cue',
    '- a drifted cue',
    '## .why',
    'the argument',
    'an added line',
  ]);

  put('briefs/rule.c.md.min', ['# rule.c', '- a lone cue']);

  put('briefs/rule.h.md', ['# rule.h', '## .why', '- a bullet', 'prose']);
  put('briefs/rule.h.md.min', ['# rule.h', '## .why', '- a bullet', 'prose']);

  put('sources/rule.s.md.min', ['# rule.s', '## .why', 'the argument']);
  put('briefs/rule.s.md', ['# rule.s', '## .why', 'the argument']);
  fs.symlinkSync(
    '../sources/rule.s.md.min',
    path.join(dir, 'briefs/rule.s.md.min'),
  );
  return dir;
};

const readFile = (input: { dir: string; file: string }): string =>
  fs.readFileSync(path.join(input.dir, input.file), 'utf-8');

describe('librarian.integration', () => {
  given('[case1] census.minpeer over a set of mins', () => {
    const dir = genBriefsFixture({ slug: 'test-librarian-minpeer' });

    when('[t0] a report runs with --files', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'census.minpeer',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --files",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it counts the absent lines of each min against its md', () => {
        expect(result.stdout).toContain('  0 /   6 absent  rule.a.md.min');
        expect(result.stdout).toContain('  2 /   6 absent  rule.b.md.min');
        expect(result.stdout).toContain('no .md peer     rule.c.md.min');
      });

      then('it holds the treestruct form', () => {
        expect(getStdoutFormDefects({ text: result.stdout })).toEqual([]);
      });

      then('the report matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] a report runs without --files', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'census.minpeer',
          cwd: dir,
          args: "--glob 'briefs/*.md.min'",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints the total alone', () => {
        expect(result.stdout).not.toContain('rule.a.md.min');
        expect(result.stdout).toContain('census.minpeer (5 mins)');
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t2] --emit runs', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'census.minpeer',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --emit",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then(
        'it prints one row per absent line, and one for a min with no peer',
        () => {
          expect(result.stdout.trim().split('\n')).toEqual([
            'briefs/rule.b.md.min\t- a drifted cue',
            'briefs/rule.b.md.min\tan added line',
            'briefs/rule.c.md.min\t<no .md peer>',
          ]);
        },
      );
    });
  });

  given('[case2] census.cues over a set of briefs', () => {
    const dir = genBriefsFixture({ slug: 'test-librarian-cues' });

    when('[t0] a report runs with --files', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'census.cues',
          cwd: dir,
          args: "--glob 'briefs/rule.a.md.min' --glob 'briefs/rule.h.md.min' --files",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it names a row per file and the total share', () => {
        expect(result.stdout).toContain('census.cues (2 files');
        expect(result.stdout).toContain('rule.a.md.min');
        expect(result.stdout).toContain('rule.h.md.min');
        expect(result.stdout).toContain('total: cue ');
      });

      then('it holds the treestruct form', () => {
        expect(getStdoutFormDefects({ text: result.stdout })).toEqual([]);
      });

      then('the report matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] --emit runs', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'census.cues',
          cwd: dir,
          args: "--glob 'briefs/rule.a.md.min' --emit",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints each cue line of the file, tab-separated', () => {
        expect(result.stdout.trim().split('\n')).toEqual([
          'briefs/rule.a.md.min\t# rule.a',
          'briefs/rule.a.md.min\t- a cue',
          'briefs/rule.a.md.min\t## .why',
          'briefs/rule.a.md.min\t## .the test',
          'briefs/rule.a.md.min\t> a quote',
        ]);
      });
    });
  });

  given('[case3] brief.min.moveout over a set of mins', () => {
    const dir = genBriefsFixture({ slug: 'test-librarian-moveout' });
    const mdBefore = readFile({ dir, file: 'briefs/rule.a.md' });
    const minBefore = readFile({ dir, file: 'briefs/rule.a.md.min' });
    const sourceBefore = readFile({ dir, file: 'sources/rule.s.md.min' });

    when('[t0] a plan runs (the default mode)', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'brief.min.moveout',
          cwd: dir,
          args: "--glob 'briefs/*.md.min'",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it lists the section it would move', () => {
        expect(result.stdout).toContain(
          'would move  briefs/rule.a.md.min  ## .why  (2 lines)',
        );
        expect(result.stdout).toContain('would move 1 sections · held 2');
      });

      then('it names why each held section stays', () => {
        expect(result.stdout).toContain(
          'held (1 body line(s) absent from the .md)  briefs/rule.b.md.min  ## .why',
        );
        expect(result.stdout).toContain(
          'held (a cue line)  briefs/rule.h.md.min  ## .why',
        );
      });

      then('it skips the symlinked min and the min with no md peer', () => {
        expect(result.stdout).not.toContain('rule.s.md.min  ##');
        expect(result.stdout).not.toContain('rule.c.md.min  ##');
      });

      then('it writes naught', () => {
        expect(readFile({ dir, file: 'briefs/rule.a.md.min' })).toEqual(
          minBefore,
        );
      });

      then('it holds the treestruct form', () => {
        expect(getStdoutFormDefects({ text: result.stdout })).toEqual([]);
      });

      then('the plan matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] an apply runs', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'brief.min.moveout',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --mode apply",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it reports the section moved', () => {
        expect(result.stdout).toContain(
          'moved  briefs/rule.a.md.min  ## .why  (2 lines)',
        );
        expect(result.stdout).toContain('moved 1 sections · held 2');
      });

      then('it rewrites the min without its why section', () => {
        expect(readFile({ dir, file: 'briefs/rule.a.md.min' })).toEqual(
          ['# rule.a', '- a cue', '## .the test', '> a quote'].join('\n'),
        );
      });

      then('it leaves the md untouched', () => {
        expect(readFile({ dir, file: 'briefs/rule.a.md' })).toEqual(mdBefore);
      });

      then('a held section stays where it sat', () => {
        expect(readFile({ dir, file: 'briefs/rule.h.md.min' })).toContain(
          '## .why',
        );
        expect(readFile({ dir, file: 'briefs/rule.b.md.min' })).toContain(
          'an added line',
        );
      });

      then('the symlinked source is untouched', () => {
        expect(readFile({ dir, file: 'sources/rule.s.md.min' })).toEqual(
          sourceBefore,
        );
      });

      then('the apply matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t2] an apply runs again', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'brief.min.moveout',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --mode apply",
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it moves naught more', () => {
        expect(result.stdout).toContain('moved 0 sections · held 2');
      });
    });
  });

  given('[case4] bad input', () => {
    const dir = genBriefsFixture({ slug: 'test-librarian-bad-input' });

    (
      [
        { skill: 'census.minpeer' },
        { skill: 'census.cues' },
        { skill: 'brief.min.moveout' },
      ] as const
    ).forEach((thisCase) => {
      when(`[t0] ${thisCase.skill} runs with no --glob`, () => {
        const result = useThen('it exits 2', () => {
          const out = runSkill({ skill: thisCase.skill, cwd: dir, args: '' });
          expect(out.exitCode).toEqual(2);
          return out;
        });

        then('it names the constraint, to stderr', () => {
          expect(result.stderr).toContain(
            '✋ ConstraintError: no --glob given',
          );
          expect(result.stdout).toEqual('');
        });

        then('the error matches snapshot (aesthetic review)', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      });

      when(`[t1] ${thisCase.skill} runs with a glob that names no file`, () => {
        const result = useThen('it exits 2', () => {
          const out = runSkill({
            skill: thisCase.skill,
            cwd: dir,
            args: "--glob 'absent/*.md.min'",
          });
          expect(out.exitCode).toEqual(2);
          return out;
        });

        then('it names the glob and the fix, to stderr', () => {
          expect(result.stderr).toContain(
            '✋ ConstraintError: no file matched the --glob set',
          );
          expect(result.stderr).toContain('absent/*.md.min');
          expect(result.stderr).toContain('quote it');
        });

        then('the error matches snapshot (aesthetic review)', () => {
          expect(result.stderr).toMatchSnapshot();
        });
      });
    });

    when('[t2] brief.min.moveout runs with an unknown --mode', () => {
      const result = useThen('it exits 2', () => {
        const out = runSkill({
          skill: 'brief.min.moveout',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --mode yolo",
        });
        expect(out.exitCode).toEqual(2);
        return out;
      });

      then('it names the mode and the choices', () => {
        expect(result.stderr).toContain('unknown --mode: yolo');
        expect(result.stderr).toContain('plan');
      });

      then('it writes naught', () => {
        expect(readFile({ dir, file: 'briefs/rule.a.md.min' })).toContain(
          '## .why',
        );
      });
    });

    when('[t3] census.minpeer runs with a typo flag', () => {
      const result = useThen('it exits 2', () => {
        const out = runSkill({
          skill: 'census.minpeer',
          cwd: dir,
          args: "--glob 'briefs/*.md.min' --emti",
        });
        expect(out.exitCode).toEqual(2);
        return out;
      });

      then('it names the unknown flag and the surface', () => {
        expect(result.stderr).toContain('unknown flag(s): --emti');
        expect(result.stderr).toContain('--glob --files --emit');
      });

      then('the error matches snapshot (aesthetic review)', () => {
        expect(result.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case5] --help', () => {
    const dir = genBriefsFixture({ slug: 'test-librarian-help' });

    when('[t0] brief.min.moveout runs with --help', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({
          skill: 'brief.min.moveout',
          cwd: dir,
          args: '--help',
        });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints usage and reads no file', () => {
        expect(result.stdout).toContain('usage: rhx brief.min.moveout');
        expect(result.stdout).not.toContain('would move');
      });

      then('the help matches snapshot (aesthetic review)', () => {
        expect(result.stdout).toMatchSnapshot();
      });
    });

    when('[t1] census.cues runs with -h', () => {
      const result = useThen('it exits 0', () => {
        const out = runSkill({ skill: 'census.cues', cwd: dir, args: '-h' });
        expect(out.exitCode).toEqual(0);
        return out;
      });

      then('it prints usage', () => {
        expect(result.stdout).toContain('usage: rhx census.cues');
      });
    });
  });

  given(
    '[case6] the rhachet-injected identity flags (real harness shape)',
    () => {
      const dir = genBriefsFixture({ slug: 'test-librarian-injected' });

      when(
        '[t0] census.minpeer runs with --skill, --role, --repo prepended',
        () => {
          const result = useThen('it exits 0', () => {
            const out = runSkill({
              skill: 'census.minpeer',
              cwd: dir,
              args: "--skill census.minpeer --role librarian --repo bhrain --glob 'briefs/*.md.min'",
            });
            expect(out.exitCode).toEqual(0);
            return out;
          });

          then(
            'the harness flags pass through, not an unknown-flag error',
            () => {
              expect(result.stdout).toContain('census.minpeer (5 mins)');
              expect(result.stderr).toEqual('');
            },
          );
        },
      );
    },
  );
});
