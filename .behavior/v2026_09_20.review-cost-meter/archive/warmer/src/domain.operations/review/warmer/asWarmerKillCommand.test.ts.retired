import { given, then, when } from 'test-fns';

import { asWarmerKillCommand } from './asWarmerKillCommand';

/**
 * .what = clamps the unknown-pid law the stop and re-plan lines both read
 * .why = 🔴 `kill 0` signals the caller's whole process group, so an unknown pid
 *        must never render a kill a driver could copy (rule.require.safe-by-default)
 */
describe('asWarmerKillCommand', () => {
  given('[case1] a known pid', () => {
    when('[t0] the command is rendered', () => {
      then('it names that pid', () => {
        expect(asWarmerKillCommand({ pid: 4242 })).toEqual('kill 4242');
      });
    });
  });

  given('[case2] an unknown pid', () => {
    when('[t0] the command is rendered', () => {
      then('🔴 it offers no kill at all, never `kill 0`', () => {
        expect(asWarmerKillCommand({ pid: null })).toBeNull();
      });
    });
  });

  given('[case3] a pid of 0', () => {
    when('[t0] the command is rendered', () => {
      then(
        '🔴 it offers no kill, since `kill 0` signals the whole group',
        () => {
          expect(asWarmerKillCommand({ pid: 0 })).toBeNull();
        },
      );
    });
  });

  given('[case4] a negative pid', () => {
    when('[t0] the command is rendered', () => {
      then(
        '🔴 it offers no kill, since `kill -1` signals every process',
        () => {
          expect(asWarmerKillCommand({ pid: -1 })).toBeNull();
        },
      );
    });
  });
});
