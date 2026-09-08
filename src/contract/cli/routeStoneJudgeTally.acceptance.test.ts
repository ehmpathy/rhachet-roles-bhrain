import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

/**
 * .what = acceptance clamps on WHICH review files the `reviewed?` judge tallies,
 *         driven through the real cli in a spawned process
 *
 * .why = the guard has two readers of "the reviews" and they disagree on which
 *        HASHES each one reads:
 *
 *        | reader | reach |
 *        |---|---|
 *        | the meter (the tree a human reads) | crosses hashes, keyed by SLUG |
 *        | the judge (the pass/fail tally)    | current hash only, no fallback |
 *
 *        so once a reviewer exhausts, an edit to the artifact moves the hash and
 *        that reviewer's verdict leaves the judge's sight — while the tree still
 *        prints it. the two cases below pin the defect in BOTH directions,
 *        because one wrong read cannot produce both:
 *
 *        - [case1] every reviewer exhausted ⇒ the tally is EMPTY ⇒ a false BLOCK
 *        - [case2] one reviewer exhausted   ⇒ the tally UNDERCOUNTS ⇒ a false PASS
 *
 *        [case2] is the unsafe direction: an edit discharges a verdict no one
 *        ever addressed, which is the same exit this behavior exists to shut.
 *
 * .how = the peer reviewer in a guard is a `run:` SHELL COMMAND, so an `echo` of a
 *        numeric verdict exercises the whole engine with no brain and no credential.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/route'),
).href;
const SET_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.routeStoneSet())`;
const JUDGE_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.routeStoneJudge())`;

/**
 * .what = spawns the real cli with the given args
 * .why = a spawned process is the point — an in-process call would skip the arg
 *        parse and the exit code, and the exit code IS the judge's verdict
 */
