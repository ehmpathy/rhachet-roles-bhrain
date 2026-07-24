import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../../../tree/formatGuardTree';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { getReviewPeerLadderStatus } from './getReviewPeerLadderStatus';

/**
 * .what = a typed peer-meter fixture with sensible defaults
 * .why = the transformer reads only level + verdict; the factory fills the rest
 */
const aMeter = (input: {
  slug: string;
  level: number;
  verdict: ReviewPeerVerdict;
}): GuardPeerMeterStatus => ({
  slug: input.slug,
  level: input.level,
  rounds: 1,
  budget: 3,
  verdict: input.verdict,
  awaits: false,
  blockers: 0,
  nitpicks: 0,
  path: null,
});

describe('getReviewPeerLadderStatus', () => {
  given(
    '[case1] l1 exhausted (terminal), l3 rejected (live) — the unlock moment',
    () => {
      when('[t0] computed', () => {
        const status = getReviewPeerLadderStatus({
          peerMeters: [
            aMeter({ slug: 'l1', level: 1, verdict: 'exhausted' }),
            aMeter({ slug: 'l3', level: 3, verdict: 'rejected' }),
          ],
        });

        then('l1 is terminal with an exhausted representative verdict', () => {
          expect(status.terminalLevels).toEqual([
            { level: 1, verdict: 'exhausted' },
          ]);
        });

        then('l3 is the live level', () => {
          expect(status.liveLevel).toEqual(3);
        });

        then('not all terminal (l3 still live)', () => {
          expect(status.allTerminal).toEqual(false);
        });

        then('is an unlock transition (l1 terminal beneath live l3)', () => {
          expect(status.unlockTransition).toEqual(true);
        });
      });
    },
  );

  given('[case2] every level terminal', () => {
    when('[t0] l1 exhausted, l3 approved', () => {
      const status = getReviewPeerLadderStatus({
        peerMeters: [
          aMeter({ slug: 'l1', level: 1, verdict: 'exhausted' }),
          aMeter({ slug: 'l3', level: 3, verdict: 'approved' }),
        ],
      });

      then('both levels are terminal, none live', () => {
        expect(status.terminalLevels).toEqual([
          { level: 1, verdict: 'exhausted' },
          { level: 3, verdict: 'approved' },
        ]);
        expect(status.liveLevel).toEqual(null);
        expect(status.allTerminal).toEqual(true);
      });

      then('no unlock transition (no live gate to point at)', () => {
        expect(status.unlockTransition).toEqual(false);
      });
    });
  });

  given('[case3] the lowest level is still live', () => {
    when('[t0] l1 rejected (live), l3 awaits', () => {
      const status = getReviewPeerLadderStatus({
        peerMeters: [
          aMeter({ slug: 'l1', level: 1, verdict: 'rejected' }),
          aMeter({ slug: 'l3', level: 3, verdict: 'queued' }),
        ],
      });

      then('no terminal levels, l1 is the live gate', () => {
        expect(status.terminalLevels).toEqual([]);
        expect(status.liveLevel).toEqual(1);
        expect(status.allTerminal).toEqual(false);
      });

      then('no unlock transition (no terminal level beneath the gate)', () => {
        expect(status.unlockTransition).toEqual(false);
      });
    });
  });

  given('[case4] a multi-reviewer level, mixed terminal verdicts', () => {
    when('[t0] l1 has one exhausted + one malfunction (both terminal)', () => {
      const status = getReviewPeerLadderStatus({
        peerMeters: [
          aMeter({ slug: 'l1a', level: 1, verdict: 'exhausted' }),
          aMeter({ slug: 'l1b', level: 1, verdict: 'malfunction' }),
          aMeter({ slug: 'l3', level: 3, verdict: 'rejected' }),
        ],
      });

      then(
        'the representative verdict is the most-escalated (malfunction)',
        () => {
          expect(status.terminalLevels).toEqual([
            { level: 1, verdict: 'malfunction' },
          ]);
          expect(status.liveLevel).toEqual(3);
        },
      );

      then(
        'NOT an unlock transition — a malfunction terminal needs a human now',
        () => {
          // .why = malfunction is terminal-for-unlock (l3 runs), but the footer must stay
          //        silent: its "human only needed once all terminal" line would contradict
          //        the halt's "overrule the malfunction now" remedy. only approved/exhausted
          //        terminal levels defer the human.
          expect(status.unlockTransition).toEqual(false);
        },
      );
    });
  });

  given(
    '[case5] a level is terminal only when ALL its reviewers are terminal',
    () => {
      when('[t0] l1 has one approved + one rejected (not all terminal)', () => {
        const status = getReviewPeerLadderStatus({
          peerMeters: [
            aMeter({ slug: 'l1a', level: 1, verdict: 'approved' }),
            aMeter({ slug: 'l1b', level: 1, verdict: 'rejected' }),
          ],
        });

        then('l1 is NOT terminal — it stays the live gate', () => {
          expect(status.terminalLevels).toEqual([]);
          expect(status.liveLevel).toEqual(1);
        });
      });
    },
  );

  given(
    '[case6] regression state — a HIGHER level terminal above a LOWER live gate',
    () => {
      when('[t0] l3 approved (terminal) but l1 rejected (live) again', () => {
        // .why = a higher level can go terminal (e.g. approved via overrule) while the base
        //        level later re-rejects. the base gate is NOT "now unlocked" by the higher
        //        level — it was always the base — so this is NOT an upward unlock moment and
        //        the footer must stay silent (else it names l1 as "now live", which inverts
        //        the lower-unlocks-higher story).
        const status = getReviewPeerLadderStatus({
          peerMeters: [
            aMeter({ slug: 'l1', level: 1, verdict: 'rejected' }),
            aMeter({ slug: 'l3', level: 3, verdict: 'approved' }),
          ],
        });

        then('l3 is terminal, l1 is the live gate', () => {
          expect(status.terminalLevels).toEqual([
            { level: 3, verdict: 'approved' },
          ]);
          expect(status.liveLevel).toEqual(1);
        });

        then(
          'NOT an unlock transition (terminal sits above the live gate)',
          () => {
            expect(status.unlockTransition).toEqual(false);
          },
        );
      });
    },
  );

  given(
    '[case7] a malfunction terminal beside a deferrable one — no deferral',
    () => {
      when('[t0] l1 exhausted (deferrable) + l2 malfunction, l3 live', () => {
        // .why = the r10 scenario at the status level: a malfunction terminal needs a human NOW,
        //        so even beside a deferrable (exhausted) terminal it must NOT defer the human.
        //        the gate requires EVERY terminal level be deferrable (approved/exhausted), so
        //        the single malfunction flips unlockTransition to false — the footer stays silent
        //        and the malfunction halt's own remedy block guides instead.
        const status = getReviewPeerLadderStatus({
          peerMeters: [
            aMeter({ slug: 'l1', level: 1, verdict: 'exhausted' }),
            aMeter({ slug: 'l2', level: 2, verdict: 'malfunction' }),
            aMeter({ slug: 'l3', level: 3, verdict: 'rejected' }),
          ],
        });

        then('both l1 and l2 are terminal, l3 is the live gate', () => {
          expect(status.terminalLevels).toEqual([
            { level: 1, verdict: 'exhausted' },
            { level: 2, verdict: 'malfunction' },
          ]);
          expect(status.liveLevel).toEqual(3);
        });

        then('NOT an unlock transition — one malfunction suppresses it', () => {
          expect(status.unlockTransition).toEqual(false);
        });
      });
    },
  );
});
