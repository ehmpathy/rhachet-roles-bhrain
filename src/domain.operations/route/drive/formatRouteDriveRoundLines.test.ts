import { given, then, when } from 'test-fns';

import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteDriveRoundLines } from './formatRouteDriveRoundLines';

/**
 * .what = one lane's meter, with the defaults a plain lane carries
 * .why = each case names only the fields that set it apart
 */
const genMeter = (
  input: Partial<GuardPeerMeterStatus> & { index: number; slug: string },
): GuardPeerMeterStatus => ({
  level: 1,
  rounds: 1,
  budget: 3,
  verdict: 'approved',
  awaits: false,
  blockers: 0,
  nitpicks: 0,
  overruled: false,
  skippedByDispute: false,
  disputed: { blockers: 0, nitpicks: 0 },
  path: `.reviews/peer/1.vision._.review.i004.abc.r00${input.index}._.given.by_peer.${input.slug}.md`,
  ...input,
});

describe('formatRouteDriveRoundLines', () => {
  given(
    '[case1] a round with a rejection, a malfunction, a clean fold, and a judge',
    () => {
      const round = {
        iteration: 4,
        meters: [
          genMeter({
            index: 1,
            slug: 'arch',
            verdict: 'rejected',
            blockers: 2,
            nitpicks: 1,
          }),
          genMeter({ index: 2, slug: 'mech' }),
          genMeter({ index: 3, slug: 'ergo' }),
          genMeter({ index: 4, slug: 'rules', verdict: 'malfunction' }),
          genMeter({
            index: 5,
            slug: 'tests',
            verdict: 'approved',
            nitpicks: 3,
          }),
          genMeter({
            index: 6,
            slug: 'behavior',
            level: 3,
            rounds: 0,
            verdict: 'queued',
            awaits: { level: 1 },
            path: null,
          }),
        ],
        judges: [
          {
            index: 1,
            passed: false,
            reason: 'blockers exceed threshold (2 > 0)',
          },
        ],
      };

      when('[t0] the block is rendered', () => {
        const lines = formatRouteDriveRoundLines({ round });
        const out = lines.join('\n');

        then('the header names the iteration, zero-padded as on disk', () => {
          expect(lines[0]).toEqual('   ├─ latest round, i004');
        });

        then(
          'a rejected lane shows its verdict, counts, and given path',
          () => {
            expect(out).toContain(
              'r1: arch (l1, 1/3) — rejected, 2 blockers 🔴, 1 nitpick 🟠',
            );
            expect(out).toContain(
              'given: .reviews/peer/1.vision._.review.i004.abc.r001._.given.by_peer.arch.md',
            );
          },
        );

        then('a malfunctioned lane shows its state word and given path', () => {
          expect(out).toContain('r4: rules (l1, 1/3) — malfunction 💥');
          expect(out).toContain('given.by_peer.rules.md');
        });

        then('an approved lane with nitpicks stays a row of its own', () => {
          expect(out).toContain(
            'r5: tests (l1, 1/3) — approved, 0 blockers ✓, 3 nitpicks 🟠',
          );
        });

        then('a lane that awaits a lower level says so, with no given', () => {
          expect(out).toContain('r6: behavior (l3, 0/3) — awaits l1 terminal');
        });

        then('approved-clean lanes fold into one count', () => {
          expect(out).not.toContain('r2: mech');
          expect(out).not.toContain('r3: ergo');
          expect(out).toContain('2 lanes approved, 0 blockers ✓, 0 nitpicks ✓');
        });

        then('the judge row closes the block', () => {
          expect(lines[lines.length - 2]).toEqual(
            '   │   └─ j1: blocked ✗ — blockers exceed threshold (2 > 0)',
          );
          expect(lines[lines.length - 1]).toEqual('   │');
        });

        then('the block matches its snapshot', () => {
          expect(out).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case2] a round where every lane approved clean, no judge recorded',
    () => {
      const round = {
        iteration: 12,
        meters: [genMeter({ index: 1, slug: 'arch' })],
        judges: [],
      };

      when('[t0] the block is rendered', () => {
        const lines = formatRouteDriveRoundLines({ round });

        then('the block is the header, one fold row, and a spacer', () => {
          expect(lines).toEqual([
            '   ├─ latest round, i012',
            '   │   └─ 1 lane approved, 0 blockers ✓, 0 nitpicks ✓',
            '   │',
          ]);
        });
      });
    },
  );

  given('[case3] a round with lanes shown and no tail rows', () => {
    // the iteration matches the meter fixture's `i004`, so the header and the path agree
    const round = {
      iteration: 4,
      meters: [
        genMeter({ index: 1, slug: 'arch', verdict: 'rejected', blockers: 1 }),
      ],
      judges: [],
    };

    when('[t0] the block is rendered', () => {
      const lines = formatRouteDriveRoundLines({ round });

      then('the last lane closes the block', () => {
        expect(lines).toMatchSnapshot();
        expect(lines[1]).toContain('   │   └─ r1: arch');
      });
    });
  });
});
