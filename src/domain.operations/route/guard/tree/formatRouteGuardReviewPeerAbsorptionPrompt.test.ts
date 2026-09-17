import { given, then, when } from 'test-fns';

import { formatRouteGuardReviewPeerAbsorptionPrompt } from './formatRouteGuardReviewPeerAbsorptionPrompt';

/**
 * .what = pins the "declare a stance on each concern" halt, byte for byte
 * .why = r9 n1 — this is the surface that TEACHES the two words, so a driver meets them here
 *        rather than in a rule they never read (rule.require.discoverability). its exact copy —
 *        concede-leads, the sequence it names, the two command shapes, the undeclared count —
 *        is the contract, and none of it is guarded by a type. it is pinned here or nowhere
 *        (rule.require.snapshots).
 */
describe('formatRouteGuardReviewPeerAbsorptionPrompt', () => {
  given('[case1] one lane owes a stance on two concerns', () => {
    when('[t0] the prompt is rendered', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionPrompt({
        stone: '5.1.execution',
        lanes: [
          {
            slug: 'mechanic',
            pathGiven: '.reviews/peer/r001.mechanic.report.md',
            unreadable: false,
            concerns: ['blocker.1', 'nitpick.1'],
          },
        ],
      });

      // 🔴 S11 — concede LEADS, and the order is the design. the default answer to a critique
      //    is to fix it; to print the dispute first would teach the escalation as the norm
      then('concede is named before dispute', () => {
        const atConcede = stdout.indexOf('what to do — concede');
        const atDispute = stdout.indexOf('what to do — dispute');
        expect(atConcede).toBeGreaterThan(-1);
        expect(atDispute).toBeGreaterThan(atConcede);
      });

      then('the undeclared concerns are listed under the lane', () => {
        expect(stdout).toContain('slug = mechanic');
        expect(stdout).toContain('blocker.1');
        expect(stdout).toContain('nitpick.1');
      });

      // 🔴 r9 b1 — every taught command must carry its REQUIRED flag, or the driver copies
      //    one the boundary refuses. --severity is mandatory on a concede; --why on a dispute
      then('the taught CONCEDE carries its mandatory --severity', () => {
        expect(stdout).toContain('--as conceded');
        expect(stdout).toContain('--severity better|urgent');
      });

      then('the taught DISPUTE carries its mandatory --why', () => {
        expect(stdout).toContain('--as disputed');
        expect(stdout).toContain('--why');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] two lanes owe stances, one unreadable', () => {
    when('[t0] the prompt is rendered', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionPrompt({
        stone: '5.1.execution',
        lanes: [
          {
            slug: 'mechanic',
            pathGiven: '.reviews/peer/r001.mechanic.report.md',
            unreadable: false,
            concerns: ['blocker.1'],
          },
          {
            slug: 'ergonomist',
            pathGiven: '.reviews/peer/r001.ergonomist.report.md',
            unreadable: true,
            concerns: ['blocker.1'],
          },
        ],
      });

      // 🔴 an unreadable verdict is counted as 1 blocker (contract.reviewer-output), so the
      //    prompt names WHY the count is what it is, rather than leave it a mystery
      then('the unreadable lane names its fabricated count', () => {
        expect(stdout).toContain('verdict = unreadable (counted as 1 blocker)');
      });

      then('the total undeclared count spans both lanes', () => {
        expect(stdout).toContain('2 concerns stand undeclared');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case3] a single concern stands undeclared', () => {
    when('[t0] the prompt is rendered', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionPrompt({
        stone: '5.1.execution',
        lanes: [
          {
            slug: 'mechanic',
            pathGiven: '.reviews/peer/r001.mechanic.report.md',
            unreadable: false,
            concerns: ['blocker.1'],
          },
        ],
      });

      // the count is grammatical — "1 concern stands", never "1 concerns stand"
      then('the count reads singular for one concern', () => {
        expect(stdout).toContain('1 concern stands undeclared');
        expect(stdout).not.toContain('1 concerns');
      });
    });
  });
});