const runCli = (input: {
  cwd: string;
  command: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('node', ['-e', input.command, '--', ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test' },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = drives one full guard round against the stone
 * .why = only a real round writes real review artifacts at the real hash; a
 *        hand-placed file would prove the assertion and not the engine
 */
const driveGuardRound = (input: { tempDir: string }) =>
  runCli({
    cwd: input.tempDir,
    command: SET_COMMAND,
    args: ['--stone', '1.test', '--route', input.tempDir, '--as', 'passed'],
  });

/**
 * .what = invokes the `reviewed?` judge exactly as the guard shells out to it
 */
const runJudge = (input: { tempDir: string; allowNitpicks: number }) =>
  runCli({
    cwd: input.tempDir,
    command: JUDGE_COMMAND,
    args: [
      '--mechanism',
      'reviewed?',
      '--stone',
      '1.test',
      '--route',
      input.tempDir,
      '--allow-blockers',
      '0',
      '--allow-nitpicks',
      String(input.allowNitpicks),
    ],
  });

/**
 * .what = the distinct hash segments across every peer given on disk
 * .why = the premise of each case is that the givens STRADDLE two hashes. if they
 *        do not, the case proves naught, so each `when` asserts this first
 */
const getGivenHashes = (input: { tempDir: string }): string[] => {
  const dir = path.join(input.tempDir, '.reviews', 'peer');
  if (!fs.existsSync(dir)) return [];
  return [
    ...new Set(
      fs
        .readdirSync(dir)
        .filter(
          (file) =>
            file.includes('_.given.by_peer.') && !file.endsWith('.report.md'),
        )
        .map((file) => file.match(/\.i\d+\.([a-f0-9]+)\.r\d+\./)?.[1] ?? '')
        .filter((hash) => hash.length > 0),
    ),
  ];
};

describe('routeStoneJudge.tally.acceptance', () => {
  given(
    '[case1] one reviewer, budget 1 — it hands back a clean verdict, then exhausts',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'judge-tally-empty', git: true });

        fs.writeFileSync(
          path.join(tempDir, '1.test.stone'),
          '# stone: do the task\n',
        );
        fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');
        // budget 1 is the whole fixture: the reviewer speaks once, then is spent.
        // its clean verdict is the only verdict the judge will ever have to read
        fs.writeFileSync(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: clean-reviewer',
            '      run: echo "blockers: 0"; echo "nitpicks: 0"',
            '      budget: 1',
            '      level: 1',
            'judges:',
            '  - echo "passed: true\\nreason: ok"',
            '',
          ].join('\n'),
        );

        return { tempDir };
      });

      when(
        '[t0] the artifact is edited after the round, then the judge is asked',
        () => {
          const out = useBeforeAll(async () => {
            driveGuardRound({ tempDir: scene.tempDir });
            const hashesAfterRound = getGivenHashes({
              tempDir: scene.tempDir,
            });

            // move the hash. the reviewer has no budget left, so it can never
            // speak at the new hash — its clean verdict lives only at the old one
            fs.writeFileSync(
              path.join(scene.tempDir, '1.test.md'),
              '# test artifact\n\nedited.\n',
            );

            return {
              hashesAfterRound,
              judge: runJudge({ tempDir: scene.tempDir, allowNitpicks: 0 }),
            };
          });

          then(
            'the premise holds: the round wrote a verdict at one hash',
            () => {
              expect(out.hashesAfterRound).toHaveLength(1);
            },
          );

          then('the judge must not report an absence of review files', () => {
            expect(out.judge.stdout).not.toContain('no review files found');
          });

          then(
            'the judge must pass on the clean verdict it already has',
            () => {
              expect(out.judge.stdout).toContain('passed: true');
              expect(out.judge.exitCode).toEqual(0);
            },
          );

          // `route.stone.judge` is a cli, so its stdout is a caller-visible contract
          // surface and every byte of it is owed a pin — the `toContain`s above fix two
          // substrings and leave the rest free to regress
          // (`rule.require.contract-snapshot-exhaustiveness`).
          then('the whole judge stdout matches its baseline', () => {
            expect(out.judge.stdout).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case2] two reviewers — a noisy one with budget 1, a quiet one with budget 5',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'judge-tally-undercount',
          git: true,
        });

        fs.writeFileSync(
          path.join(tempDir, '1.test.stone'),
          '# stone: do the task\n',
        );
        fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');
        // the two budgets ARE the fixture. `noisy` speaks once and is spent, so
        // its 5 nitpicks are pinned to the first hash forever. `quiet` keeps
        // budget, so it alone speaks at the second hash — and a judge that reads
        // one hash sees only the quiet 0
        fs.writeFileSync(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: noisy',
            '      run: echo "blockers: 0"; echo "nitpicks: 5"',
            '      budget: 1',
            '      level: 1',
            '    - slug: quiet',
            '      run: echo "blockers: 0"; echo "nitpicks: 0"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: true\\nreason: ok"',
            '',
          ].join('\n'),
        );

        return { tempDir };
      });

      when(
        '[t0] the artifact is edited between two rounds, then the judge is asked',
        () => {
          const out = useBeforeAll(async () => {
            driveGuardRound({ tempDir: scene.tempDir });

            fs.writeFileSync(
              path.join(scene.tempDir, '1.test.md'),
              '# test artifact\n\nedited.\n',
            );

            // only `quiet` has budget left, so this second round writes a lone
            // clean verdict at the new hash
            driveGuardRound({ tempDir: scene.tempDir });

            return {
              hashes: getGivenHashes({ tempDir: scene.tempDir }),
              // the threshold sits BETWEEN the two verdicts: 0 passes it, 5 does
              // not. so the judge's answer names exactly which set it tallied
              judge: runJudge({ tempDir: scene.tempDir, allowNitpicks: 3 }),
            };
          });

          then('the premise holds: the givens straddle two hashes', () => {
            expect(out.hashes.length).toBeGreaterThanOrEqual(2);
          });

          then(
            'the judge must count the exhausted reviewer 5 nitpicks and block',
            () => {
              expect(out.judge.stdout).toContain('passed: false');
              expect(out.judge.exitCode).toEqual(2);
            },
          );

          // the same whole-stdout pin, and this is the cell that most needs it: an
          // undercount reads `passed: true` and differs from the correct answer by a
          // single word. `toContain('passed: false')` catches that flip and catches no
          // change to the `reason:` line that names WHICH set was tallied — the whole
          // subject of this suite.
          then('the whole judge stdout matches its baseline', () => {
            expect(out.judge.stdout).toMatchSnapshot();
          });
        },
      );
    },
  );
});
