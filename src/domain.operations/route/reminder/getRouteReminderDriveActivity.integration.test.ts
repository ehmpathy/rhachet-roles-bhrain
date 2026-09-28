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
    // pause, so the status alone reads LIVE. the fixture seeds `1.vision.stone` per its passage
    // entry, and that stone's passage is `passed` ⇒ the frontier comes back empty ⇒ inactive.
    const scene = useBeforeAll(async () =>
      genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
      }),
    );

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

  given('[case4] a live status with NO enumerable stones', () => {
    // the drive/reminder AGREEMENT clamp, at the composite grain. stepRouteDrive decides completion
    // on the frontier ALONE — `nextStones.length === 0 → route complete! 🌴🤙` — with no
    // stones-exist guard (stepRouteDrive.test case3, "no stones = all done"). this composite once
    // layered such a guard on top, so a route with no enumerable stones split the two verdicts:
    // the drive answered "complete, stop" while this answered "active, nudge on". that is an
    // unbounded nudge into a session whose every drive replies `complete` — the wish's forbidden
    // infiniloop — and it evades both other exit doors (a terminal `passed` reads LIVE by status,
    // and the clone stays reachable). so the two must read completion by ONE rule, whatever the
    // stone count. RED while the guard stood (active: true), GREEN once the rules aligned.
    const scene = useBeforeAll(async () => {
      const { route } = await genRouteWithPassage({
        lines: [{ stone: '1.vision', status: 'passed' }],
        // NO stone file — the real shape when a finished route's stones are pruned or renamed.
        // the frontier is empty exactly as in case3; only the stone COUNT differs.
        stones: 'none',
      });
      return { route };
    });

    when('[t0] the activity is read', () => {
      then(
        'it is inactive with reason route-complete — the same verdict the drive gives',
        async () => {
          const activity = await getRouteReminderDriveActivity({
            route: scene.route,
          });
          expect(activity).toEqual({
            active: false,
            reason: 'route-complete',
            status: 'passed',
          });
        },
      );
    });
  });
});
