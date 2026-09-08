import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

import { answerEveryPeerGiven } from '../../domain.operations/route/__test_assets__/answerEveryPeerGiven';
import { asStableGuardEmit } from '../../domain.operations/route/__test_assets__/asStableGuardEmit';
import { countReviewerRuns } from '../../domain.operations/route/__test_assets__/countReviewerRuns';

/**
 * .what = acceptance tests for the entrance gate, driven through the real
 *         `route.stone.set` cli contract in a spawned process
 * .why = every other clamp on this behavior calls the operation directly. that proves
 *        the OPERATION; it never proves the COMMAND — the arg parse, the exit code, the
 *        owl-header strip, the progress emit, and the halt tree a driver actually reads
 *        all live in the cli layer and were untested here
 *        (rule.require.acceptance-journey-coverage; r4 i001).
 *
 * .how = the peer reviewer in a guard is a `run:` SHELL COMMAND. so a reviewer that
 *        `echo`s a numeric verdict exercises the whole engine with no brain and no
 *        credential — `genReviewBrainSupply` in route.ts is a lazy memoize-on-success
 *        supplier, and the prose-fallback that would build it never fires on a numeric
 *        count. that is what makes this grain reachable at all.
 *
 * .note = the reviewer appends one char per run, so `runs.txt` is a direct tally of
 *         rounds SPAWNED. it is the only assertion here that can part a halt-BEFORE
 *         from a halt-AFTER — stdout alone cannot.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/route'),
).href;
const SET_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.routeStoneSet())`;

/**
 * .what = spawns the real cli with the given `route.stone.set` args
 * .why = a spawned process is the point — an in-process call would re-prove the
 *        operation and skip the arg parse and the exit code entirely
 */
