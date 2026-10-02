import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { formatRouteDriveHeader } from '../drive/formatRouteDriveHeader';
import { formatStoneBrainOutcome } from './formatStoneBrainOutcome';

/**
 * .what = pins the SHAPES a brain outcome takes against the drive's own output
 * .why = the choice is a pure transformer, and `rule.require.test-coverage-by-grain` puts a
 *        transformer at the UNIT grain
 *
 * 🔴 .why the shapes matter = the four outcomes relate to the drive body TWO ways: the
 *    halt replaces it or splices into it, and every other arm passes it through. a build
 *    that got the prose right and the shape wrong would print a halt ABOVE the stone's own
 *    text, which reads as an advisory beside work that proceeded (case=8 [t2])
 *
 * .note = the halt is a BRANCH of the drive's own `🗿 route.drive` tree (`S13`), so the
 *           stand-in drive here is a real one — built from the shared header, the same
 *           prefix every drive surface opens with
 */
const ROUTE = '.behavior/v1';
const STONE = '5.3.verification';
const BRAIN = 'claude-opus-5[1m]';
const BODY = '   └─ here is the stone';
const asDrive = (input: { brain: string | null; effort: string | null }) =>
  [
    ...formatRouteDriveHeader({ route: ROUTE, stone: STONE, ...input }),
    BODY,
  ].join('\n');
const DRIVE = asDrive({ brain: BRAIN, effort: null });

describe('formatStoneBrainOutcome', () => {
  given('[case1] a stone that declared no brain', () => {
    // 🔴 .why = every extant guard in every repo takes this branch (case=10)
    when('[t0] the outcome is rendered', () => {
      const output = formatStoneBrainOutcome({
        route: ROUTE,
        stone: STONE,
        outcome: { outcome: 'none' },
        drive: DRIVE,
      });

      then('it passes the drive through, BYTE FOR BYTE', () => {
        expect(output).toEqual(DRIVE);
      });
    });
  });

  given('[case2] a stone whose brain was dispatched', () => {
    when('[t0] the outcome is rendered', () => {
      const output = formatStoneBrainOutcome({
        route: ROUTE,
        stone: STONE,
        outcome: {
          outcome: 'requested',
          brain: BRAIN,
          effort: null,
          guard: '.behavior/v1/5.3.verification.guard',
          reviewers: [{ slug: 'primo', brain: 'opus' }],
        },
        drive: DRIVE,
      });

      then('it passes the drive through, BYTE FOR BYTE', () => {
        // .why EQUALITY = the brain already rides the `where do we go?` bucket, so any
        //    byte added here states one fact twice
        expect(output).toEqual(DRIVE);
      });
    });
  });

  given('[case3] a stone whose brain was never dispatched', () => {
    const outcome = {
      outcome: 'undispatched' as const,
      brain: BRAIN,
      effort: null,
      guard: '.behavior/v1/5.3.verification.guard',
      cause: 'unenrolled' as const,
    };

    when('[t0] the outcome is rendered on a work surface', () => {
      const output = formatStoneBrainOutcome({
        route: ROUTE,
        stone: STONE,
        outcome,
        drive: DRIVE,
      });

      then('it REPLACES the stone body with the halt', () => {
        // 🔴 .why = case=8 [t2] — an unswitched stone may never read as a switched one
        expect(output).toContain('brain switch could not land');
        expect(output).not.toContain(BODY);
      });

      then(
        'it opens with the owl and the drive root, as every drive does',
        () => {
          expect(
            output.startsWith('🦉 where were we?\n\n🗿 route.drive\n'),
          ).toBe(true);
        },
      );

      then('the prescription rides the `where do we go?` bucket', () => {
        expect(output).toContain(`└─ brain = ${BRAIN}`);
      });

      then('the cause reaches the render, so the fix is the right one', () => {
        expect(output).toContain('rhx enroll claude --as @:driver');
      });

      then('the exact composed bytes of the REPLACE path are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the caller splices the halt into a route halt', () => {
      const output = formatStoneBrainOutcome(
        { route: ROUTE, stone: STONE, outcome, drive: DRIVE },
        { whenUndispatched: 'prepend' },
      );

      then('both halts survive in ONE tree, the brain one above', () => {
        // .why = a replace here would hide the route halt a human must act on
        expect(output).toContain('brain switch could not land');
        expect(output).toContain(BODY);
        expect(output.indexOf('brain switch')).toBeLessThan(
          output.indexOf(BODY),
        );
      });

      then('the owl and the root appear exactly once', () => {
        expect(output.split('🦉').length - 1).toEqual(1);
        expect(output.split('🗿 route.drive').length - 1).toEqual(1);
      });

      then('the exact composed bytes of the SPLICE path are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });

    when('[t2] the drive does not open with the shared header', () => {
      then('the splice fails loud rather than stacks two trees', async () => {
        const error = await getError(async () =>
          formatStoneBrainOutcome(
            { route: ROUTE, stone: STONE, outcome, drive: 'not a drive' },
            { whenUndispatched: 'prepend' },
          ),
        );
        expect(error).toBeInstanceOf(UnexpectedCodePathError);
      });
    });
  });

  given('[case6] a halt whose guard declared a choice AND an effort', () => {
    when('[t0] the outcome is rendered', () => {
      const output = formatStoneBrainOutcome({
        route: ROUTE,
        stone: STONE,
        outcome: {
          outcome: 'undispatched',
          brain: BRAIN,
          effort: 'high',
          guard: '.behavior/v1/5.3.verification.guard',
          cause: 'timed-out',
        },
        drive: asDrive({ brain: BRAIN, effort: 'high' }),
      });

      then(
        'the choice and the effort render as peers beneath a bare brain',
        () => {
          expect(output).toContain(
            `└─ brain\n   │     ├─ choice = ${BRAIN}\n   │     └─ effort = high`,
          );
        },
      );

      then('the exact bytes are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case5] a brainless stone that INHERITED a prior brain', () => {
    when('[t0] the outcome is rendered', () => {
      const output = formatStoneBrainOutcome({
        route: ROUTE,
        stone: '3.4.roadmap',
        outcome: {
          outcome: 'inherited',
          brain: BRAIN,
          effort: null,
          stone: '3.3.1.blueprint',
        },
        drive: DRIVE,
      });

      then('it passes the drive through, BYTE FOR BYTE', () => {
        expect(output).toEqual(DRIVE);
      });
    });
  });

  given('[case4] the four outcomes, read as a set', () => {
    when('[t0] all four are rendered against one drive body', () => {
      const asOutput = (
        outcome: Parameters<typeof formatStoneBrainOutcome>[0]['outcome'],
      ) =>
        formatStoneBrainOutcome({
          route: ROUTE,
          stone: STONE,
          outcome,
          drive: DRIVE,
        });
      const outputs = [
        asOutput({ outcome: 'none' }),
        asOutput({
          outcome: 'requested',
          brain: 'b',
          effort: null,
          guard: 'g.guard',
          reviewers: [],
        }),
        asOutput({
          outcome: 'undispatched',
          brain: 'b',
          effort: null,
          guard: 'g.guard',
          cause: 'unenrolled',
        }),
        asOutput({
          outcome: 'inherited',
          brain: 'b',
          effort: null,
          stone: 'prior',
        }),
      ];

      then('exactly ONE of the four drops the stone body', () => {
        expect(outputs.filter((output) => !output.includes(BODY))).toHaveLength(
          1,
        );
      });

      then('the other THREE pass it through untouched', () => {
        expect(outputs.filter((output) => output === DRIVE)).toHaveLength(3);
      });
    });
  });
});
