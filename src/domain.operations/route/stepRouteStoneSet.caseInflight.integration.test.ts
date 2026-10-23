import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { genContextReviewBrainSupplyDemo } from './__test_assets__/genContextReviewBrainSupplyDemo';
import { asRouteStoneDisposition } from './drive/asRouteStoneDisposition';
import { getRouteInflight } from './drive/getRouteInflight';
import { asRouteStoneSetCommandHead } from './guard/review/peer/asRouteStoneSetCommandHead';
import { getLatestPassageForStone } from './passage/getLatestPassageForStone';
import { stepRouteDrive } from './stepRouteDrive';
import { stepRouteStoneSet } from './stepRouteStoneSet';

const context = { ...genContextReviewBrainSupplyDemo(), isTTY: true };

/**
 * .what = integration tests for `route.stone.set --as inflight`
 * .why = proves the watermark lifecycle end to end: inflight writes it, the stop hook reads
 *        it as quiet, and an arrival clears it so the hook nudges again
 */
describe('stepRouteStoneSet.caseInflight.integration', () => {
  given('[case1] an unguarded stone the driver delegates repairs for', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'step-set-inflight', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.implement.stone'),
        '# implement',
      );
      await fs.writeFile(path.join(tempDir, '1.implement.md'), '# artifact');
      await fs.writeFile(path.join(tempDir, '2.verify.stone'), '# verify');
      return { tempDir };
    });

    when('[t0] --as inflight without --what', () => {
      then('it is refused with the --what hint', async () => {
        const error = await getError(
          stepRouteStoneSet(
            { stone: '1.implement', route: scene.tempDir, as: 'inflight' },
            context,
          ),
        );
        expect(error.message).toContain('--what is required for --as inflight');
        // a caller-fixable refusal is the sanctioned ConstraintError (rule.require.failloud)
        expect(error).toBeInstanceOf(ConstraintError);
      });
    });

    when('[t1] --what on another --as', () => {
      then('it is refused loud, never dropped', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '1.implement',
              route: scene.tempDir,
              as: 'passed',
              what: 'stray',
            },
            context,
          ),
        );
        expect(error.message).toContain(
          '--what is only accepted for --as inflight',
        );

        // the refusal names the fix, not only the fault (i017 r014 n2)
        expect(error.message).toContain(
          `${asRouteStoneSetCommandHead({ stone: '1.implement' })} --as inflight --what '<what>'`,
        );

        // the whole refusal, pinned, with the temp route masked so the snapshot is stable
        expect(
          error.message.split(scene.tempDir).join('$ROUTE'),
        ).toMatchSnapshot();
      });
    });

    when('[t1.1] --as inflight on a stone the route lacks', () => {
      then('it is refused with the stones available', async () => {
        const error = await getError(
          stepRouteStoneSet(
            {
              stone: '9.absent',
              route: scene.tempDir,
              as: 'inflight',
              what: 'a wait on naught',
            },
            context,
          ),
        );
        expect(error.message).toContain(
          'stone not found for --as inflight: 9.absent',
        );
        expect(error.message).toContain('1.implement');
      });
    });

    when('[t2] --as inflight with --what', () => {
      const result = useThen('the watermark is written', async () =>
        stepRouteStoneSet(
          {
            stone: '1.implement',
            route: scene.tempDir,
            as: 'inflight',
            what: 'three delegates repair blockers 1-4',
          },
          context,
        ),
      );

      then('the result reports inflight', () => {
        expect(result.inflight).toBe(true);
      });

      then('the watermark names the stone and the work', async () => {
        const inflight = await getRouteInflight({ route: scene.tempDir });
        expect(inflight?.stone).toEqual('1.implement');
        expect(inflight?.what).toEqual('three delegates repair blockers 1-4');
      });

      then('the emit names the wait and how it clears', () => {
        expect(result.emit?.stdout).toContain(
          '⏳ repairs in flight for 1.implement',
        );
        expect(result.emit?.stdout).toContain('clears it');
      });

      // the whole emit is pinned beside the invariants above, so a reword that keeps the
      // fragments and wrecks the shape around them goes red (i018 r012 blocker.1)
      then('the emit matches the snapshot', () => {
        expect(
          asInflightEmitStable({
            stdout: result.emit?.stdout ?? '',
            route: scene.tempDir,
          }),
        ).toMatchSnapshot();
      });

      then(
        'an inflight passage row is the latest (forward motion)',
        async () => {
          const latest = await getLatestPassageForStone({
            stone: '1.implement',
            route: scene.tempDir,
          });
          expect(latest?.status).toEqual('inflight');
        },
      );
    });

    when('[t3] the stop hook fires while the wait stands', () => {
      const result = useThen('onStop reads the watermark', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('it is quiet and lets the stop through', () => {
        expect(result.emit?.stderr).toBeUndefined();
        expect(result.emit?.stdout).toContain(
          '⏳ repairs in flight for 1.implement',
        );
      });
    });

    when('[t4] the driver arrives', () => {
      const result = useThen('the stone passes', async () =>
        stepRouteStoneSet(
          { stone: '1.implement', route: scene.tempDir, as: 'arrived' },
          context,
        ),
      );

      then('the stone passed', () => {
        expect(result.passed).toBe(true);
      });

      then('the watermark is cleared', async () => {
        expect(await getRouteInflight({ route: scene.tempDir })).toBeNull();
      });
    });

    when('[t5] the stop hook fires after the arrival', () => {
      const result = useThen('onStop reads no watermark', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('it nudges the next stone again (exit code 2)', () => {
        expect(result.emit?.stderr?.code).toEqual(2);
        expect(result.emit?.stdout).not.toContain('repairs in flight');
      });
    });
  });

  given(
    '[case2] a guarded stone whose round outlives a foreground call',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({
          slug: 'step-set-inflight-round',
          git: true,
        });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.implement.stone'),
          '# implement',
        );
        await fs.writeFile(path.join(tempDir, '1.implement.md'), '# artifact');
        // the judge copies the watermark aside, so the test can read what the hook
        // would have seen while the round ran
        await fs.writeFile(
          path.join(tempDir, '1.implement.guard'),
          [
            'artifacts:',
            '  - "$route/1.implement*.md"',
            'reviews:',
            '  - echo "blockers: 0\\nnitpicks: 0"',
            'judges:',
            '  - cp "$route/.route/inflight.json" "$route/probe.inflight.json" && echo "passed: true\\nreason: probed"',
          ].join('\n'),
        );
        return { tempDir };
      });

      when('[t0] the driver arrives', () => {
        useThen('the round runs to its verdict', async () =>
          stepRouteStoneSet(
            { stone: '1.implement', route: scene.tempDir, as: 'arrived' },
            context,
          ),
        );

        then('the round was marked in flight while it ran', async () => {
          const probe = JSON.parse(
            await fs.readFile(
              path.join(scene.tempDir, 'probe.inflight.json'),
              'utf-8',
            ),
          );
          expect(probe.stone).toEqual('1.implement');
          expect(probe.what).toEqual('a guard round runs for this arrival');
        });

        then('the mark clears once the round ends', async () => {
          const inflight = await getRouteInflight({ route: scene.tempDir });
          expect(inflight).toBeNull();
        });
      });

      when('[t1] the driver marks the passed stone in flight', () => {
        then('it is refused, and names the rewind', async () => {
          const error = await getError(
            stepRouteStoneSet(
              {
                stone: '1.implement',
                route: scene.tempDir,
                as: 'inflight',
                what: 'late repairs',
              },
              context,
            ),
          );
          expect(error.message).toContain('1.implement has already passed');
          expect(error.message).toContain('--as rewound');

          // the `route.stone.set` head has one home, so the rewind composes it (i017 r003 b1)
          expect(error.message).toContain(
            `${asRouteStoneSetCommandHead({ stone: '1.implement' })} --as rewound`,
          );

          // the whole refusal, pinned, with the temp route masked so the snapshot is stable
          expect(
            error.message.split(scene.tempDir).join('$ROUTE'),
          ).toMatchSnapshot();
        });

        then('the stone stays passed', async () => {
          const latest = await getLatestPassageForStone({
            stone: '1.implement',
            route: scene.tempDir,
          });
          expect(latest?.status).toEqual('passed');
        });
      });
    },
  );

  given('[case3] a stone the driver escalated --as blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'step-set-inflight-halt', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.implement.stone'),
        '# implement',
      );
      await fs.writeFile(
        path.join(tempDir, '1.implement.blocked.md'),
        '# blocked\n\nwaits on a human grant.',
      );
      return { tempDir };
    });

    when('[t0] the driver marks repairs in flight', () => {
      useThen('the mark lands after the halt', async () => {
        await stepRouteStoneSet(
          { stone: '1.implement', route: scene.tempDir, as: 'blocked' },
          context,
        );
        return stepRouteStoneSet(
          {
            stone: '1.implement',
            route: scene.tempDir,
            as: 'inflight',
            what: 'the driver works past the wall',
          },
          context,
        );
      });

      then(
        'the stale halt is superseded: the disposition reads push',
        async () => {
          const latest = await getLatestPassageForStone({
            stone: '1.implement',
            route: scene.tempDir,
          });
          expect(latest?.status).toEqual('inflight');
          expect(
            asRouteStoneDisposition({
              status: latest?.status ?? null,
              blocker: latest?.blocker ?? null,
              reason: latest?.reason ?? null,
            }),
          ).toEqual({ of: 'push' });
        },
      );
    });
  });
});

/**
 * .what = an emit with its per-run parts masked: the temp route dir, and the clock stamp
 * .why = the snapshot pins the shape a caller reads, never the host's temp path or the minute
 */
const asInflightEmitStable = (input: {
  stdout: string;
  route: string;
}): string =>
  input.stdout
    .split(input.route)
    .join('<route>')
    .replace(/\d\d:\d\d/g, '[HH:MM]');
