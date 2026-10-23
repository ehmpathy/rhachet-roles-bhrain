import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './__test_assets__/answerEveryPeerGiven';
import { genContextReviewBrainSupplyDemo } from './__test_assets__/genContextReviewBrainSupplyDemo';
import { asRouteStoneSetExitCode } from './asRouteStoneSetExitCode';
import { stepRouteStoneSet } from './stepRouteStoneSet';

const noopContext = { ...genContextReviewBrainSupplyDemo(), isTTY: true };

/**
 * .what = a driver's chain of stances, end to end, on a temp route: each stance must exit 0
 *         and print the true next command
 * .why = the dogfood defect (2026-10-06): a recorded concede exited 2, so
 *        `concede && concede && absorb` stopped after the first act, and its ack named
 *        `--as passed` where the lane's `--as absorbed` was owed. this suite drives the real
 *        step, then the real exit transformer the cli calls — the pair a shell sees.
 */
describe('stepRouteStoneSet.caseStanceExitCode', () => {
  given(
    '[case1] a rejected lane with one blocker and one nitpick, answered',
    () => {
      const scene = useBeforeAll(async () => {
        const route = genTempDir({ slug: 'stance-exit-code', git: true });
        await fs.writeFile(path.join(route, '1.test.stone'), '# test stone');
        await fs.writeFile(path.join(route, '1.test.md'), '# test artifact');
        await fs.writeFile(
          path.join(route, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: limited',
            '      run: echo "blockers: 1\\nnitpicks: 1\\ntest review"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
          ].join('\n'),
        );

        // the first round raises the rejection; the driver answers it (R1)
        const arrival = await stepRouteStoneSet(
          { stone: '1.test', route, as: 'arrived' },
          noopContext,
        );
        const pathsTaken = await answerEveryPeerGiven({
          route,
          stone: '1.test',
        });
        return { route, arrival, pathsTaken };
      });

      then('the round was rejected and its one given answered', () => {
        expect(scene.arrival.passed).toBe(false);
        expect(scene.pathsTaken).toHaveLength(1);
      });

      when('[t0] the driver concedes nitpick.1 — blocker.1 still owed', () => {
        const result = useThen('the concede is recorded', async () =>
          stepRouteStoneSet(
            {
              stone: '1.test',
              route: scene.route,
              as: 'conceded',
              with: 'limited',
              about: 'nitpick.1',
              severity: 'better',
            },
            noopContext,
          ),
        );

        // 🔴 red before the fix: the cli exited 2 on `conceded: true`
        then('it exits 0 — the act landed, so an && chain continues', () => {
          expect(result.conceded).toBe(true);
          expect(asRouteStoneSetExitCode({ result })).toEqual(0);
        });

        then('the next command is the next concern on this lane', () => {
          expect(result.emit?.stdout).toContain(
            'rhx route.stone.set --stone 1.test --as conceded --with limited --about blocker.1 --severity better|urgent',
          );
          expect(result.emit?.stdout).not.toContain('--as passed');
          expect(result.emit?.stdout).not.toContain('--as absorbed');
        });

        // the whole ack is pinned beside the invariants above (i018 r012 blocker.1)
        then('the ack matches the snapshot', () => {
          expect(
            asEmitStable({
              stdout: result.emit?.stdout ?? '',
              route: scene.route,
            }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the driver concedes blocker.1 — the last on the lane', () => {
        const result = useThen('the concede is recorded', async () =>
          stepRouteStoneSet(
            {
              stone: '1.test',
              route: scene.route,
              as: 'conceded',
              with: 'limited',
              about: 'blocker.1',
              severity: 'better',
            },
            noopContext,
          ),
        );

        then('it exits 0', () => {
          expect(asRouteStoneSetExitCode({ result })).toEqual(0);
        });

        then('the next commands are absorb this lane, then re-arrive', () => {
          const stdout = result.emit?.stdout ?? '';
          const atAbsorb = stdout.indexOf(
            'rhx route.stone.set --stone 1.test --as absorbed --that limited',
          );
          const atArrive = stdout.indexOf(
            'rhx route.stone.set --stone 1.test --as arrived',
          );
          expect(atAbsorb).toBeGreaterThan(-1);
          expect(atArrive).toBeGreaterThan(atAbsorb);
          expect(stdout).not.toContain('--as passed');
        });

        // the stance close is pinned whole, beside the order invariants above
        then('the close matches the snapshot', () => {
          expect(
            asEmitStable({
              stdout: result.emit?.stdout ?? '',
              route: scene.route,
            }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the driver runs the absorb the ack named', () => {
        const result = useThen('the absorb is accepted', async () =>
          stepRouteStoneSet(
            {
              stone: '1.test',
              route: scene.route,
              as: 'absorbed',
              that: 'limited',
            },
            noopContext,
          ),
        );

        // the command the ack printed is one the gate accepts — never a refusal
        then('it is accepted and exits 0', () => {
          expect(result.absorbed).toBe(true);
          expect(asRouteStoneSetExitCode({ result })).toEqual(0);
        });
      });
    },
  );
});

/**
 * .what = an emit with its temp route dir masked
 * .why = the snapshot pins the shape a caller reads, never the host's temp path
 */
const asEmitStable = (input: { stdout: string; route: string }): string =>
  input.stdout.split(input.route).join('<route>');
