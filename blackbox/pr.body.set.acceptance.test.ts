import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

/**
 * .what = acceptance coverage for the `pr.body.set` skill's hermetic paths, through the
 *         entrypoint a human types
 * .why = its help and each refusal are contract surfaces a human meets; each is clamped and
 *        snapped so drift in the text or the exit code is visible in review
 *
 * .note = the set itself edits a live pull request via the gh cli; it runs once per done gate
 *         and is recorded in the route's verification yield. this suite covers the surfaces
 *         that touch no pull request
 *
 * .note = a stated carve-out of rule.forbid.cwd-outside-gitroot: the skill is invoked by
 *         absolute path, so no lookup rides the cwd. the temp cwd isolates the refusals
 */
const SKILL = path.join(
  __dirname,
  '..',
  '.agent/repo=.this/role=any/skills/pr.body.set.sh',
);

const runSkill = (input: {
  cwd: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('bash', [SKILL, ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = the refusals the skill owes before any gh call, one per row
 */
const REFUSALS: { slug: string; args: string[]; stderr: string }[] = [
  {
    slug: 'unknown-arg',
    args: ['--bogus'],
    stderr: "✋ ConstraintError: unknown arg '--bogus'",
  },
  {
    slug: 'pr-without-value',
    args: ['--pr'],
    stderr: '✋ ConstraintError: --pr needs a value',
  },
  {
    slug: 'from-without-value',
    args: ['--pr', '700', '--from'],
    stderr: '✋ ConstraintError: --from needs a value',
  },
  {
    slug: 'pr-not-a-number',
    args: ['--pr', 'main', '--from', 'body.md'],
    stderr:
      '✋ ConstraintError: --pr must be a pull request number, e.g. 700',
  },
  {
    slug: 'from-absent',
    args: ['--pr', '700', '--from', 'absent.md'],
    stderr: '✋ ConstraintError: --from must name a non-empty body file on disk',
  },
];

describe('pr.body.set.acceptance', () => {
  given('[case1] a human who asks the skill to explain itself', () => {
    const ran = useBeforeAll(async () =>
      runSkill({
        cwd: fs.realpathSync(genTempDir({ slug: 'pr-body-set-help' })),
        args: ['--help'],
      }),
    );

    when('[t0] --help is passed', () => {
      then('it exits 0 and names the usage', () => {
        expect(ran.exitCode).toEqual(0);
        expect(ran.stdout).toContain('rhx pr.body.set --pr');
      });

      then('the usage renders whole', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  REFUSALS.map((refusal, index) =>
    given(`[case${index + 2}] a call refused for ${refusal.slug}`, () => {
      const ran = useBeforeAll(async () =>
        runSkill({
          cwd: fs.realpathSync(
            genTempDir({ slug: `pr-body-set-${refusal.slug}` }),
          ),
          args: refusal.args,
        }),
      );

      when('[t0] the skill parses its args', () => {
        then('it exits 2 with the constraint, and writes no stdout', () => {
          expect(ran.exitCode).toEqual(2);
          expect(ran.stderr.trim()).toEqual(refusal.stderr);
          expect(ran.stdout).toEqual('');
        });

        then('the refusal matches its snapshot', () => {
          expect(ran.stderr).toMatchSnapshot();
        });
      });
    }),
  );
});
