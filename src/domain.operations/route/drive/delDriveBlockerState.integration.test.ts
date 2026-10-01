import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { asDriveBlockerStatePath } from './DriveBlocker';
import { delDriveBlockerState } from './delDriveBlockerState';
import { getDriveBlockerState } from './getDriveBlockerState';
import { asDriveStateLockPath } from './withDriveStateLock';

/**
 * .what = pins what a passage CLEARS against what it must CARRY
 * .why = this fires on `--as passed`, the one boundary case=7's attribution must cross; an
 *        erase of the whole file deletes the record one step before the cell that reads it
 *
 * .note = `[case1]` (file GONE where no brain) and `[case2]` (brain SURVIVES) are opposite,
 *         so no naive unlink or rewrite passes both (`rule.require.clamp-edge-cases`)
 * .note = `[case3]` pins that a CORRUPT state file throws loud; restore a bare catch → red
 */
describe('delDriveBlockerState', () => {
  const seed = async (input: {
    route: string;
    state: Record<string, unknown>;
  }): Promise<void> => {
    await fs.mkdir(path.join(input.route, '.route'), { recursive: true });
    await fs.writeFile(
      asDriveBlockerStatePath({ route: input.route }),
      JSON.stringify(input.state),
    );
  };

  given('[case1] a route that NEVER declared a brain', () => {
    // .why it leads = every route that never opted in is this shape; an unconditional
    //    rewrite would put a state file on disk after every passage
    when('[t0] the streak is cleared', () => {
      const scene = useThen('clears', async () => {
        const route = genTempDir({ slug: 'del-blocker-case1', git: true });
        await seed({ route, state: { count: 7, stone: 'alpha', brain: null } });
        await delDriveBlockerState({ route });
        return { route };
      });

      then('the state file is GONE, never rewritten fresh', async () => {
        // .why the FILE = a read degrades an absent file to fresh state, so only the stat
        //    parts "unlinked" from "rewritten to zeros" (case=10's cost bound)
        const present = await fs
          .stat(asDriveBlockerStatePath({ route: scene.route }))
          .then(() => true)
          .catch(() => false);
        expect(present).toEqual(false);
      });
    });
  });

  given('[case2] a route that DID land a brain switch', () => {
    when('[t0] the streak is cleared', () => {
      const scene = useThen('clears', async () => {
        const route = genTempDir({ slug: 'del-blocker-case2', git: true });
        await seed({
          route,
          state: {
            count: 7,
            stone: '3.3.1.blueprint',
            brain: { slug: 'claude-opus-5[1m]', stone: '3.3.1.blueprint' },
          },
        });
        await delDriveBlockerState({ route });
        return { route, state: await getDriveBlockerState({ route }) };
      });

      then('the block STREAK is reset — that is what a passage clears', () => {
        expect(scene.state.count).toEqual(0);
        expect(scene.state.stone).toEqual(null);
      });

      then('the brain attribution SURVIVES the passage', () => {
        // .why = case=7's line is owed on the stone AFTER the switch, and `--as passed` runs
        //    between; an erase here renders case=7 as case=10, with no sign of the prescription
        expect(scene.state.brain?.slug).toEqual('claude-opus-5[1m]');
        expect(scene.state.brain?.stone).toEqual('3.3.1.blueprint');
      });

      then('and a SECOND clear converges rather than compounds', async () => {
        // .why = passage is re-runnable, so a second clear must converge with the brain kept
        await delDriveBlockerState({ route: scene.route });
        const after = await getDriveBlockerState({ route: scene.route });
        expect(after.count).toEqual(0);
        expect(after.brain?.slug).toEqual('claude-opus-5[1m]');
      });
    });
  });

  given('[case3] a route whose state file is CORRUPT', () => {
    // .why = the one caller (`stepRouteStoneSet`) discards any boolean, so a swallowed
    //    corrupt file would leave the streak unreset in silence (`rule.forbid.failhide`)
    when('[t0] the streak is cleared', () => {
      then(
        'the loud error TRAVELS to the caller, never a silent no-op',
        async () => {
          const route = genTempDir({ slug: 'del-blocker-case3', git: true });
          await fs.mkdir(path.join(route, '.route'), { recursive: true });
          await fs.writeFile(
            asDriveBlockerStatePath({ route }),
            '{not json at all',
          );

          const error = await getError(delDriveBlockerState({ route }));

          // .why the MESSAGE = `asDriveBlockerState` names the exact repair; the class alone
          //     leaves no next move
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('corrupt');
        },
      );
    });
  });

  given('[case4] a route whose drive-state lock is HELD by a peer', () => {
    // .why the TOCTOU is clamped, never raced = a race test proves naught on a green run.
    //    under the lock, a held lock makes the decide-and-act unreachable; an unlocked
    //    `brain: null` arm would read a stale `null` and unlink (`rule.forbid.behavior-hazards`)
    when('[t0] the streak is cleared', () => {
      const scene = useThen('it contends and gives up LOUD', async () => {
        const route = genTempDir({ slug: 'del-blocker-case4', git: true });
        await seed({ route, state: { count: 7, stone: 'alpha', brain: null } });

        // hold the lock as a live peer would — the pid is what the reap reads, and ours is
        // alive, so the reap proves the hold legitimate and the contender throws
        const statePath = asDriveBlockerStatePath({ route });
        const handle = await fs.open(asDriveStateLockPath({ statePath }), 'wx');
        await handle.write(`${process.pid}\n`);

        const error = await getError(delDriveBlockerState({ route }));

        await handle.close();
        return { route, statePath, error };
      });

      then('the acquire fails loud, and names the fix', () => {
        expect(scene.error).toBeInstanceOf(Error);
        expect(scene.error.message).toContain(
          'could not acquire the drive-state lock',
        );
      });

      then(
        'and the state file SURVIVES — the unlink never ran unlocked',
        async () => {
          // .why = an unlocked unlink would destroy a file a peer holds the lock over
          const present = await fs
            .stat(scene.statePath)
            .then(() => true)
            .catch(() => false);
          expect(present).toEqual(true);
        },
      );
    });
  });
});
