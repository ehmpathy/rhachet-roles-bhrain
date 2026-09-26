import { given, then, when } from 'test-fns';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { isReminderLiveForPassageStatus } from './isReminderLiveForPassageStatus';

describe('isReminderLiveForPassageStatus', () => {
  given('[case1] dead / parked / human-wait statuses', () => {
    const absentStatuses: PassageReport['status'][] = [
      'blocked',
      'rewound',
      'exhausted',
      'malfunction',
    ];

    absentStatuses.forEach((status, i) => {
      when(`[t${i}] status is ${status}`, () => {
        then('reminder is absent (returns false → daemon exits)', () => {
          expect(isReminderLiveForPassageStatus({ status })).toBe(false);
        });
      });
    });
  });

  given('[case2] active self-drive statuses', () => {
    const liveStatuses: PassageReport['status'][] = [
      'arrived',
      'promised',
      'absorbed',
      'disputed',
      'conceded',
      'poured',
      'approved',
      'overruled',
      'passed',
    ];

    liveStatuses.forEach((status, i) => {
      when(`[t${i}] status is ${status}`, () => {
        then('reminder is live (returns true → nudge sent)', () => {
          expect(isReminderLiveForPassageStatus({ status })).toBe(true);
        });
      });
    });
  });

  given('[case3] awaited-approval — a blocked+approval wall', () => {
    when('[t0] status is blocked (blocker=approval)', () => {
      then('reminder is absent — a human must approve, not a nudge', () => {
        // awaited-approval writes {status: blocked, blocker: approval}; the
        // status alone (blocked) is enough to make the reminder absent.
        expect(isReminderLiveForPassageStatus({ status: 'blocked' })).toBe(
          false,
        );
      });
    });
  });

  given('[case4] an UNKNOWN status the enum does not yet name', () => {
    // clamps the fail-closed guarantee. a torn/forward-incompatible passage.jsonl could carry a
    // status string the current enum lacks. the prior denylist (`!ABSENT.includes(status)`) failed
    // OPEN — an unknown status returned true (live) → a nudge at a route no rule vouches for, the
    // wish's forbidden infiniloop. the exhaustive map + `=== true` fails CLOSED: unknown → false.
    // this test goes RED under the old denylist, GREEN under the map — it has teeth.
    when('[t0] status is an unrecognized value', () => {
      then('reminder is absent (fail-closed → daemon exits)', () => {
        expect(
          isReminderLiveForPassageStatus({
            status: 'some-future-status' as PassageReport['status'],
          }),
        ).toBe(false);
      });
    });
  });
});
