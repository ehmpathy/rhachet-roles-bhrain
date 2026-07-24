import { given, then, when } from 'test-fns';

import type { ReviewPeerLadderStatus } from '../review/peer/meter/getReviewPeerLadderStatus';
import { formatGuardReviewLadderFooter } from './formatGuardReviewLadderFooter';

describe('formatGuardReviewLadderFooter', () => {
  given('[case1] l1 exhausted (terminal), l3 live — the unlock moment', () => {
    const status: ReviewPeerLadderStatus = {
      terminalLevels: [{ level: 1, verdict: 'exhausted' }],
      liveLevel: 3,
      allTerminal: false,
      unlockTransition: true,
    };

    when('[t0] rendered', () => {
      const lines = formatGuardReviewLadderFooter({
        stone: '5.3.verification',
        status,
      });
      const output = lines.join('\n');

      then('opens with its own 🪷 standalone hint header', () => {
        expect(lines[0]).toEqual('🪷 the path continues');
      });

      then(
        'names l1 terminal (with the exhausted glyph) as no longer blocking',
        () => {
          expect(output).toContain(
            'l1 is terminal (exhausted 🌙) — it no longer blocks you',
          );
        },
      );

      then('names l3 as now live', () => {
        expect(output).toContain(
          'l3 has engaged — address its blockers, then:',
        );
      });

      then('gives the exact re-drive command for the stone', () => {
        expect(output).toContain(
          'rhx route.stone.set --stone 5.3.verification --as arrived',
        );
      });

      then('states a human is only needed once every level is terminal', () => {
        expect(output).toContain(
          'a human is only needed once every level is terminal',
        );
      });

      then('matches snapshot', () => {
        expect(lines).toMatchSnapshot();
      });
    });
  });

  given('[case2] every level terminal — no live gate', () => {
    when('[t0] rendered', () => {
      then('renders no lines (the halt options carry the guidance)', () => {
        const lines = formatGuardReviewLadderFooter({
          stone: '5.3.verification',
          status: {
            terminalLevels: [
              { level: 1, verdict: 'exhausted' },
              { level: 3, verdict: 'approved' },
            ],
            liveLevel: null,
            allTerminal: true,
            unlockTransition: false,
          },
        });
        expect(lines).toEqual([]);
      });
    });
  });

  given('[case3] no terminal level yet — l1 still the live gate', () => {
    when('[t0] rendered', () => {
      then('renders no lines (no unlock has happened)', () => {
        const lines = formatGuardReviewLadderFooter({
          stone: '5.3.verification',
          status: {
            terminalLevels: [],
            liveLevel: 1,
            allTerminal: false,
            unlockTransition: false,
          },
        });
        expect(lines).toEqual([]);
      });
    });
  });

  given('[case4] two deferrable terminal levels beneath the live gate', () => {
    when('[t0] rendered', () => {
      then('names both terminal levels, then the live level', () => {
        // .why = a multi-terminal unlock: l1 approved (no glyph) + l2 exhausted (🌙), both
        //        human-deferrable, beneath a live l3. the footer names each, then the live gate.
        const lines = formatGuardReviewLadderFooter({
          stone: '1.execute',
          status: {
            terminalLevels: [
              { level: 1, verdict: 'approved' },
              { level: 2, verdict: 'exhausted' },
            ],
            liveLevel: 3,
            allTerminal: false,
            unlockTransition: true,
          },
        });
        const output = lines.join('\n');
        expect(output).toContain(
          'l1 is terminal (approved) — it no longer blocks you',
        );
        expect(output).toContain('l2 is terminal (exhausted 🌙)');
        expect(output).toContain('l3 has engaged');
      });
    });
  });

  given(
    '[case5] regression state — a terminal level ABOVE the live gate',
    () => {
      when('[t0] rendered', () => {
        then(
          'renders no lines (not an upward unlock; base is not "now live")',
          () => {
            // .why = l3 approved (terminal) sits above l1 rejected (live) — e.g. a higher
            //        level was overruled/approved while the base re-rejects. this is NOT the
            //        lower-unlocks-higher moment, so the footer must stay silent rather than
            //        name the base level l1 as "now live" (which inverts the story).
            const lines = formatGuardReviewLadderFooter({
              stone: '1.execute',
              status: {
                terminalLevels: [{ level: 3, verdict: 'approved' }],
                liveLevel: 1,
                allTerminal: false,
                unlockTransition: false,
              },
            });
            expect(lines).toEqual([]);
          },
        );
      });
    },
  );

  given(
    '[case6] a malfunction terminal beside a deferrable one — the footer must stay silent',
    () => {
      when(
        '[t0] rendered (unlockTransition false, per the status gate)',
        () => {
          then(
            'renders no lines — never the "human only needed once all terminal" claim',
            () => {
              // .why = the exact r10 scenario: l1 exhausted (deferrable) AND l2 malfunction, both
              //        terminal beneath a live l3. the malfunction needs a human NOW (overrule the
              //        broken reviewer), so the footer's final line "a human is only needed once
              //        every level is terminal" would DIRECTLY contradict the halt's own "overrule
              //        the malfunction" remedy. the status gate requires EVERY terminal level be
              //        deferrable (approved/exhausted), so one malfunction suppresses the whole
              //        footer even beside a deferrable level — the contradicting line can never
              //        appear beside a malfunction halt.
              const lines = formatGuardReviewLadderFooter({
                stone: '1.execute',
                status: {
                  terminalLevels: [
                    { level: 1, verdict: 'exhausted' },
                    { level: 2, verdict: 'malfunction' },
                  ],
                  liveLevel: 3,
                  allTerminal: false,
                  unlockTransition: false,
                },
              });
              expect(lines).toEqual([]);
              expect(lines.join('\n')).not.toContain(
                'a human is only needed once every level is terminal',
              );
            },
          );
        },
      );
    },
  );
});
