import { given, then, when } from 'test-fns';

import { asReviewWarmerRecordPath } from './asReviewWarmerRecordPath';
import { asWarmerStopLine } from './asWarmerStopLine';
import { MINUTES_OF_WARMER_BOOT } from './genReviewWarmer';

describe('asWarmerStopLine', () => {
  const prefix = { head: 'head-of-test', brain: 'test/brain' };

  given('[case1] a known pid', () => {
    when('[t0] rendered as a tree branch', () => {
      then('it closes the branch with both levers', () => {
        expect(
          asWarmerStopLine({
            pid: 4242,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop-and-never-spawn',
            form: 'tree',
          }),
        ).toEqual(
          '   └─ stop: kill 4242  ·  never spawn: drop --warmer from the guard or command',
        );
      });
    });

    when('[t1] rendered as an aside', () => {
      then('it trails a one-line record with the same two levers', () => {
        expect(
          asWarmerStopLine({
            pid: 4242,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop-and-never-spawn',
            form: 'aside',
          }),
        ).toEqual(
          '  ·  stop: kill 4242  ·  never spawn: drop --warmer from the guard or command',
        );
      });
    });
  });

  given('[case3] a round already run with `--warmer off`', () => {
    when('[t0] rendered with the stop lever alone', () => {
      then('🔴 it never re-offers the flag the driver just passed', () => {
        for (const pid of [4242, null]) {
          const line = asWarmerStopLine({
            pid,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop',
            form: 'tree',
          });
          expect(line).not.toContain('never spawn');
          expect(line).not.toContain('never spawn: drop --warmer');
          expect(line).toContain('stop: ');
        }
      });

      then('a known pid still reads as one kill command', () => {
        expect(
          asWarmerStopLine({
            pid: 4242,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop',
            form: 'tree',
          }),
        ).toEqual('   └─ stop: kill 4242');
      });
    });
  });

  given('[case2] an unknown pid', () => {
    when('[t0] rendered in either form', () => {
      then(
        '🔴 it never offers `kill 0` — that signals the caller`s group',
        () => {
          for (const form of ['tree', 'aside'] as const) {
            const line = asWarmerStopLine({
              pid: null,
              reviewer: 'mech-failhides',
              prefix,
              levers: 'stop-and-never-spawn',
              form,
            });
            expect(line).not.toMatch(/kill \d/);
            expect(line).toContain('pid not yet recorded');
            expect(line).toContain('never spawn: drop --warmer');
          }
        },
      );

      then(
        '🔴 it names the record the pid lands in, so a spender is stopped with no spend',
        () => {
          const line = asWarmerStopLine({
            pid: null,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop-and-never-spawn',
            form: 'tree',
          });
          expect(line).toContain(
            `once the warmer boots (≤${MINUTES_OF_WARMER_BOOT}m), read \`pid\` from ${asReviewWarmerRecordPath({ reviewer: 'mech-failhides', prefix })}, then kill it`,
          );
          // the old hint sent a driver to a full paid review to learn one number
          expect(line).not.toContain('to print it');
        },
      );

      then('both forms read whole, as a driver sees them', () => {
        const lines = (['tree', 'aside'] as const).map((form) =>
          asWarmerStopLine({
            pid: null,
            reviewer: 'mech-failhides',
            prefix,
            levers: 'stop-and-never-spawn',
            form,
          }),
        );
        expect(lines).toHaveLength(2);
        expect(lines).toMatchSnapshot();
      });
    });
  });
});