const runStoneSet = (input: {
  cwd: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('node', ['-e', SET_COMMAND, '--', ...input.args], {
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
 * .what = the shared run-token normalizer, adapted to this suite's `cwd` argument name
 * .why = three suites had drifted three copies of it, and this copy carried the drift
 *        that mattered: it masked only a PARENTHESIZED duration, while the guard renders
 *        `rejected 0.0s` bare — so a slow runner would have gone red on an elapsed-time
 *        change no assertion cared about (r4 nitpick.2, i002). the bound is now stated
 *        once, in `asStableGuardEmit`
 */
const asStableEmit = (input: { emit: string; cwd: string }): string =>
  asStableGuardEmit({ emit: input.emit, route: input.cwd });

describe('routeStoneSet.contemplation.acceptance', () => {
  given(
    '[case1] a bound route whose one peer reviewer always hands back a blocker',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'stone-set-contemplation-cli',
          git: true,
        });

        fs.writeFileSync(
          path.join(tempDir, '1.test.stone'),
          '# stone: do the task\n',
        );
        fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');
        // budget 5 keeps exhaustion far away, so a halt can only be the contemplation
        // gate and never a spent budget
        fs.writeFileSync(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: counter',
            '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
            '',
          ].join('\n'),
        );

        return { tempDir };
      });

      when('[t0] the first `--as passed`, with no debt owed', () => {
        const out = useBeforeAll(async () =>
          runStoneSet({
            cwd: scene.tempDir,
            args: [
              '--stone',
              '1.test',
              '--route',
              scene.tempDir,
              '--as',
              'passed',
            ],
          }),
        );

        then('the gate opens — there is no prior critique to answer', () => {
          expect(out.stdout).not.toContain('await your reply');
        });

        then('the reviewer ran exactly once', () => {
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
        });

        then('it exits 2 — the judge refused on the blocker', () => {
          expect(out.exitCode).toEqual(2);
        });

        then('stderr carries the judge evidence behind the refusal', () => {
          // the second half of the stream contract. `route.ts`'s
          // `if (result.emit.stderr)` guard prints it only when the branch supplies
          // one, and the failed-judge branch is a branch that does — its terminal
          // `stampGuardReport` passes `stderr: joinArtifactStderrBlocks(stderrBlocks)`.
          //
          // ⚠️ this cited `setStoneAsPassed.ts:1021` and `route.ts:1024-1027` until
          //    2026-09-08; both had drifted by five lines. the expressions do not
          //    drift, so they are the citation now.
          //
          // the precise content was MEASURED, not assumed, and the measurement
          //    corrected a guess: this branch renders the JUDGE artifacts only. an
          //    earlier form of this assertion looked for the reviewer's own
          //    `blockers: 1` and went red — that raw verdict reaches stderr on the
          //    exhaustion / malfunction / constraint branches, never on a plain
          //    judge refusal. so the honest clamp is the judge block, which is what
          //    a driver actually receives here.
          expect(out.stderr).not.toEqual('');
          expect(out.stderr).toContain('judge 1');
          expect(out.stderr).toContain('reason: blockers found');
        });

        then(
          'matches snapshot — the judge evidence, as a driver reads it',
          () => {
            // the two `.toContain`s above pin two substrings and leave every other
            //    byte of this block free to regress. stderr is a caller-visible cli
            //    surface like any other — `rule.require.contract-snapshot-exhaustiveness`
            //    names "stdout/stderr for cli" outright — and it was the ONE surface in
            //    this suite left unpinned (r2 nitpick.1, i003).
            //
            // .note = the same stabilizer serves both streams. that is not a convenience:
            //         the run-unique tokens it swaps — the temp root, the 18-hex hash, the
            //         elapsed times — appear on stderr exactly as they do on stdout, which
            //         is why the param it takes is `emit` rather than `stdout`.
            expect(
              asStableEmit({ emit: out.stderr, cwd: scene.tempDir }),
            ).toMatchSnapshot(
              'route.stone.set - judge stderr, refusal evidence',
            );
          },
        );

        then('matches snapshot — the round that was allowed to run', () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - round ran, judge refused');
        });
      });

      when(
        '[t1] the driver edits the artifact and re-runs, with no answer written',
        () => {
          const out = useBeforeAll(async () => {
            fs.writeFileSync(
              path.join(scene.tempDir, '1.test.md'),
              '# test artifact\n\nedited, but the reviewer was never answered\n',
            );
            return runStoneSet({
              cwd: scene.tempDir,
              args: [
                '--stone',
                '1.test',
                '--route',
                scene.tempDir,
                '--as',
                'passed',
              ],
            });
          });

          then('the gate refuses at the door, and names the reviewer', () => {
            // the edit used to buy re-entry. it no longer does — this is the whole
            // outcome of the behavior, asserted through the command a driver types
            expect(out.stdout).toContain('await your reply');
            expect(out.stdout).toContain('counter');
          });

          then(
            'no round was spawned — the halt precedes the subprocess',
            () => {
              // P1's teeth at the command grain. were the gate still on the EXIT, the
              // round would have run first and this tally would read 2
              expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
            },
          );

          then('it exits 2 — a caller-must-fix constraint, not a crash', () => {
            // rule.require.exit-code-semantics: the driver must write a .taken. a bare
            // exit 1 would read as a malfunction and send them to debug the engine
            expect(out.exitCode).toEqual(2);
          });

          then('the halt reason rides stdout, and stderr stays empty', () => {
            // the contrast with [t0] IS the contract, and it is deliberate. the
            //    entrance branch in `setStoneAsPassed` supplies `emit: { stdout }`
            //    and no `stderr` key at all, so `route.ts`'s `if (result.emit.stderr)`
            //    guard is falsy and the console.error never runs. the two peer
            //    guidance halts do the same — `review.self` and the exit gate.
            //
            // ⚠️ this cited `route.ts:1024` until 2026-09-08 while three other
            //    comments in THIS file cited `:1026` for the same guard. `:1024` is
            //    `console.log('')`. ⇒ two citations of one line, in one file, that
            //    disagree — so the expression is the citation now.
            //
            //    ⇒ the split is guidance-vs-evidence, not success-vs-failure: a tree
            //    the driver must READ goes to stdout; the artifact detail that
            //    justifies a verdict goes to stderr.
            //
            // 🔴 so this is not a slack assertion — it is the tighter one. were the
            //    halt tree ever moved to stderr, a driver who runs the command under
            //    a `2>/dev/null` would lose the entire instruction and see only a
            //    bare exit 2, which is the precise failure the tree exists to prevent.
            //    and were node or a dependency to start to leak warnings onto this
            //    stream, the emptiness check catches that too.
            //
            // .note = `genContextCliEmit({ stderr: process.stdout })` at `route.ts:978`
            //         routes the PROGRESS emit to stdout as well, so stderr on this
            //         path is genuinely untouched rather than merely quiet
            //         (r4 nitpick.3, i002)
            expect(out.stderr).toEqual('');
            expect(out.stdout).toContain('await your reply');
          });

          then(
            'matches snapshot — the carried-unanswered halt, as a driver reads it',
            () => {
              expect(
                asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
              ).toMatchSnapshot(
                'route.stone.set - entrance halt, debt carried',
              );
            },
          );

          // 🔴 the EMPTY stderr is snapped too, not merely asserted above.
          //
          //    the assertion proves the stream was empty on this run; the snapshot
          //    puts that emptiness INTO the corpus, so the variant is reconstructable
          //    from the snapshots alone and a reviewer sees both streams of the halt
          //    without a run (rule.require.contract-snapshot-exhaustiveness names
          //    "stdout/stderr for cli" outright).
          then('matches snapshot — the halt leaves stderr empty', () => {
            expect(
              asStableEmit({ emit: out.stderr, cwd: scene.tempDir }),
            ).toMatchSnapshot(
              'route.stone.set - entrance halt, debt carried, stderr',
            );
          });
        },
      );

      when(
        '[t2] the driver runs `--as contemplated` with no `.taken` written',
        () => {
          const out = useBeforeAll(async () =>
            runStoneSet({
              cwd: scene.tempDir,
              args: [
                '--stone',
                '1.test',
                '--route',
                scene.tempDir,
                '--as',
                'contemplated',
                '--that',
                'counter',
              ],
            }),
          );

          then('the ack is refused — there is no response to record', () => {
            // `setStoneAsContemplated.ts:97` gates the ack on `status.ready`. a given
            // stands with no taken beside it, so the reviewer is `absent` and the
            // operation renders guidance instead of a confirmation
            expect(out.stdout).not.toContain('contemplated: counter');
          });

          then('the guidance names the exact file to author', () => {
            // the whole point of the absent branch. a bare refusal would leave the
            // driver to derive the taken path themselves — the one move they must
            // never make, since that grammar is the engine's to own
            expect(out.stdout).toContain('.taken.by_self.counter.md');
          });

          then('no round was spawned by the refused ack', () => {
            // `--as contemplated` is a WRITE-side confirmation; it must never reach
            // the review runner. were it to, this tally would climb past t1's 1
            expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
          });

          then(
            'matches snapshot — the absent-guidance halt at the cli grain',
            () => {
              // this variant was reproduced only at OPERATION grain
              //    (`setStoneAsContemplated.test.ts`). that proves the render; it
              //    never proves the COMMAND — the `--that` parse, the exit code, and
              //    the owl-header strip between the operation and the driver's
              //    terminal were all unpinned, so a change to the arg-parse→stdout
              //    assembly for this variant went undetected by this suite
              //    (r2 nitpick.2, i003).
              expect(
                asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
              ).toMatchSnapshot(
                'route.stone.set - contemplated refused, taken absent',
              );
            },
          );
        },
      );

      when('[t3] the driver answers, then re-runs', () => {
        const ack = useBeforeAll(async () => {
          // the answer path comes from the PRODUCTION transformer, never from a
          //    string swap this test performs for itself. an infix swap rebuilt here
          //    would agree with the engine today and drift on the next grammar change,
          //    which is the false-green `rule.require.single-source-of-truth-for-render`
          //    forbids — and the exact hazard `.dream/…peer-review-filename-grammar-is-
          //    bypassed.md` names as the "build half" (r1 i002)
          const answered = await answerEveryPeerGiven({
            route: scene.tempDir,
            stone: '1.test',
          });
          // .note = not decoration — were the glob to break, zero files would be written
          //         and every assertion below would pass for the wrong reason
          expect(answered).toHaveLength(1);
          return runStoneSet({
            cwd: scene.tempDir,
            args: [
              '--stone',
              '1.test',
              '--route',
              scene.tempDir,
              '--as',
              'contemplated',
              '--that',
              'counter',
            ],
          });
        });

        then('`--as contemplated --that counter` is acknowledged', () => {
          expect(ack.stdout).toContain('contemplated: counter');
        });

        then('matches snapshot — the ack, as a driver reads it', () => {
          expect(
            asStableEmit({ emit: ack.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - contemplated ack');
        });

        const out = useBeforeAll(async () =>
          runStoneSet({
            cwd: scene.tempDir,
            args: [
              '--stone',
              '1.test',
              '--route',
              scene.tempDir,
              '--as',
              'passed',
            ],
          }),
        );

        then('the gate opens — the debt was discharged by an answer', () => {
          expect(out.stdout).not.toContain('await your reply');
        });

        then('a second round ran', () => {
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(2);
        });

        then('matches snapshot — the gate open again, after the answer', () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - gate reopened after answer');
        });
      });

      when(
        '[t4] the driver acks again, but the reviewer has since spoken anew',
        () => {
          // .why = the THIRD `--as contemplated` stdout variant — `stale`. it needs no
          //        fresh scene: [t3] already drove the round that produced it. the
          //        answer written at [t3] paired the FIRST given; the round it then
          //        unlocked re-raised, so a second given now stands with no answer
          //        beside it while the first answer sits on disk. that is precisely
          //        `stale` — a taken exists, and none of them pairs the live given
          //        (r2 blocker.1, i007)
          const out = useBeforeAll(async () =>
            runStoneSet({
              cwd: scene.tempDir,
              args: [
                '--stone',
                '1.test',
                '--route',
                scene.tempDir,
                '--as',
                'contemplated',
                '--that',
                'counter',
              ],
            }),
          );

          then('the ack is refused — the prior answer no longer pairs', () => {
            expect(out.stdout).not.toContain('contemplated: counter');
          });

          then('the guidance blames the REVIEWER, never the artifact', () => {
            // 🔴 the sharp half, and the reason this variant earns a cli clamp of its
            //    own rather than a formatter one. under the old hash key the honest
            //    cause of a stale tag WAS an artifact edit; under P2 it is that the
            //    reviewer spoke again. those two sentences send a driver to two
            //    different actions — revert my edit, versus read the new critique —
            //    so the copy is load-bearing and belongs pinned at the grain the
            //    driver reads it from
            expect(out.stdout).toContain('spoken again');
            expect(out.stdout).not.toContain('artifact changed');
          });

          then('a fresh answer path is named, at the LIVE iteration', () => {
            // a stale halt that named the answered path would loop the driver forever
            expect(out.stdout).toContain('.taken.by_self.counter.md');
          });

          then('no round was spawned by the refused ack', () => {
            expect(countReviewerRuns({ route: scene.tempDir })).toEqual(2);
          });

          then(
            'matches snapshot — the stale-guidance halt at the cli grain',
            () => {
              expect(
                asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
              ).toMatchSnapshot(
                'route.stone.set - contemplated refused, taken stale',
              );
            },
          );
        },
      );
    },
  );

  given(
    '[case2] a bound route whose one peer reviewer raises no blockers',
    () => {
      // .why = the third `--as contemplated` stdout variant. case1 reaches the ack only
      //        by the `responded` route, so the OTHER ready reason — a reviewer with no
      //        critique at all — was unreachable there and needs its own guard config
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'stone-set-contemplation-clean-cli',
          git: true,
        });

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
            '    - slug: cleanly',
            // one nitpick, zero blockers. the nitpick is deliberate: a 0/0 reviewer
            //    would prove only that an EMPTY verdict needs no answer, whereas the
            //    branch under test is `blockers === 0` — assumption A2, that only
            //    blockers gate. a reviewer that raised a nitpick is the sharper witness,
            //    since it has genuinely spoken and still owes the driver no answer
            '      run: printf x >> "$route/runs.txt"; echo "blockers: 0"; echo "nitpicks: 1"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            // the judge refuses so [t0]'s first `--as passed` stops at the guard and
            //    leaves the given on disk for the ack to read. the reason names the
            //    reviewer's own verdict rather than the ack — an earlier copy read
            //    "held for the ack read", which implied the ack's readiness turned on
            //    a judge hold. it does not; `status.ready` is decided by the reviewer's
            //    blocker count alone (r2 nitpick.1, i007)
            '  - echo "passed: false\\nreason: a nitpick stands unresolved"',
            '',
          ].join('\n'),
        );

        return { tempDir };
      });

      when('[t0] a round runs, then `--as contemplated --that cleanly`', () => {
        // 🔴 the precondition round is CAPTURED, not merely fired.
        //
        //    the first `--as passed` is what runs the reviewer and leaves the given
        //    on disk for the ack to read — and its render is a distinct variant of
        //    this cli's contract: a reviewer row `approved` under a judge that
        //    refused on `a nitpick stands unresolved`. that pair appears in no
        //    case1 snapshot, where the reviewer raises a blocker instead.
        //
        // ⇒ to fire it and drop its stdout leaves a gap in the corpus: the case2
        //   sequence could not be reconstructed from the snapshots alone
        //   (rule.require.snapshot-every-journey-step · r2 nitpick.3, i015).
        const round = useBeforeAll(async () =>
          runStoneSet({
            cwd: scene.tempDir,
            args: [
              '--stone',
              '1.test',
              '--route',
              scene.tempDir,
              '--as',
              'passed',
            ],
          }),
        );

        const ack = useBeforeAll(async () => {
          // .note = reads `round` so the ack is ordered AFTER the round above, rather
          //         than merely alongside it — the given must exist on disk first
          expect(round.exitCode).toBeDefined();
          return runStoneSet({
            cwd: scene.tempDir,
            args: [
              '--stone',
              '1.test',
              '--route',
              scene.tempDir,
              '--as',
              'contemplated',
              '--that',
              'cleanly',
            ],
          });
        });

        then(
          'matches snapshot — the round that ran, nitpick-only reviewer',
          () => {
            expect(
              asStableEmit({ emit: round.stdout, cwd: scene.tempDir }),
            ).toMatchSnapshot(
              'route.stone.set - round ran, nitpick-only reviewer approved',
            );
          },
        );

        then('the reviewer spoke — a given exists to read', () => {
          // .note = not decoration. were the round never to run, the slug would name no
          //         configured-or-spoken reviewer and the assertions below would pass
          //         against a `BadRequestError` instead of the ack under test
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
        });

        then('the ack lands with no `.taken` ever written', () => {
          // `setStoneAsContemplated.ts:97` — `status.ready` is true on EITHER a present
          // taken or a reviewer with no blockers. this is the second door, and no file
          // was authored to reach it
          expect(ack.stdout).toContain('contemplated: cleanly');
        });

        then('and the tail tells the truth about WHY it was ready', () => {
          // the sharp half. `:112-115` picks the tail off `readyReason`, and to
          //    collapse the two into one line would claim a response was recorded
          //    when the driver wrote none — a false record of a conversation that
          //    never happened. so the DISTINCTION is what is pinned here
          expect(ack.stdout).toContain('raised no blockers');
          expect(ack.stdout).not.toContain('your response is recorded');
        });

        then('matches snapshot — the no-blockers ack at the cli grain', () => {
          // the second of the two variants r2 nitpick.2 named. snapped through the
          // spawned command for the same reason as its peer above: the operation
          // test pins the render, never the arg parse or the stream it lands on
          expect(
            asStableEmit({ emit: ack.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - contemplated ack, no blockers');
        });

        then('and the ack writes no byte to stderr', () => {
          // 🔴 this is a stronger claim than the per-branch one at [case4][t0], and it
          //    covers the WHOLE `--as contemplated` surface: `setStoneAsContemplated.ts`
          //    names `stderr` exactly once, at `:39`, in its return TYPE — and assigns it
          //    on no branch at all. so `route.ts:1026` is falsy for every ack this command
          //    can render, by construction rather than by case.
          //
          // ⚠️ the one `--as contemplated` path that DOES reach stderr is the invalid-slug
          //    throw, and it arrives by a different route entirely: the operation never
          //    returns, so `route.ts`'s BadRequestError catch writes it. [case3] pins that
          //    one on both streams, so the surface is now covered in both polarities
          //    (r2 blocker.1, i018).
          expect(ack.stderr).toEqual('');
        });
      });
    },
  );

  given('[case3] a `--that` slug that names no reviewer', () => {
    // .why = the NEGATIVE path of `--as contemplated`, at the cli grain. it was
    //        reproduced at operation grain only, which pins the thrown error and
    //        leaves the COMMAND's render of it — the stream it lands on, the exit
    //        code, and whether the valid-slug list survives the cli layer at all —
    //        entirely unpinned (r2 blocker.1, i006)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-contemplation-ghost-cli',
        git: true,
      });

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
          '    - slug: counter',
          '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
          '',
        ].join('\n'),
      );

      return { tempDir };
    });

    when('[t0] `--as contemplated --that ghost`', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'ghost',
          ],
        }),
      );

      then('no ack is rendered for a reviewer that does not exist', () => {
        expect(out.stdout).not.toContain('contemplated: ghost');
      });

      then('the valid slugs survive the cli layer and reach the driver', () => {
        // 🔴 the sharp half. a bare "invalid slug" would leave the driver to guess,
        //    and the whole value of the error is the list beside it. that list is
        //    assembled in the operation and must cross the cli boundary intact
        expect(`${out.stdout}${out.stderr}`).toContain('counter');
      });

      then('it exits 2 — a caller-must-fix constraint', () => {
        // `.not.toEqual(0)` was looser than the guarantee it tested. `route.ts` maps
        //    every `BadRequestError` to exit 2 with no exception, and every other
        //    constraint path in this suite pins `.toEqual(2)` — so the loose form
        //    would have gone green on a drift to exit 1, which reads as a MALFUNCTION
        //    and sends the driver to debug the engine rather than fix their slug
        //    (rule.require.exit-code-semantics; r10 nitpick.1, i009)
        expect(out.exitCode).toEqual(2);
      });

      then('no round was spawned by the rejected ack', () => {
        // a validation refusal must never reach the review runner
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(0);
      });

      then('matches snapshot — the invalid-slug refusal, both streams', () => {
        // both streams, because which one an error lands on IS the contract a
        //    driver depends on: `rule.forbid.stdout-on-exit-errors` requires the
        //    message on stderr when the process exits non-zero, and a snapshot of
        //    one stream alone could not tell a move between them
        expect(
          asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
        ).toMatchSnapshot('route.stone.set - invalid slug, stdout');
        expect(
          asStableEmit({ emit: out.stderr, cwd: scene.tempDir }),
        ).toMatchSnapshot('route.stone.set - invalid slug, stderr');
      });
    });
  });

  given('[case4] a reviewer with no critique and a judge that passes', () => {
    // .why = the SUCCESS output of `route.stone.set --as passed`. every other fixture
    //        in this suite ends at a refusal, so `passage = allowed` — the variant a
    //        driver sees on the happy path, and the most-read output of the command —
    //        had no snapshot at any grain (r2 blocker.2, i006)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-passage-allowed-cli',
        git: true,
      });

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
          '    - slug: cleanly',
          '      run: printf x >> "$route/runs.txt"; echo "blockers: 0"; echo "nitpicks: 0"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: true\\nreason: no blockers found"',
          '',
        ].join('\n'),
      );

      return { tempDir };
    });

    when('[t0] `--as passed` with every gate satisfied', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        }),
      );

      then('it exits 0 — the stone passed', () => {
        expect(out.exitCode).toEqual(0);
      });

      then('the round ran — the pass was earned, never skipped', () => {
        // 🔴 not decoration. a stone with a guard that never ran would also exit 0,
        //    and that green would be indistinguishable from this one. the tally is
        //    what parts an earned pass from a bypassed guard
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then('no contemplation halt fires — no reviewer raised a blocker', () => {
        expect(out.stdout).not.toContain('await your reply');
      });

      then('matches snapshot — the success output a driver reads', () => {
        expect(
          asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
        ).toMatchSnapshot('route.stone.set - passage allowed');
      });

      then('and stderr stays exactly empty on the success path', () => {
        // 🔴 THE ENUMERATION behind every `toEqual('')` in this suite, stated once here
        //    and pointed at from the rest. `route.ts:1026-1028` is the ONLY site that
        //    writes this command's stderr, and it is guarded — `if (result.emit.stderr)`.
        //    so stderr is non-empty exactly when `setStoneAsPassed` supplies that key,
        //    and it supplies it on FOUR branches and no others:
        //
        //      | branch            | site   |
        //      |-------------------|--------|
        //      | broken reviewers  | `:636` |
        //      | malfunction       | `:777` |
        //      | constraint        | `:848` |
        //      | failed judges     | `:1026`|
        //
        //    ⇒ a successful pass is none of the four, so the key is absent, the guard is
        //      falsy, and `console.error` is never reached. the stream is not merely
        //      quiet — it is untouched (`route.ts:980` routes the PROGRESS emit to
        //      stdout, so no byte arrives from there either).
        //
        // .why this assertion rather than a snapshot = it closes the named hazard more
        //    tightly than a baseline would. the hazard is *"a regression moved this output
        //    onto stderr and every step stayed green"* — `toEqual('')` goes red on the
        //    FIRST byte, needs no mint, and reads at the call site without a corpus fetch
        //    (r2 blocker.1, i018).
        expect(out.stderr).toEqual('');
      });
    });
  });

  given('[case5] the same gate, reached by the `--as arrived` spelling', () => {
    // .why = assumption A6 says `--as arrived` and `--as passed` both reach the gate,
    //        because `stepRouteStoneSet.ts:65-69` aliases before dispatch. every other
    //        entry in this suite types `passed`, so the alias — the spelling a driver
    //        reaches for FIRST on a fresh route — had no clamp at the cli grain, and
    //        A6 rested on a source read alone (r2 blocker.2, i007)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-arrived-alias-cli',
        git: true,
      });

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
          '    - slug: counter',
          '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
          '',
        ].join('\n'),
      );

      return { tempDir };
    });

    when('[t0] the first `--as arrived`, with no debt owed', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'arrived',
          ],
        }),
      );

      then('the alias parses and drives a real round', () => {
        // were the alias to fall through the arg parse, the command would reject the
        // value and no round would ever spawn — so the tally is the parse clamp too
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then('the gate opens — there is no prior critique to answer', () => {
        expect(out.stdout).not.toContain('await your reply');
      });

      // 🔴 the OPEN-gate tree is the baseline the [t1] halt is read against. left
      //    unpinned, a reviewer sees only the halt and cannot tell what the command
      //    rendered before any debt existed — so the journey is unreconstructable from
      //    the snapshots alone (rule.require.snapshot-every-journey-step; r1 blocker.1, i011)
      then('matches snapshot — step 1, the round with no debt owed', () => {
        expect(
          asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
        ).toMatchSnapshot(
          'route.stone.set - arrived alias, gate open, no debt owed',
        );
      });
    });

    when('[t1] a second `--as arrived`, with the critique unanswered', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'arrived',
          ],
        }),
      );

      then('the entrance gate halts this spelling too', () => {
        // 🔴 the assumption made checkable. an alias that reached a DIFFERENT dispatch
        //    would sail past the gate, and the whole behavior would have a second door
        //    left open under the spelling drivers type first
        expect(out.stdout).toContain('await your reply');
        expect(out.stdout).toContain('counter');
      });

      then('no round was spawned — the halt precedes the subprocess', () => {
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then('it exits 2 — a caller-must-fix constraint', () => {
        expect(out.exitCode).toEqual(2);
      });

      then(
        'matches snapshot — the entrance halt under the `arrived` spelling',
        () => {
          // snapped separately from case1's halt on purpose. the two SHOULD render
          //    byte-identical trees, and a snapshot per spelling is what would catch
          //    the day they stop to
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - entrance halt, via arrived');
        },
      );

      then('and stderr stays exactly empty under this alias too', () => {
        // per the enumeration at [case4][t0]: the entrance branch
        //    (`setStoneAsPassed.ts:345-351`) supplies `stdout` and no `stderr` key, so
        //    `route.ts:1026` is falsy and the stream is untouched.
        //
        // 🔴 and here the assertion carries more than a stream check. this halt exits 2,
        //    so a driver who runs the command under `2>/dev/null` loses no guidance today
        //    — but the day the tree moves to stderr they would see a bare exit 2 and no
        //    instruction at all, which is the exact failure the tree exists to prevent.
        //    case1's halt already pins this; the alias is a SECOND dispatch path and had
        //    no such clamp (r2 blocker.1, i018).
        expect(out.stderr).toEqual('');
      });
    });
  });

  given('[case6] a reviewer whose budget runs out with a blocker owed', () => {
    // .why = the F1 behavior change — `1.vision.experience.case=5`, "the debt outlives
    //        exhaustion" — is the single most consequential decision in the wish, and it
    //        was clamped at OPERATION grain alone
    //        (`setStoneAsPassed.exhausted.integration.test.ts`). every other fixture in
    //        this suite runs `budget: 5` precisely so exhaustion stays far away, so the
    //        exhaustion options tree — the surface a driver reads when their budget is
    //        spent and they must choose a lever — had no clamp at the grain they meet it
    //        (r10 blocker.1, i009).
    //
    // 🔴 the sharp step is [t1]. the artifact moves BEFORE the re-run, and the reviewer
    //    is already out of budget — so under the old `(slug, hash)` key the round would
    //    write no given at the new hash, the debt would vanish with no answer, and the
    //    stone would sail to an exhaustion verdict. that is the free exit F1 closes, and
    //    it is reachable only when the two conditions coincide.
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-exhausted-debt-cli',
        git: true,
      });

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
          '    - slug: limited',
          // budget 1 — the inverse of every other fixture here. one round runs, and
          // every attempt after it finds the reviewer spent
          '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
          '      budget: 1',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
          '',
        ].join('\n'),
      );

      return { tempDir };
    });

    when('[t0] the one round the budget affords', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        }),
      );

      then('the round ran and the reviewer raised its blocker', () => {
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
        expect(out.stdout).toContain('rejected');
      });

      then('it is NOT yet exhausted — a round that ran cannot be', () => {
        // the invariant that parts [t0] from [t2]. were this to read `exhausted`
        // already, [t2] would prove no property of the budget at all
        expect(out.stdout).not.toContain('exhausted');
      });

      // 🔴 the arc this journey exists to demonstrate is rejected -> halted -> exhausted,
      //    and this is its first frame. with [t1] and [t2] snapped but not [t0], the
      //    snapshot corpus shows the two halts and never the ordinary round they depart
      //    from (rule.require.snapshot-every-journey-step; r1 blocker.1, i011)
      then(
        'matches snapshot — step 1, the one round the budget affords',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - budget 1, the single round, rejected not exhausted',
          );
        },
      );
    });

    when('[t1] the artifact moves while the blocker sits unanswered', () => {
      const out = useBeforeAll(async () => {
        fs.writeFileSync(
          path.join(scene.tempDir, '1.test.md'),
          '# test artifact\n\nedited, and the spent reviewer was never answered\n',
        );
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
      });

      then('the debt survives BOTH the edit and the exhaustion', () => {
        // 🔴 the F1 clamp at the command grain. two discharges that used to be free
        //    are refused at once here — the hash move, and the exhausted reviewer that
        //    writes no fresh given to be re-raised by
        expect(out.stdout).toContain('await your reply');
        expect(out.stdout).toContain('limited');
      });

      then('no round was spawned — the halt precedes the subprocess', () => {
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then('it exits 2 — a caller-must-fix constraint', () => {
        expect(out.exitCode).toEqual(2);
      });

      then(
        'matches snapshot — the halt that outlived the reviewer, at cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - entrance halt, debt outlives exhaustion',
          );
        },
      );
    });

    when('[t2] the driver answers, and now meets the spent budget', () => {
      const out = useBeforeAll(async () => {
        const answered = await answerEveryPeerGiven({
          route: scene.tempDir,
          stone: '1.test',
        });
        // .note = not decoration — a broken glob would write zero files and the
        //         assertions below would pass against a still-owed debt instead
        expect(answered).toHaveLength(1);
        // 🔴 the ack is CAPTURED and ASSERTED, not fired and dropped. it was dropped.
        //
        //    ⚠️ and the reason is NOT a race. `runStoneSet` is `spawnSync`-backed and
        //       returns a plain `{ stdout, stderr, exitCode }` — no promise, no
        //       interleave; the child is reaped before the next line runs. so an
        //       `await` here would be a no-op on a non-thenable, and the sequence was
        //       never in doubt.
        //
        //    the real defect is COVERAGE: the ack's own output went unread, so if it
        //    took the not-ready branch — a guidance emit, exit 0, debt still owed —
        //    every assertion below would still pass on the `--as passed` output alone,
        //    and the `--as contemplated` step this case claims to exercise would be
        //    graded by no assertion at all (r9 nitpick.1, i018).
        const acked = runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'limited',
          ],
        });
        // .why = `🦉 contemplated:` is emitted ONLY on the registered branch
        //        (`setStoneAsContemplated.ts:120`). the not-ready branch renders the
        //        guidance prompt instead, so this one line parts a real ack from a
        //        guidance emit that would leave the debt unpaid — an exitCode check
        //        alone cannot, since both branches exit 0
        expect(acked.stdout).toContain('🦉 contemplated: limited');
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
      });

      then('the entrance gate opens — the answer discharged the debt', () => {
        expect(out.stdout).not.toContain('await your reply');
      });

      then(
        'the reviewer is exhausted, and no further round was spawned',
        () => {
          // the budget was spent at [t0]; the answer buys a pass through the DOOR, never
          // a fresh round. so the tally must stand still while the verdict changes
          expect(out.stdout).toContain('exhausted');
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
        },
      );

      then(
        'the prior verdict survives — the counts are real, not zeroed',
        () => {
          // an exhausted lane renders the last verdict that RAN. were it to render 0/0
          // it would read as a clean bill from a reviewer that cleared no finding at all
          // (rule.forbid.failhide)
          expect(out.stdout).toContain('1 blocker');
        },
      );

      then(
        'matches snapshot — the exhaustion tree and the levers it names',
        () => {
          // 🔴 the surface this whole case exists for. `rule.always.spend-own-levers-
          //    before-escalation` warns that the guard renders the budget top-up and
          //    the human approval as two peer branches, and that only the second is a
          //    human's — so the exact shape of this tree decides whether a driver
          //    spends their own lever or stalls on a foreman. it was pinned at
          //    operation grain and never at the grain the driver reads it from
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot('route.stone.set - exhausted, options tree');
        },
      );
    });
  });

  given('[case7] a reviewer retired from the config after it spoke', () => {
    // .why = `1.vision.experience.case=11`, "the reviewer that left" — a critipath found
    //        only at 5.3, and clamped at the formatter grain
    //        (`formatRouteGuardReviewPeerContemplatePrompt.test.ts [case4]`) and the
    //        operation grain (`setStoneAsContemplated.test.ts [case5]`). the CLI's own
    //        parse, exit code, and render of the variant were unpinned — the same class
    //        of gap this suite closed for the retired-union error at i006
    //        (r10 blocker.2, i009).
    //
    // 🔴 what makes it sharp is that the slug the guard PRINTS is absent from the live
    //    config by definition. a config-only validity check throws `invalid peer reviewer
    //    slug` on the guard's own guidance — the engine refusing the one command it just
    //    told the driver to type. the union with slugs-that-have-spoken is what closes it,
    //    and this asserts the union survives the cli boundary.
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-retired-reviewer-cli',
        git: true,
      });

      fs.writeFileSync(
        path.join(tempDir, '1.test.stone'),
        '# stone: do the task\n',
      );
      fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');

      const genGuard = (input: { slug: string }): string =>
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          `    - slug: ${input.slug}`,
          '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
          '',
        ].join('\n');

      fs.writeFileSync(
        path.join(tempDir, '1.test.guard'),
        genGuard({ slug: 'departed' }),
      );

      return { tempDir, genGuard };
    });

    when('[t0] `departed` speaks, then is removed from the guard', () => {
      const out = useBeforeAll(async () => {
        // 🔴 the precondition round is CAPTURED and ASSERTED, not fired and dropped.
        //
        //    the case grades that a retired reviewer's debt still gates, which requires
        //    `departed` to have written its given to disk before the guard is rewritten
        //    to name a successor. that ORDER is safe for free — `runStoneSet` is
        //    `spawnSync`-backed and returns a plain `{ stdout, stderr, exitCode }`, so
        //    the child is reaped before the `writeFileSync` below runs.
        //
        //    ⚠️ so the risk here was never an interleave; it was a SILENT PRECONDITION.
        //       the round's own result went unread, so a round that failed to run at all
        //       — a bad guard, a crash, a non-zero exit — would leave no given on disk,
        //       and `[t1]`'s halt assertions would then grade an absence rather than the
        //       carried debt they claim to grade. the exit-code read is what makes the
        //       precondition observable, and it is the same shape case8 [t0] uses.
        const spoke = runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
        // .why = the precondition made observable — a round that never ran writes no
        //        given, and every assertion below would then grade an absence
        expect(spoke.exitCode).toBeDefined();
        // the retirement itself: the config is rewritten to name a different reviewer,
        // so `departed` now exists only as a voice on disk
        fs.writeFileSync(
          path.join(scene.tempDir, '1.test.guard'),
          scene.genGuard({ slug: 'successor' }),
        );
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
      });

      then('the retired reviewer still gates the stone', () => {
        // 🔴 the whole claim of case=11. a debt keyed to the CONFIG would vanish the
        //    moment its reviewer left, and the critique it raised would die unanswered
        expect(out.stdout).toContain('await your reply');
        expect(out.stdout).toContain('departed');
      });

      then('no round was spawned — not even for the new reviewer', () => {
        // the gate precedes the runner, so `successor` never gets to speak while a
        // prior debt stands. the tally holds at [t0]'s single run
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then(
        'matches snapshot — the retired-reviewer halt, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - entrance halt, reviewer retired',
          );
        },
      );

      then(
        'and stderr stays exactly empty on the retired-reviewer halt',
        () => {
          // the entrance branch again — per the enumeration at [case4][t0], it supplies
          // `stdout` and no `stderr` key, so `route.ts:1026` never fires (r2 blocker.1, i018)
          expect(out.stderr).toEqual('');
        },
      );
    });

    when('[t1] the driver types the command the guard just printed', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'departed',
          ],
        }),
      );

      then('the slug is ACCEPTED, though the config no longer names it', () => {
        // the union under test. were the check config-only, this would exit non-zero
        // with `invalid peer reviewer slug` — the guard refusing its own guidance
        expect(`${out.stdout}${out.stderr}`).not.toContain(
          'invalid peer reviewer slug',
        );
      });

      then('and the retired-slug ack writes no byte to stderr', () => {
        // 🔴 the union above is deliberately stream-agnostic — it must be, since it
        //    grades an ABSENCE across both. but that also means it would read green
        //    whichever stream the ack landed on, so it pins the content and never the
        //    channel. this line pins the channel: `setStoneAsContemplated.ts` assigns
        //    `stderr` on no branch (see [case2]'s ack), so an ack that ever reached
        //    stderr would be a regression this suite could not otherwise observe
        //    (r2 blocker.1, i018).
        expect(out.stderr).toEqual('');
      });

      then('it guides to the exact file to author, rather than throws', () => {
        expect(out.stdout).toContain('.taken.by_self.departed.md');
      });

      then(
        'matches snapshot — the retired-slug guidance, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - contemplated guidance, reviewer retired',
          );
        },
      );
    });

    when('[t2] the driver answers the reviewer that left', () => {
      const out = useBeforeAll(async () => {
        const answered = await answerEveryPeerGiven({
          route: scene.tempDir,
          stone: '1.test',
        });
        expect(answered).toHaveLength(1);
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'departed',
          ],
        });
      });

      then('the ack lands for a reviewer that no longer runs', () => {
        // the `.taken` is the driver's SOLE lever here — a retired reviewer can never
        // re-run to clear its own blocker, and no budget top-up would summon it back
        expect(out.stdout).toContain('contemplated: departed');
      });

      then(
        'matches snapshot — the retired-reviewer ack, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - contemplated ack, reviewer retired',
          );
        },
      );
    });

    when('[t3] the answered debt no longer holds the door', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        }),
      );

      then('the gate opens — the retired debt was dischargeable', () => {
        // 🔴 the valve case=11 needs. were the retired debt undischargeable, this stone
        //    would deadlock with no lever a driver could reach — the failure the whole
        //    union exists to prevent
        expect(out.stdout).not.toContain('await your reply');
      });

      then(
        '✅ the successor does NOT inherit its predecessor\u2019s verdict',
        () => {
          // ✅ THIS SNAPSHOT PINNED A DEFECT UNTIL 2026-09-08. IT NOW PINS THE CONTRACT.
          //
          //    the defect: `successor` had never run, and the tree rendered it `rejected,
          //    cached` with `1 blocker`, at `0/5` rounds, and cited `departed`'s given and
          //    taken paths as its own. found by this case at i009.
          //
          //    the cause was a key disagreement inside one loop in `runStoneGuardReviews`:
          //      `cachedReviews.find((r) => r.index === pr.index)` — cache, keyed on POSITION
          //      `meterBySlug.get(pr.slug)`                        — meter, keyed on SLUG
          //    so a reviewer swapped in at an occupied position inherited the verdict of
          //    whoever held that position, while its own round count started at zero.
          //
          // 🔴 the sharper direction was the one this scene does NOT reach. the
          //    `cachedReview && cachedReview.blockers === 0` fast-path skipped a STRICTER
          //    reviewer added at a position whose predecessor returned clean, and reported
          //    it approved. a newly-enrolled reviewer never spoke and the stone passed on
          //    a verdict it never gave (rule.forbid.failhide).
          //
          // ✅ closed by `getCacheSafePeerReviewArtifact`, which reads the cached artifact's
          //    own slug out of its `path` and discards the cache on a mismatch. option D of
          //    fulcrum F9, ruled by the wisher 2026-09-08. its own clamp is
          //    `getCacheSafePeerReviewArtifact.test.ts` — 3 of 7 red without the guard.
          //
          // 🔴 TODO: fix structurally with option A — key the cache on the slug itself,
          //    rather than a reconciliation at each read. tracked as
          //    `.dream/v2026_09_05.fix.guard-review-cache-is-keyed-by-index-not-slug.md`.
          //    ⚠️ the guard closes the FALSE GREEN and leaves the key wrong: a mismatch
          //    still costs a needless re-run where the right key would have found the cache.
          //
          // ⚠️ these three were cited as `:402`, `:405`, and `:411` until 2026-09-08, each
          //    off by five, and `:411` was wrong in the 5.3 yield too. a line number names
          //    a POSITION, so an insert above it moves the citation and leaves the text
          //    alone — and a wrong one still points at real code, so no tool reports it.
          //    the expressions do not move; they are the citation now.
          //
          // ⇒ this snapshot went RED the moment the guard landed, which is exactly what its
          //   prior comment promised it would do. that is the clamp discharged, not lost.
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - after retired ack, successor does not inherit the retired cache',
          );
        },
      );
    });
  });

  given('[case8] a reviewer whose given carries no numeric count', () => {
    // .why = the `unreadable` variant was clamped at the formatter grain
    //        (`formatRouteGuardReviewPeerContemplatePrompt.test.ts [case5]`) and the
    //        verdict grain (`asPeerGivenVerdict.test.ts`). the CLI's own parse, exit
    //        code, and rendered halt for the variant were unpinned — the same class of
    //        gap `[case7]` closed for the retired variant (r2 blocker.1, i011).
    //
    // 🔴 what makes it sharp is that the count the halt reasons over is FABRICATED.
    //    `asPeerGivenVerdict` scores an unreadable given `blockers: 1` because the gate
    //    compares on a number and no number was read. so the render must gate on it and
    //    must NOT print it as `1 blocker` — that would send the driver to hunt a blocker
    //    the reviewer never raised. only a cli-grain snapshot pins both halves at once.
    //
    // .how = the reviewer EXITS NON-ZERO, which is what makes this grain reachable with
    //        no credential. `getReviewCounts:30` short-circuits before the sub-brain
    //        fallback on a non-zero exit, and `runStoneGuardReviews:215` writes the tally
    //        footer only for a detected verdict — so the given lands on disk with no
    //        numeric count in it, which is precisely the state the gate re-reads.
    //
    // ⚠️ `malfunction` and `unreadable` are DISTINCT terms and this scene holds both at
    //    once, on purpose. the reviewer malfunctioned (a PROCESS that could not run); the
    //    artifact it left behind is unreadable (an OUTPUT with no verdict in it). the gate
    //    reads files, never exit codes, so what it sees is the second one.
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'stone-set-unreadable-reviewer-cli',
        git: true,
      });

      fs.writeFileSync(
        path.join(tempDir, '1.test.stone'),
        '# stone: do the task\n',
      );
      fs.writeFileSync(path.join(tempDir, '1.test.md'), '# test artifact\n');

      const genGuard = (input: { slug: string }): string =>
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          `    - slug: ${input.slug}`,
          // prose, then a non-zero exit. no numeric count is emitted, and the non-zero
          // exit is what keeps the sub-brain fallback out of the path
          '      run: printf x >> "$route/runs.txt"; echo "looks solid to me, ship it"; exit 3',
          '      budget: 5',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
          '',
        ].join('\n');

      fs.writeFileSync(
        path.join(tempDir, '1.test.guard'),
        genGuard({ slug: 'mumbles' }),
      );

      return { tempDir, genGuard };
    });

    // 🔴 the precondition round is CAPTURED, not fired and dropped. it was dropped.
    //
    //    ⚠️ an earlier note here claimed the two `--as passed` invocations RACED. that
    //       claim was FALSE, and it is corrected rather than quietly dropped, because a
    //       wrong mechanism in a comment outlives the round that wrote it
    //       (`rule.require.timeless-comments`). `runStoneSet` is `spawnSync`-backed and
    //       returns a plain `{ stdout, stderr, exitCode }` — no promise is produced, so
    //       no promise can go unawaited, and the child is reaped before the next
    //       statement runs. the ORDER was never at risk.
    //
    //    what IS at risk with a dropped result is the PRECONDITION: if this round did
    //    not run — a bad guard, a crash — it writes no unreadable given, and
    //    `no second round was spawned` below would grade an absence instead of the
    //    sequence it names. the `round.exitCode` read is what makes that observable
    //    (r9 nitpick.1, i016, which named the coverage half; the mechanism above is the
    //    correction, found at i018 when the same claim was re-applied to case6).
    //
    // 🔴 and its render is a variant no other case in this suite produces. `counter` and
    //    `cleanly` emit READABLE verdicts, so the "reviewer ran, then was promoted to
    //    malfunction" tree — a reviewer row plus a judge refusal, at `passage = malfunction`
    //    — is unique to `mumbles`. to drop it leaves the corpus with the halt and never the
    //    round the halt departs from, which is the same first-frame gap `[case6][t0]` in
    //    this file already closed (rule.require.acceptance-journey-coverage).
    when('[t0] the round runs, and the driver knocks again', () => {
      const round = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        }),
      );

      const out = useBeforeAll(async () => {
        // .note = reads `round` so the second knock is ordered AFTER the first, rather
        //         than merely alongside it — the given must exist on disk first
        expect(round.exitCode).toBeDefined();
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
      });

      then(
        'matches snapshot — the round that ran, reviewer promoted to malfunction',
        () => {
          expect(
            asStableEmit({ emit: round.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - round ran, unreadable verdict promoted to malfunction',
          );
        },
      );

      then(
        'matches snapshot — the round that ran, stderr carries the judge refusal',
        () => {
          // ⚠️ stderr is pinned too: it is where the judge-refusal evidence for the
          //    unreadable round lands, so stdout alone leaves half the frame uncaptured
          //    (rule.require.contract-snapshot-exhaustiveness — "stdout/stderr for cli")
          expect(
            asStableEmit({ emit: round.stderr, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - round ran, unreadable verdict, stderr',
          );
        },
      );

      then('the unreadable given gates the stone', () => {
        // 🔴 the claim `contract.reviewer-output` states flatly: an absent verdict is
        //    NOT a clean verdict. were the gate to score it 0/0 it would read as an
        //    approval nobody gave (rule.forbid.failhide)
        expect(out.stdout).toContain('await your reply');
        expect(out.stdout).toContain('mumbles');
      });

      then('the halt names the verdict unreadable, never `1 blocker`', () => {
        // the fabricated count gates and is never rendered as the reviewer's word
        expect(out.stdout).toContain('unreadable');
        expect(out.stdout).not.toContain('1 blocker');
      });

      then('no second round was spawned', () => {
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then('matches snapshot — the unreadable halt, at the cli grain', () => {
        expect(
          asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
        ).toMatchSnapshot('route.stone.set - entrance halt, given unreadable');
      });
    });

    when('[t1] the driver types the command the guard just printed', () => {
      const out = useBeforeAll(async () =>
        runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'mumbles',
          ],
        }),
      );

      then('it guides to the exact file to author, rather than throws', () => {
        expect(out.stdout).toContain('.taken.by_self.mumbles.md');
      });

      then('the guidance never cites a count the reviewer did not give', () => {
        // 🔴 the refusal derives from the same fabricated `blockers: 1`. a driver told
        //    to "answer the 1 blocker" would open the given and find prose — the exact
        //    hunt the `unreadable` phrase exists to prevent
        expect(out.stdout).not.toContain('1 blocker');
      });

      then(
        'matches snapshot — the unreadable-slug guidance, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - contemplated guidance, given unreadable',
          );
        },
      );
    });

    when('[t2] the same reviewer is then retired from the config', () => {
      // r2 nitpick.1 — `retired` and `unreadable` are independent axes, so their STACK
      // is its own cell. it is reachable only here: the two tags are set by different
      // operations (one reads the config, one reads the given), and only the rendered
      // halt shows whether both survive into one tree
      const out = useBeforeAll(async () => {
        fs.writeFileSync(
          path.join(scene.tempDir, '1.test.guard'),
          scene.genGuard({ slug: 'successor' }),
        );
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'passed',
          ],
        });
      });

      then('both tags survive into one halt tree', () => {
        expect(out.stdout).toContain('unreadable');
        expect(out.stdout).toContain('mumbles');
      });

      then('the successor never speaks over the debt already owed', () => {
        // the gate precedes the runner, so the tally holds at [t0]'s single run
        expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
      });

      then(
        'matches snapshot — the stacked retired + unreadable halt, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - entrance halt, reviewer retired and given unreadable',
          );
        },
      );
    });

    when('[t3] the driver answers the reviewer it could not read', () => {
      const out = useBeforeAll(async () => {
        const answered = await answerEveryPeerGiven({
          route: scene.tempDir,
          stone: '1.test',
        });
        expect(answered).toHaveLength(1);
        return runStoneSet({
          cwd: scene.tempDir,
          args: [
            '--stone',
            '1.test',
            '--route',
            scene.tempDir,
            '--as',
            'contemplated',
            '--that',
            'mumbles',
          ],
        });
      });

      then('the unreadable debt is dischargeable by a `.taken`', () => {
        // 🔴 the valve. an unreadable given that could not be answered would deadlock the
        //    stone behind a reviewer that never gave a verdict — the driver would owe a
        //    reply to prose. it is answerable exactly as a readable given is
        //    (`asPeerGivenVerdict` .note)
        expect(out.stdout).toContain('contemplated: mumbles');
      });

      then(
        'matches snapshot — the unreadable-reviewer ack, at the cli grain',
        () => {
          expect(
            asStableEmit({ emit: out.stdout, cwd: scene.tempDir }),
          ).toMatchSnapshot(
            'route.stone.set - contemplated ack, given unreadable',
          );
        },
      );
    });
  });
});
