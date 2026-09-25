import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { genRouteWithPassage } from '../.test/genRouteWithPassage';
import { getRouteReminderDriveActivity } from './getRouteReminderDriveActivity';

/**
 * .what = integration cases for getRouteReminderDriveActivity — the one composite "is the drive
 *         active?" read that three callers (auto-wire, daemon tick, manual cli) share.
 * .why = the whole no-ifniloop guarantee rests on all three callers that agree on this predicate,
 *        so its three outcomes are proven against real files: an active drive stays live, a
 *        dead-status drive is inactive (route-not-live), and a COMPLETED drive — a terminal `passed`
 *        that reads LIVE by status alone — is inactive (route-complete) via the stone frontier.
 */
describe('getRouteReminderDriveActivity.integration', () => {
  given('[case1] an active drive (tail = arrived, no completion)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '5.1.execution', status: 'arrived' }],
      }),
    );

    when('[t0] the activity is read', () => {
      then('it is active (the reminder should fire)', async () => {
        const activity = await getRouteReminderDriveActivity({
          route: scene.route,
        });
        expect(activity).toEqual({ active: true, status: 'arrived' });
      });
    });
  });

  given('[case2] a dead-status drive (tail = blocked)', () => {
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [
          { stone: '5.1.execution', status: 'arrived' },
          { stone: '5.1.execution', status: 'blocked', blocker: 'approval' },
        ],
      }),
    );

    when('[t0] the activity is read', () => {
      then('it is inactive with reason route-not-live', async () => {
        const activity = await getRouteReminderDriveActivity({
          route: scene.route,
        });
        expect(activity).toEqual({
          active: false,
          reason: 'route-not-live',
          status: 'blocked',
        });
      });
    });
  });

  given('[case3] a COMPLETED drive (tail = passed, every stone passed)', () => {
    // the completion discriminator: a completed route writes the SAME `passed` tail as a mid-route
    // pause, so the status alone reads LIVE. a REAL stone whose passage is `passed` makes the stone
    // frontier empty AND stones exist ⇒ getRouteDriveComplete confirms completion ⇒ inactive.
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      });
      await fs.writeFile(path.join(route, '1.vision.stone'), 'the vision\n');
      return { route };
    });

    when('[t0] the activity is read', () => {
      then('it is inactive with reason route-complete', async () => {
        const activity = await getRouteReminderDriveActivity({
          route: scene.route,
        });
        expect(activity).toEqual({
          active: false,
          reason: 'route-complete',
          status: 'passed',
        });
      });
    });
  });

  given(
    '[case4] a passage-only fixture (a live status, no enumerable stones)',
    () => {
      const scene = useBeforeAll(async () => {
        const { route } = await genRouteWithPassage({
          lines: [{ stone: '1.vision', status: 'passed' }],
        });
        // a passage-only fixture with NO stone files: the frontier is empty BUT no stones exist, so
        // getRouteDriveComplete does NOT read it as complete — completion stays gated on status alone
        return { route };
      });

      when('[t0] the activity is read for a passage-only fixture', () => {
        then(
          'a live status with no enumerable stones is active (not a false completion)',
          async () => {
            const activity = await getRouteReminderDriveActivity({
              route: scene.route,
            });
            expect(activity).toEqual({ active: true, status: 'passed' });
          },
        );
      });
    },
  );
});
