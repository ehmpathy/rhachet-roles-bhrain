import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { formatRouteDriveHaltLeverLead } from './formatRouteDriveHaltLeverLead';
import { formatRouteDriveMixedHalt } from './formatRouteDriveMixedHalt';

/**
 * .what = pins the one builder of the halt block between reason and remedies
 * .why = the budget and the mixed halts hand-built this block byte for byte (i014 r003
 *        nitpick.1). the clamp below asserts both halts render the builder's lines verbatim, so
 *        a hand copy that drifts from it goes red here.
 */

const meterExhausted: GuardPeerMeterStatus = {
  index: 1,
  slug: 'mech-rules',
  level: 1,
  rounds: 3,
  budget: 3,
  verdict: 'exhausted',
  awaits: false,
  blockers: 2,
  nitpicks: 0,
  overruled: false,
  skippedByDispute: false,
  disputed: { blockers: 0, nitpicks: 0 },
  path: '.reviews/peer/1.vision._.review.i003.abc.r001._.given.by_peer.mech-rules.md',
};

describe('formatRouteDriveHaltLeverLead', () => {
  given('[case1] a halt with one meter', () => {
    when('[t0] the lever head is the human one', () => {
      const lines = formatRouteDriveHaltLeverLead({
        meters: [meterExhausted],
        leverHead: 'human',
        leverBranch: '└─',
      });

      then(
        'the reviews section leads, then a spacer, then the lever head',
        () => {
          expect(lines[lines.length - 2]).toEqual('      │');
          expect(lines[lines.length - 1]).toEqual(
            '      └─ spend your own lever first, then ask a human',
          );
        },
      );

      then('the block matches the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });

    when('[t1] the lever head is the driver-only one', () => {
      const lines = formatRouteDriveHaltLeverLead({
        meters: [meterExhausted],
        leverHead: 'driver',
        leverBranch: '├─',
      });

      then('the lever head names no human', () => {
        expect(lines[lines.length - 1]).toEqual(
          '      ├─ what to do — no human needed',
        );
      });
    });
  });

  given('[case2] a halt with no meter', () => {
    when('[t0] the block is built', () => {
      const lines = formatRouteDriveHaltLeverLead({
        meters: [],
        leverHead: 'human',
        leverBranch: '├─',
      });

      // the spacer belongs to the reviews section — with no section, no bare connector
      then('only the lever head is emitted', () => {
        expect(lines).toEqual([
          '      ├─ spend your own lever first, then ask a human',
        ]);
      });
    });
  });

  given('[case3] the two halts that compose the block', () => {
    when('[t0] each halt renders with one meter', () => {
      const outputBudget = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        brain: null,
        effort: null,
        reason: 'peer reviewer budget exhausted: mech-rules',
        meters: [meterExhausted],
      });
      const outputMixed = formatRouteDriveMixedHalt({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        brain: null,
        effort: null,
        reason:
          'reviewer or judge malfunctioned; peer reviewer budget exhausted: mech-rules',
        meters: [meterExhausted],
      });

      then('the budget halt carries the block verbatim', () => {
        const block = formatRouteDriveHaltLeverLead({
          meters: [meterExhausted],
          leverHead: 'human',
          leverBranch: '├─',
        }).join('\n');
        expect(outputBudget).toContain(block);
      });

      then('the mixed halt carries the block verbatim', () => {
        const block = formatRouteDriveHaltLeverLead({
          meters: [meterExhausted],
          leverHead: 'human',
          leverBranch: '└─',
        }).join('\n');
        expect(outputMixed).toContain(block);
      });
    });
  });
});
