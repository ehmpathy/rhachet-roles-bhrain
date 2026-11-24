import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

import { answerEveryPeerGiven } from '@src/domain.operations/route/__test_assets__/answerEveryPeerGiven';
import { concedeEveryPeerConcern } from '@src/domain.operations/route/__test_assets__/concedeEveryPeerConcern';
import { setStoneAsConcernAbsorbed } from '@src/domain.operations/route/stones/setStoneAsConcernAbsorbed';

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
    '[case3] a `better` concession is SHED by the judge; an `urgent` one is KEPT (S16)',
    () => {
      // one reviewer raises 1 nitpick; the allowance is 0, so its verdict is `rejected`
      // and the driver owes a stance. the judge tally then decides on the severity of that
      // stance: a `better` concession is hard-capped by the budget and SHED (pass); an
      // `urgent` one ships harm and is KEPT (block). same fixture, two severities. the budget
      // varies only to set the lane's meter: 1 runs it dry in one round, 5 leaves rounds in hand
      const writeFixture = (input: { slug: string; budget: number }) => {
        const tempDir = genTempDir({ slug: input.slug, git: true });
        fs.writeFileSync(
          path.join(tempDir, '1.test.stone'),
          '# stone: do the task\n',
        );
        fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');
        fs.writeFileSync(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: finicky',
            '      run: echo "blockers: 0"; echo "nitpicks: 1"',
            `      budget: ${input.budget}`,
            '      level: 1',
            'judges:',
            '  - echo "passed: true\\nreason: ok"',
            '',
          ].join('\n'),
        );
        return tempDir;
      };
      const concedeUrgent = async (tempDir: string): Promise<void> => {
        await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });
        await setStoneAsConcernAbsorbed({
          stone: '1.test',
          route: tempDir,
          as: 'conceded',
          with: 'finicky',
          about: 'nitpick.1',
          severity: 'urgent',
        });
      };

      when('[t0] the driver concedes the nitpick as `better`', () => {
        const out = useBeforeAll(async () => {
          const tempDir = writeFixture({
            slug: 'judge-tally-better-shed',
            budget: 5,
          });
          driveGuardRound({ tempDir });
          // answer the given (R1), then concede the one nitpick as `better`
          await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });
          await setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: tempDir,
            as: 'conceded',
            with: 'finicky',
            about: 'nitpick.1',
            severity: 'better',
          });
          return {
            // allowance 0 — the lone nitpick fails it UNLESS the judge sheds the `better`
            judge: runJudge({ tempDir, allowNitpicks: 0 }),
          };
        });

        then(
          'the judge PASSES — the `better` concession is shed from the tally',
          () => {
            expect(out.judge.stdout).toContain('passed: true');
            expect(out.judge.exitCode).toEqual(0);
          },
        );
      });

      when('[t1] the driver concedes the SAME nitpick as `urgent`', () => {
        const out = useBeforeAll(async () => {
          const tempDir = writeFixture({
            slug: 'judge-tally-urgent-kept',
            budget: 1,
          });
          driveGuardRound({ tempDir });
          await concedeUrgent(tempDir);
          return {
            judge: runJudge({ tempDir, allowNitpicks: 0 }),
          };
        });

        then('the judge BLOCKS — an `urgent` concession is NOT shed', () => {
          expect(out.judge.stdout).toContain('passed: false');
          expect(out.judge.exitCode).toEqual(2);
        });

        // 🔴 the sharpest driver-visible remedy in the feature — it names the driver's own
        //    lever and the follow-on passage command — pinned WHOLE, never by a `toContain`
        //    fragment alone (r009 i011 blocker.1). a reword or a dropped branch of this block
        //    must fail the clamp, not slip past it
        then(
          'stderr names the driver grant, the budget command, and the passage command — whole-body pinned',
          () => {
            expect(out.judge.stderr).toContain(
              '✋ halted, an urgent concession stands — finicky',
            );
            expect(out.judge.stderr).toContain(
              'rhx route.guard.budget --for review --add 2 --peer finicky --stone 1.test',
            );
            expect(out.judge.stderr).not.toContain('ask your human');
            expect(out.judge.stderr).toMatchSnapshot();
          },
        );
      });

      when(
        '[t2] the SAME urgent concession, on a lane with a round in hand',
        () => {
          const out = useBeforeAll(async () => {
            const tempDir = writeFixture({
              slug: 'judge-tally-urgent-in-hand',
              budget: 5,
            });
            driveGuardRound({ tempDir });
            await concedeUrgent(tempDir);
            return {
              judge: runJudge({ tempDir, allowNitpicks: 0 }),
            };
          });

          then('the judge BLOCKS — an `urgent` concession is NOT shed', () => {
            expect(out.judge.stdout).toContain('passed: false');
            expect(out.judge.exitCode).toEqual(2);
          });

          // the lane has a round in hand (budget 5, one round spent), so the gate would refuse a
          // grant `rounds-remain`: the halt names the fix and the passage command, and offers no
          // grant it cannot land
          then(
            'stderr names the round in hand and the passage command, and offers no grant — whole-body pinned',
            () => {
              expect(out.judge.stderr).toContain(
                '✋ halted, an urgent concession stands — finicky',
              );
              expect(out.judge.stderr).toContain(
                '   ├─ a round is in hand — finicky; a grant opens once it runs dry',
              );
              expect(out.judge.stderr).not.toContain('route.guard.budget');
              expect(out.judge.stderr).not.toContain('ask your human');
              expect(out.judge.stderr).toMatchSnapshot();
            },
          );
        },
      );
    },
  );

  given(
    '[case4] two urgent lanes on unequal budgets, and an urgent lane the guard retired',
    () => {
      // each lane raises 1 nitpick and the driver concedes it `urgent`, so the judge keeps it
      // and halts on the urgent concession. the halt's rows then depend on each lane's meter:
      // a dry lane earns a grant row, a lane with a round in hand earns the in-hand row, and a
      // lane with no meter row (the guard no longer declares it) earns the unread row
      const asGuardLane = (lane: {
        slug: string;
        budget: number;
      }): string[] => [
        `    - slug: ${lane.slug}`,
        '      run: echo "blockers: 0"; echo "nitpicks: 1"',
        `      budget: ${lane.budget}`,
        '      level: 1',
      ];
      const writeGuard = (input: {
        tempDir: string;
        lanes: { slug: string; budget: number }[];
      }): void =>
        fs.writeFileSync(
          path.join(input.tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            ...input.lanes.flatMap(asGuardLane),
            'judges:',
            '  - echo "passed: true\\nreason: ok"',
            '',
          ].join('\n'),
        );
      const writeFixture = (input: {
        slug: string;
        lanes: { slug: string; budget: number }[];
      }): string => {
        const tempDir = genTempDir({ slug: input.slug, git: true });
        fs.writeFileSync(
          path.join(tempDir, '1.test.stone'),
          '# stone: do the task\n',
        );
        fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');
        writeGuard({ tempDir, lanes: input.lanes });
        return tempDir;
      };
      const concedeUrgent = async (input: {
        tempDir: string;
        slugs: string[];
      }): Promise<void> => {
        await answerEveryPeerGiven({ route: input.tempDir, stone: '1.test' });
        for (const slug of input.slugs)
          await setStoneAsConcernAbsorbed({
            stone: '1.test',
            route: input.tempDir,
            as: 'conceded',
            with: slug,
            about: 'nitpick.1',
            severity: 'urgent',
          });
      };

      when('[t0] one urgent lane is dry and one has a round in hand', () => {
        const out = useBeforeAll(async () => {
          const lanes = [
            { slug: 'parched', budget: 1 },
            { slug: 'finicky', budget: 5 },
          ];
          const tempDir = writeFixture({
            slug: 'judge-tally-urgent-mixed',
            lanes,
          });
          driveGuardRound({ tempDir });
          await concedeUrgent({ tempDir, slugs: ['parched', 'finicky'] });
          return { judge: runJudge({ tempDir, allowNitpicks: 0 }) };
        });

        then('the judge BLOCKS on the urgent concessions', () => {
          expect(out.judge.stdout).toContain('passed: false');
          expect(out.judge.exitCode).toEqual(2);
        });

        then(
          'stderr offers the grant for the dry lane only, and names the lane in hand — whole-body pinned',
          () => {
            expect(out.judge.stderr).toContain(
              'rhx route.guard.budget --for review --add 2 --peer parched --stone 1.test',
            );
            expect(out.judge.stderr).not.toContain('--peer finicky');
            expect(out.judge.stderr).toContain(
              '   ├─ a round is in hand — finicky; a grant opens once it runs dry',
            );
            expect(out.judge.stderr).not.toContain('ask your human');
            expect(out.judge.stderr).toMatchSnapshot();
          },
        );
      });

      when(
        '[t1] an urgent lane is retired from the guard after its stance',
        () => {
          const out = useBeforeAll(async () => {
            const tempDir = writeFixture({
              slug: 'judge-tally-urgent-unread',
              lanes: [
                { slug: 'parched', budget: 1 },
                { slug: 'scribe', budget: 1 },
              ],
            });
            driveGuardRound({ tempDir });
            await concedeUrgent({ tempDir, slugs: ['parched', 'scribe'] });
            // the guard drops the lane: its stance stays live, but no meter row reads it
            writeGuard({ tempDir, lanes: [{ slug: 'parched', budget: 1 }] });
            return { judge: runJudge({ tempDir, allowNitpicks: 0 }) };
          });

          then('the judge BLOCKS on the urgent concessions', () => {
            expect(out.judge.stdout).toContain('passed: false');
            expect(out.judge.exitCode).toEqual(2);
          });

          then(
            'stderr names the retired lane unread and offers it no grant — whole-body pinned',
            () => {
              expect(out.judge.stderr).toContain('spend unread — scribe');
              expect(out.judge.stderr).not.toContain('--peer scribe');
              expect(out.judge.stderr).not.toContain('a round is in hand');
              expect(out.judge.stderr).toMatchSnapshot();
            },
          );
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

            // 🔴 `noisy` is rejected (5 nitpicks > 0), so it owes a stance — the entrance
            //    gate would refuse the second round until it is declared. concede it
            //    `urgent` so the concern is KEPT in the tally (an `urgent` concession is not
            //    shed, S16): the driver commits to fix it, and the tally judge below still
            //    counts its 5 and blocks. this is the cross-hash undercount this case pins.
            await concedeEveryPeerConcern({
              route: scene.tempDir,
              stone: '1.test',
              severity: 'urgent',
            });

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
