import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getDriveBlockerState } from './drive/getDriveBlockerState';
import { getRouteReminderLogPath } from './reminder/getRouteReminderLogPath';
import { RouteReminderOrphanError } from './reminder/RouteReminderOrphanError';
import { stepRouteDrive } from './stepRouteDrive';
import { setStoneAsPromised } from './stones/setStoneAsPromised';

/**
 * .what = the git repo root this suite runs FROM, resolved once at module load
 * .why = the mask must split on the repo root the runtime interpolates, never on
 *        `process.cwd()` — a run from a subdirectory would leak the host path into a snapshot
 *
 * .note = sync, so the mask stays a plain sync function; falls back to `process.cwd()`
 *         where the dir has no `.git`, as `getRepoRootWithFallback` does
 */
const REPO_ROOT_FOR_MASK = (() => {
  try {
    return execSync('git rev-parse --show-toplevel', {
      encoding: 'utf-8',
    }).trim();
  } catch {
    return process.cwd();
  }
})();

/**
 * .what = masks the volatile tempdir (timestamp + hash) in drive output
 * .why = a route path carries a per-run tempdir; mask it so the drive-output
 *        snapshots stay stable across runs while the slug stays visible
 */
const asStableDriveStdout = (stdout: string | undefined): string | undefined =>
  stdout
    ?.replace(
      // /g: the volatile temp-dir can appear more than once (e.g. a driver-wall
      // block prints it in both `route = ...` and the blocker `reason:` path) — mask
      // every occurrence, else a real timestamp+hash bakes into the snapshot and flakes
      /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/g,
      '.temp/genTempDir.symlink/<ts>.$1.<hash>',
    )
    .split(`${REPO_ROOT_FOR_MASK}/`)
    // .why = the repo root is machine-local; the brain halt's guard remedy interpolates an
    //        absolute path, which would bake this host into the snapshot
    // .note = split/join, since a checkout path may carry regex metacharacters
    .join('<repo>/');

/**
 * .what = integration tests for stepRouteDrive
 * .why = verifies GPS-like guidance with real filesystem
 *
 * .note = tests pass route param directly to avoid bind conflicts
 *         (all tests run in same git repo context)
 *
 * .mock = the RouteReminder auto-wire cases below (case14+) inject `spawnDaemon` via
 *         stepRouteDrive's OWN declared `context` seam (rule.require.dependency-injection) —
 *         never a `jest.mock`/`jest.spyOn` of a global, so this is not the mock class
 *         rule.forbid.integration.mocks forbids. it returns a REAL pid (`process.pid`), so any
 *         downstream liveness probe still reads a true OS process.
 * .why mock = a real detached-spawn chain is proven once, exhaustively, in
 *         blackbox/driver.route.reminder.acceptance.test.ts (case4/case5) — these cases prove
 *         stepRouteDrive's own auto-wire call (find-or-spawn and reap sequencing), which needs
 *         only a real pid.
 */
describe('stepRouteDrive.integration', () => {
  // the auto-wire reminder-sync keys on process.env.RHACHET_CLONE_SERIAL; guard it so a stray
  // value can neither leak into the non-enrolled cases (which must skip the reminder) nor persist
  // past the one enrolled case that sets it.
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given('[case1] route with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case1', git: true });

      // create route structure (stones use .stone extension, not .stone.md)
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called', () => {
      const result = useThen('returns current stone', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout contains stone name', () => {
        expect(result.emit?.stdout).toContain('1');
      });

      then('stdout contains stone content', () => {
        expect(result.emit?.stdout).toContain('feature works');
      });

      then('stdout contains pass command', () => {
        expect(result.emit?.stdout).toContain('--as passed');
      });
    });
  });

  given('[case2] route with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case2', git: true });

      // create route structure
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.i1.md'),
        '# implementation\n\nfeature implemented.',
      );

      // mark as passed via passage.jsonl (not .passed file)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called in direct mode', () => {
      const result = useThen('returns route complete', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout shows route complete', () => {
        expect(result.emit?.stdout?.toLowerCase()).toContain('complete');
      });
    });

    when('[t1] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns null emit', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('emit is null (silent)', () => {
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case3] empty route (no stones)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case3', git: true });

      // create just a wish, no stones
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called', () => {
      const result = useThen('returns route complete', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('shows route complete (no stones to pass)', () => {
        expect(result.emit?.stdout?.toLowerCase()).toContain('complete');
      });
    });
  });

  given('[case4] route with unpassed stones called at onBoot', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case4', git: true });

      // create route structure
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called with when=hook.onBoot', () => {
      const result = useThen('returns guidance without error', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onBoot' }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout contains stone info', () => {
        expect(result.emit?.stdout).toContain('1');
      });

      then('stderr is undefined (no error at boot)', () => {
        expect(result.emit?.stderr).toBeUndefined();
      });

      then('stdout matches snapshot (normalized)', () => {
        // mask timestamp and hash, keep slug visible
        const normalized = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(normalized).toMatchSnapshot();
      });
    });

    when('[t1] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns guidance with exit code 2', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout contains stone info', () => {
        expect(result.emit?.stdout).toContain('1');
      });

      then('stderr has exit code 2 (block premature stop)', () => {
        expect(result.emit?.stderr?.code).toEqual(2);
      });

      then('stdout matches snapshot (normalized)', () => {
        // mask timestamp and hash, keep slug visible
        const normalized = result.emit?.stdout?.replace(
          /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/,
          '.temp/genTempDir.symlink/<ts>.$1.<hash>',
        );
        expect(normalized).toMatchSnapshot();
      });
    });
  });

  given('[case5] route with all stones passed called at onBoot', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case5', git: true });

      // create route structure
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.i1.md'),
        '# implementation\n\nfeature implemented.',
      );

      // mark as passed
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called with when=hook.onBoot', () => {
      const result = useThen('returns null emit (silent)', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onBoot' }),
      );

      then('emit is null (route complete, silent at boot)', () => {
        expect(result.emit).toBeNull();
      });
    });

    when('[t1] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns null emit (silent)', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('emit is null (route complete, ok to stop)', () => {
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case6] a stone blocked on an agent-fixable guard blocker', () => {
    // passage: blocked + a review.self blocker → disposition push (the driver can fix)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case6', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'blocked',
          blocker: 'review.self',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns drive guidance', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop pushes forward (blocks the stop, exit code 2)', () => {
        // an agent-fixable blocker → push → the route keeps its own momentum
        expect(result.emit?.stderr?.code).toEqual(2);
      });

      then('t0 stdout matches the pushed-forward snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case6.t0.pushed-forward',
        );
      });
    });
  });

  given(
    '[case7] a stone escalated --as blocked, then re-arrived (fails)',
    () => {
      // the reported bug: a --as blocked escalation superseded by a re-arrival that
      // fails on an agent-fixable blocker must NOT stay halted — it must push forward
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case7', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        // entry 1: the driver escalation (a wall). entry 2: the re-arrival's failure
        // (agent-fixable) supersedes it — latest-entry-wins
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          [
            JSON.stringify({ stone: '1', status: 'blocked' }),
            JSON.stringify({
              stone: '1',
              status: 'blocked',
              blocker: 'review.self',
            }),
          ].join('\n') + '\n',
        );
        return { tempDir };
      });

      when('[t0] stepRouteDrive is called with when=hook.onStop', () => {
        const result = useThen('returns drive guidance', async () =>
          stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
        );

        then(
          'the stale escalation cleared → onStop pushes forward (exit 2)',
          () => {
            expect(result.emit?.stderr?.code).toEqual(2);
          },
        );

        then('stdout does not read as a stale "marked blocked" halt', () => {
          expect(result.emit?.stdout).not.toContain('marked blocked');
        });

        then('t0 stdout matches the pushed-forward snapshot', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case7.t0.pushed-forward',
          );
        });
      });
    },
  );

  given('[case8] a stone the driver escalated --as blocked (a wall)', () => {
    // a driver wall (blocked, no blocker) is the latest → halt: allow the stop
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case8', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns the blocked halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop allows the stop (no stderr block code)', () => {
        expect(result.emit?.stderr).toBeUndefined();
      });

      then('stdout names the driver-wall halt', () => {
        expect(result.emit?.stdout).toContain('marked blocked');
      });

      then('t0 stdout matches the blocked-halt snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case8.t0.blocked-halt',
        );
      });
    });
  });

  given('[case9] a stone with an exhausted peer-budget status', () => {
    // exhausted is its own status → halt(exhausted): a human must approve or extend
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case9', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'exhausted',
          reason: 'peer reviewer budget exhausted: limited',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] stepRouteDrive is called with when=hook.onStop', () => {
      const result = useThen('returns the exhausted halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop allows the stop (no stderr block code)', () => {
        expect(result.emit?.stderr).toBeUndefined();
      });

      // 🔴 a bare `toContain('budget')` cannot tell a driver's own lever from a
      //    foreman-only one — the word appears in both renders. the assertion targets
      //    the OWNER phrase, the property `rule.always.spend-own-levers-before-escalation`
      //    actually cares about
      then(
        'stdout sorts the remedies by owner, the drivers lever first',
        () => {
          expect(result.emit?.stdout).toContain(
            'spend your own lever first, then ask a human',
          );
          expect(result.emit?.stdout).toContain(
            'converge with the reviewer — yours to run',
          );
          expect(result.emit?.stdout).toContain(
            'approve as-is — a human must grant',
          );
          expect(result.emit?.stdout).not.toContain(
            'please ask a human to either',
          );
        },
      );

      // 🔴 and the driver's lever is CONVERGE, never the top-up. this passage row carries no
      //    concession mark, so no warrant stands and `route.guard.budget` would refuse the
      //    grant — an end-to-end pin that the halt hands over no command the gate rejects
      then('no top-up is advertised — the grant would be refused', () => {
        expect(result.emit?.stdout).not.toContain('increase budget');
        expect(result.emit?.stdout).not.toContain('rhx route.guard.budget');
      });

      then('t0 stdout matches the exhausted-halt snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case9.t0.exhausted-halt',
        );
      });
    });
  });

  given('[case10] --as promised clears a prior --as blocked escalation', () => {
    // the hard rule (rule.require.forward-motion-clears-blocker): any forward motion
    // supersedes a stale halt. here the REAL setStoneAsPromised writes a passage entry
    // that clears a driver-wall blocked → onStop resumes self-drive (pushes forward)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case10', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // seed a driver-wall escalation (blocked) as the latest passage entry
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop before the driver moves (still at the wall)', () => {
      const result = useThen('returns the blocked halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop allows the stop (the escalation still stands)', () => {
        expect(result.emit?.stderr).toBeUndefined();
        expect(result.emit?.stdout).toContain('marked blocked');
      });

      then('t0 stdout matches the blocked-halt snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case10.t0.blocked-halt',
        );
      });
    });

    when('[t1] the driver marks --as promised (forward motion)', () => {
      const promised = useThen('the real promise verb runs', async () =>
        setStoneAsPromised({
          stone: new RouteStone({
            name: '1',
            path: path.join(scene.tempDir, '1.stone'),
            guard: null,
          }),
          slug: 'slug-a',
          route: scene.tempDir,
        }),
      );

      then('it records a promise artifact', () => {
        expect(promised.promise.slug).toEqual('slug-a');
      });

      then('t1 promise slug matches the forward-motion snapshot', () => {
        expect(promised.promise.slug).toMatchSnapshot('case10.t1.promise-slug');
      });
    });

    when('[t2] onStop after the --as promised', () => {
      const result = useThen('returns drive guidance', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the escalation cleared → onStop pushes forward (exit 2)', () => {
        expect(result.emit?.stderr?.code).toEqual(2);
      });

      then('stdout no longer reads as the stale blocked halt', () => {
        expect(result.emit?.stdout).not.toContain('marked blocked');
      });

      then('t2 stdout matches the pushed-forward snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case10.t2.pushed-forward',
        );
      });
    });
  });

  given('[case11] a malfunction status, then later forward motion', () => {
    // the hard rule (rule.require.forward-motion-clears-blocker) holds for malfunction too:
    // a malfunction halt (exit 1) is NOT permanent — a later --as entry supersedes it
    // (latest-per-stone in raw file order), so onStop resumes self-drive.
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case11', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // seed a malfunction as the latest passage entry
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'malfunction' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop while the malfunction stands', () => {
      const result = useThen('returns the malfunction halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop escalates to a human (exit code 1)', () => {
        expect(result.emit?.stderr?.code).toEqual(1);
      });

      then('stdout names the guard malfunction', () => {
        expect(result.emit?.stdout).toContain('malfunction');
      });

      then('t0 stdout matches the malfunction-halt snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case11.t0.malfunction-halt',
        );
      });
    });

    when('[t1] a later --as arrived supersedes the malfunction', () => {
      const arrived = useThen('the arrival entry is appended', async () => {
        const passagePath = path.join(scene.tempDir, '.route', 'passage.jsonl');
        const prior = await fs.readFile(passagePath, 'utf-8');
        await fs.writeFile(
          passagePath,
          prior +
            JSON.stringify({
              stone: '1',
              status: 'arrived',
              reason: 'entered guard reviews',
            }) +
            '\n',
        );
        const after = await fs.readFile(passagePath, 'utf-8');
        return { done: true, passage: after };
      });

      then('the entry is recorded', () => {
        expect(arrived.done).toBe(true);
      });

      then('t1 passage matches the forward-motion snapshot', () => {
        expect(arrived.passage).toMatchSnapshot('case11.t1.passage-after');
      });
    });

    when('[t2] onStop after the forward motion', () => {
      const result = useThen('returns drive guidance', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the malfunction cleared → onStop pushes forward (exit 2)', () => {
        // NOT exit 1 — the malfunction halt is gone, the route self-drives again
        expect(result.emit?.stderr?.code).toEqual(2);
      });

      then('stdout no longer names the malfunction halt', () => {
        expect(result.emit?.stdout).not.toContain('guard malfunction');
      });

      then('t2 stdout matches the pushed-forward snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case11.t2.pushed-forward',
        );
      });
    });
  });

  given('[case12] a malfunction status, at onBoot vs onStop', () => {
    // a malfunction must not stall session start: onBoot surfaces the halt as
    // guidance but exits 0 (per onBoot's contract). only onStop escalates (exit 1).
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case12', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'malfunction' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] stepRouteDrive is called at onBoot', () => {
      const result = useThen('returns guidance', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onBoot' }),
      );

      then('onBoot does not escalate (exit 0)', () => {
        expect(result.emit?.stderr).toBeUndefined();
      });

      then('stdout still surfaces the malfunction', () => {
        expect(result.emit?.stdout).toContain('malfunction');
      });

      then('t0 onBoot stdout matches the surfaced-malfunction snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case12.t0.onboot-malfunction',
        );
      });
    });

    when('[t1] stepRouteDrive is called at onStop', () => {
      const result = useThen('returns the malfunction halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('onStop escalates to a human (exit code 1)', () => {
        expect(result.emit?.stderr?.code).toEqual(1);
      });

      then(
        't1 onStop stdout matches the escalated-malfunction snapshot',
        () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case12.t1.onstop-malfunction',
          );
        },
      );
    });
  });

  given('[case13] a driver wall (--as blocked), read in direct mode', () => {
    // direct mode (rhx route.drive, no --when) must surface the same halted/blocked
    // message hook mode shows for a driver wall — else the wall is silently dropped
    // and the human sees only generic guidance (a friction hazard the wish set out to fix)
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case13', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // seed a driver wall: status 'blocked' with NO guard blocker
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] stepRouteDrive is called in direct mode (no --when)', () => {
      const result = useThen('returns the blocked message', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('stdout surfaces the driver-wall blocked message', () => {
        expect(result.emit?.stdout).toContain('marked blocked');
      });

      then('t0 stdout matches the direct-mode blocked snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case13.t0.direct-blocked',
        );
      });
    });
  });

  given(
    '[case14] 🔴 an undeclared concern, on a driver already past the tea-pause threshold',
    () => {
      // .why = the vision names the tea-pause menu the SHARPEST vocabulary surface: it prints
      //        a closed three-way over --as arrived | passed | blocked, asserts "you must
      //        choose one", and closes "to refuse is not an option". a five-member menu was
      //        the obvious repair — and it is the wrong one. the blocker dispatcher runs
      //        BEFORE the drive emit on all three surfaces, so a stance PRE-EMPTS the menu
      //        and the menu never needs a stance member.
      //
      // 🔴 this case is what makes that a checked claim rather than a read of the code. the
      //    drive-blocker count is seeded past 5 on purpose, so the menu is what WOULD render
      //    — an unseeded count renders no menu at all, and the absence assertions below would
      //    then pass under a dispatcher that had been moved or deleted.
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case14', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');

        // the architect's critique: 1 blocker, and on default thresholds that holds the road
        await fs.mkdir(path.join(tempDir, '.reviews', 'peer'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(
            tempDir,
            '.reviews',
            'peer',
            '1._.review.i001.abc0123.r001._.given.by_peer.architect.md',
          ),
          '# review\n\n1 blockers\n0 nitpicks\n',
        );

        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1',
            status: 'blocked',
            blocker: 'review.peer.undeclared',
          }) + '\n',
        );

        // seed the stuck-driver count: the next hook increments to 10, so suggestBlocked
        // (count > 5) is TRUE and the tea-pause menu is live but for the pre-emption
        await fs.writeFile(
          path.join(tempDir, '.route', '.drive.blockers.latest.json'),
          JSON.stringify({ count: 9, stone: '1' }, null, 2),
        );

        return { tempDir };
      });

      when('[t0] stepRouteDrive is called with when=hook.onStop', () => {
        const result = useThen('returns a halt', async () =>
          stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
        );

        then('the stance prompt is what renders', () => {
          expect(result.emit?.stdout).toContain(
            'each concern awaits your absorption',
          );
        });

        then('it teaches BOTH words, so neither is met only in a rule', () => {
          expect(result.emit?.stdout).toContain('--as conceded');
          expect(result.emit?.stdout).toContain('--as disputed');
        });

        then('the tea-pause menu does NOT render — it is pre-empted', () => {
          // the claim the no-edit decision rests on. a dispatcher moved below the drive
          // emit, or a stance branch that returned null, puts this string back
          expect(result.emit?.stdout).not.toContain('you must choose one');
        });

        then(
          'and --as blocked is NOT offered beside an unanswered critique',
          () => {
            // rule.forbid.unanswered-exits-from-a-blocker: a halt is no door out of a
            // critique you have not answered, so the menu's stuck-path must not be
            // reachable from a state where a concern stands undeclared
            expect(result.emit?.stdout).not.toContain('--as blocked');
          },
        );

        then('the stop is BLOCKED — the driver can act now', () => {
          expect(result.emit?.stderr?.code).toEqual(2);
        });

        then('t0 stdout matches the pre-empted-menu snapshot', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case14.t0.stance-preempts-the-menu',
          );
        });
      });
    },
  );

  // .why = the auto-wire's ACTIVE branch, exercised where it actually runs (in stepRouteDrive, not
  //        genRouteReminder in isolation): a live, unfinished drive must register exactly one
  //        reminder daemon for the enrolled session.
  given(
    '[case15] an enrolled driver session on a live, unfinished drive',
    () => {
      // two stones: stone 1 passed (passage tail = live), stone 2 still open → NOT complete, so
      // the drive returns stone-2 guidance AND the auto-wire registers the reminder for the session
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case15', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild a feature.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: first\n\ndone when:\n- first works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.i1.md'),
          '# implementation\n\nfirst done.',
        );
        await fs.writeFile(
          path.join(tempDir, '2.stone'),
          '# stone: second\n\ndone when:\n- second works',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
        );
        return { tempDir };
      });

      when(
        '[t0] stepRouteDrive is called with a fake spawn + enrolled env',
        () => {
          // record spawns; return this process's own (live) pid so the handle reads live and the
          // happy path never signals it (the jest worker is safe)
          const spawns: { route: string; cloneAddr: string }[] = [];
          const result = useThen('returns stone guidance', async () => {
            process.env.RHACHET_CLONE_SERIAL = 'clone-case15';
            return stepRouteDrive(
              { route: scene.tempDir },
              {
                spawnDaemon: async (i) => {
                  spawns.push({ route: i.route, cloneAddr: i.cloneAddr });
                  return { pid: process.pid };
                },
              },
            );
          });

          then('the drive still surfaces the next (unfinished) stone', () => {
            expect(result.emit).not.toBeNull();
            expect(result.emit?.stdout).toContain('2');
          });

          then(
            'the auto-wire spawned exactly one reminder daemon for the session',
            () => {
              expect(spawns).toEqual([
                // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:'
                { route: scene.tempDir, cloneAddr: '@:clone-case15' },
              ]);
            },
          );
        },
      );
    },
  );

  // .why = the fault-guard's BENIGN branch, exercised where it actually runs (in stepRouteDrive,
  //        not genRouteReminder in isolation): a non-orphan reminder fault must NOT break the drive,
  //        and must land in the WATCHED per-session log — not the hook's unwatched stderr.
  given(
    '[case16] an enrolled session whose reminder sync throws a BENIGN (non-orphan) fault',
    () => {
      // same live, unfinished drive as case15 → the auto-wire reaches the active-branch spawn
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case16', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild a feature.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: first\n\ndone when:\n- first works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.i1.md'),
          '# implementation\n\nfirst done.',
        );
        await fs.writeFile(
          path.join(tempDir, '2.stone'),
          '# stone: second\n\ndone when:\n- second works',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
        );
        return { tempDir };
      });

      when(
        '[t0] stepRouteDrive is called and the spawn boundary faults',
        () => {
          const result = useThen(
            'the drive resolves (does NOT throw)',
            async () => {
              process.env.RHACHET_CLONE_SERIAL = 'clone-case16';
              return stepRouteDrive(
                { route: scene.tempDir },
                {
                  spawnDaemon: async () => {
                    throw new Error('spawn boom (benign)');
                  },
                },
              );
            },
          );

          then('the drive still surfaces the next (unfinished) stone', () => {
            expect(result.emit).not.toBeNull();
            expect(result.emit?.stdout).toContain('2');
          });

          then(
            'the benign fault lands in the WATCHED per-session reminder log',
            async () => {
              const logPath = getRouteReminderLogPath({
                route: scene.tempDir,
                // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:'
                cloneAddr: '@:clone-case16',
              });
              const logText = await fs.readFile(logPath, 'utf-8');
              expect(logText).toContain('RouteReminder auto-sync fault');
              expect(logText).toContain('spawn boom (benign)');
            },
          );
        },
      );
    },
  );

  // .why = the fault-guard's ORPHAN branch, exercised where it actually runs. a RouteReminderOrphanError
  //        raised anywhere in the reminder sync must PROPAGATE out of stepRouteDrive — even at
  //        hook.onBoot, the DELIBERATE exception to the exit-0 boot contract (a loose daemon is worse
  //        than a blocked boot). this proves the guard's discrimination logic actually wires up, not
  //        just that genRouteReminder throws the right type in isolation.
  given(
    '[case17] an enrolled session whose reminder sync throws a RouteReminderOrphanError',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case17', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild a feature.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: first\n\ndone when:\n- first works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.i1.md'),
          '# implementation\n\nfirst done.',
        );
        await fs.writeFile(
          path.join(tempDir, '2.stone'),
          '# stone: second\n\ndone when:\n- second works',
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
        );
        return { tempDir };
      });

      when(
        '[t0] stepRouteDrive runs as hook.onBoot and the sync orphans',
        () => {
          then(
            'the orphan REJECTS the drive (does not honor exit-0 boot) — it propagates out',
            async () => {
              process.env.RHACHET_CLONE_SERIAL = 'clone-case17';
              const error = await getError(
                stepRouteDrive(
                  { route: scene.tempDir, when: 'hook.onBoot' },
                  {
                    spawnDaemon: async () => {
                      throw new RouteReminderOrphanError(
                        'a daemon may be orphaned and still alive; kill it manually: kill -9 4242',
                        { pid: 4242, route: scene.tempDir },
                      );
                    },
                  },
                ),
              );
              expect(error).toBeInstanceOf(RouteReminderOrphanError);
            },
          );
        },
      );
    },
  );

  given('[case18] a guard whose top-level key the parser does not know', () => {
    /**
     * .what = the dropped-key advisory does NOT reach `route.drive`, on any surface
     * .why = the drive re-renders every tick, so a guard typo there is read dozens of times;
     *        the advisory belongs to a surface that reads the guard on purpose, and its
     *        render has its own suite (`formatGuardParseWarnings.test.ts`)
     */
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case18', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );

      // `model:` — the alias a hand reaches for, because /model and --model both say it
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        [
          'model: claude-opus-5[1m]',
          'artifacts:',
          '  - $route/1.i*.md',
          '',
        ].join('\n'),
      );

      return { tempDir };
    });

    // all THREE surfaces, so a prepend re-added on any one turns exactly one row red
    // (`rule.require.clamp-edge-cases`)
    const SURFACES = [
      { name: 'the onStop hook', when: 'hook.onStop' as const },
      { name: 'the onBoot hook', when: 'hook.onBoot' as const },
      { name: 'direct mode', when: undefined },
    ];

    SURFACES.forEach((surface, index) => {
      when(`[t${index}] ${surface.name} renders the drive`, () => {
        const result = useThen('returns the drive', async () =>
          stepRouteDrive({ route: scene.tempDir, when: surface.when }),
        );

        then('the advisory does NOT reach this surface', () => {
          // the advisory has one home, and `route.drive` is not it
          expect(result.emit?.stdout).not.toContain('🗿 guard:');
          expect(result.emit?.stdout).not.toContain(
            'reads as an alias of `brain:`',
          );
        });

        then('the DROP still lands — the alias carries no value', () => {
          // 🔴 .why = the F18 bound is about the VALUE: a build that began to honour
          //    `model:` would change behavior with no advisory on this surface to show it
          expect(result.emit?.stdout).not.toContain('brain =');
          expect(result.emit?.stdout).not.toContain('claude-opus-5[1m]');
        });

        then('the drive body rides, whole and unprefixed', () => {
          // .why = the drive is the WHOLE output on this surface
          expect(result.emit?.stdout).toContain('--as passed');
        });

        then('the exact bytes a driver reads on this surface', () => {
          // .why = `toContain` misses a reordered or dropped line; the snapshot pins the
          //        composed surface (`rule.require.contract-snapshot-exhaustiveness`)
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            `case18.t${index}.${surface.when ?? 'direct'}`,
          );
        });
      });
    });
  });

  given('[case19] a guard with no unknown key at all', () => {
    // 🔴 .why = case=10's bound at the DRIVE grain: every extant guard takes this branch,
    //          so a clean guard must add no line on any surface
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case19', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );

      return { tempDir };
    });

    const SURFACES = [
      { name: 'the onStop hook', when: 'hook.onStop' as const },
      { name: 'the onBoot hook', when: 'hook.onBoot' as const },
      { name: 'direct mode', when: undefined },
    ];

    SURFACES.forEach((surface, index) => {
      when(`[t${index}] ${surface.name} renders the drive`, () => {
        const result = useThen('returns the drive', async () =>
          stepRouteDrive({ route: scene.tempDir, when: surface.when }),
        );

        then('no advisory is emitted at all', () => {
          expect(result.emit?.stdout).not.toContain('is not a key i know');
        });

        then('the drive opens on its own first line', () => {
          // .why = sharper than an absent phrase: a stray blank line or bare header would
          //        pass the check above and still shift every drive down by a line
          expect(result.emit?.stdout?.startsWith('🦉 where were we?')).toEqual(
            true,
          );
        });

        then('the exact bytes a driver reads on this surface', () => {
          // .why = the byte-for-byte proof case=10 asks for — the asserts above miss a
          //        shifted line in the drive BODY (`rule.require.contract-snapshot-exhaustiveness`)
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            `case19.t${index}.${surface.when ?? 'direct'}`,
          );
        });
      });
    });
  });

  given(
    '[case20] a guard that DECLARES a brain, outside an enrolled clone',
    () => {
      /**
       * .what = every surface applies a declared brain — onBoot above all, since the entry
       *         marker lives on DISK and a fresh session would otherwise never switch
       * .why = drop any one surface's dispatch and exactly one row goes red
       *        (`rule.require.clamp-edge-cases`)
       *
       * .note = the tempdir carries no `node_modules/.bin/rhx`, so the spawn errors and the
       *         cause is `unreadable-clone` (not the exit-2 `unenrolled` of case20b) — a
       *         HALT either way, the one whose silence the wish forbids
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case20', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );

        return { tempDir };
      });

      const SURFACES = [
        { name: 'the onStop hook', when: 'hook.onStop' as const },
        { name: 'the onBoot hook', when: 'hook.onBoot' as const },
        { name: 'direct mode', when: undefined },
      ];

      SURFACES.forEach((surface, index) => {
        when(`[t${index}] ${surface.name} renders the drive`, () => {
          const result = useThen('returns the drive', async () =>
            stepRouteDrive({ route: scene.tempDir, when: surface.when }),
          );

          then('the halt names the brain it could not apply', () => {
            // .why = rule.require.errors-name-the-fix. a halt that reports a failure and
            //        never says WHICH prescription failed leaves the reader to go find it
            expect(result.emit?.stdout).toContain('opus');
          });

          then('the halt names its cause, never a fused null', () => {
            // 🔴 .why = the causes each name a DIFFERENT fix. a halt that reported only
            //          "it did not happen" would send an unenrolled driver and a broken
            //          instrument down the same path (`rule.forbid.failhide`)
            expect(result.emit?.stdout).toContain('the clone probe');
          });

          then('the drive body does NOT survive beneath it', () => {
            // 🔴 .why = the halt REPLACES, where the parse advisory prepends. an unswitched
            //          stone must never read as a switched one, so the stone's own prose —
            //          and its `--as passed` invitation — may not sit below a halt that
            //          says the prescription was refused (case=8 [t2])
            expect(result.emit?.stdout).not.toContain('--as passed');
          });

          then('the exact bytes a driver reads on this surface', () => {
            expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
              `case20.t${index}.${surface.when ?? 'direct'}`,
            );
          });
        });
      });
    },
  );

  given(
    '[case20b] a guard that DECLARES a brain, with a real rhx that reports UNENROLLED',
    () => {
      /**
       * .what = the TRUE `unenrolled` cause (the wish's case=2): `rhx` is present, runs, and
       *         `clone whoami` exits 2 — where case20's binary is absent
       * .why = pinned with a REAL spawn of a shim `rhx` that exits 2, so `getCloneAddress`
       *        reads a real exit code. the `rhx enroll` remedy parts this halt from case20's,
       *        so a wrong cause goes red (`rule.require.clamp-edge-cases`)
       *
       * .note = a shim executable is a FIXTURE, not a mock: only the exit code is controlled
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case20b', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );

        // a real rhx shim that exits 2 — the exit code a genuine `clone whoami` returns
        // when the process is NOT an enrolled clone (F-a). placed where setStoneBrain
        // anchors its binary: `path.join(repoRoot, 'node_modules', '.bin', 'rhx')`.
        const binDir = path.join(tempDir, 'node_modules', '.bin');
        await fs.mkdir(binDir, { recursive: true });
        const shim = path.join(binDir, 'rhx');
        await fs.writeFile(shim, '#!/bin/sh\nexit 2\n');
        await fs.chmod(shim, 0o755);

        return { tempDir };
      });

      const SURFACES = [
        { name: 'the onStop hook', when: 'hook.onStop' as const },
        { name: 'the onBoot hook', when: 'hook.onBoot' as const },
        { name: 'direct mode', when: undefined },
      ];

      SURFACES.forEach((surface, index) => {
        when(`[t${index}] ${surface.name} renders the drive`, () => {
          const result = useThen('returns the drive', async () =>
            stepRouteDrive({ route: scene.tempDir, when: surface.when }),
          );

          then('the halt names the brain it could not apply', () => {
            expect(result.emit?.stdout).toContain('opus');
          });

          then(
            'the halt names the UNENROLLED cause and its `rhx enroll` fix',
            () => {
              // 🔴 .why = the unenrolled remedy is `rhx enroll`, NOT `rhx clone whoami` (the
              //          unreadable-clone remedy case20 hits). the exit-2 → `unenrolled`
              //          branch of getCloneAddress is what selects it, so this asserts the
              //          real spawn reached that branch (rule.require.errors-name-the-fix)
              expect(result.emit?.stdout).toContain('rhx enroll');
              expect(result.emit?.stdout).toContain('not an enrolled clone');
            },
          );

          then('the drive body does NOT survive beneath the halt', () => {
            expect(result.emit?.stdout).not.toContain('--as passed');
          });

          then('the exact bytes a driver reads on this surface', () => {
            expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
              `case20b.t${index}.${surface.when ?? 'direct'}`,
            );
          });
        });
      });
    },
  );

  given(
    '[case20c] a 3-stone route — sticky brain across stones (F6, case=7)',
    () => {
      /**
       * .what = F6 stickiness as built (case=7): a dispatched brain is never reverted
       *   - a later BRAINLESS stone inherits — no switch, and an ATTRIBUTION line names the
       *     brain and the stone that set it (the STICKY half)
       *   - a later stone with a DIFFERENT brain dispatches its own (the CHANGE half)
       * .why = F6 is an open wisher fulcrum; this gives the council a concrete contract to
       *        break on purpose, not an untested default (`rule.require.clamp-edge-cases`)
       *
       * 🔴 .note = the STICKY half asserts PRESENCE: an absence assert passes identically
       *           whether the drive attributes the brain or says naught, so it cannot part
       *           case=7 (owes this line) from case=10 (owes silence)
       * .note = no live clone, so the CHANGE half shows as a halt that names `sonnet`
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case20c', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        // stone 1 declares opus, stone 2 declares NO brain, stone 3 declares sonnet
        await fs.writeFile(path.join(tempDir, '1.stone'), '# stone: one');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.writeFile(path.join(tempDir, '2.stone'), '# stone: two');
        await fs.writeFile(
          path.join(tempDir, '2.guard'),
          ['artifacts:', '  - $route/2.i*.md', ''].join('\n'),
        );
        await fs.writeFile(path.join(tempDir, '3.stone'), '# stone: three');
        await fs.writeFile(
          path.join(tempDir, '3.guard'),
          ['brain: sonnet', 'artifacts:', '  - $route/3.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        return { tempDir };
      });

      // seed passage.jsonl so a chosen stone becomes the current (next-unpassed) one
      const passStones = async (route: string, passed: string[]) =>
        fs.writeFile(
          path.join(route, '.route', 'passage.jsonl'),
          passed
            .map((stone) => JSON.stringify({ stone, status: 'passed' }))
            .join('\n') + '\n',
        );

      when('[t0] stone 1 passed → the brainless stone 2 is current', () => {
        /**
         * .note = the record is SEEDED, in the exact shape the `requested` arm writes: with
         *         no live clone, a real walk halts `undispatched` and (by design) writes none
         * 🟡 .note = this grades the RENDER only. that the record SURVIVES passage is
         *           clamped in `drive/delDriveBlockerState.integration.test.ts`
         */
        const result = useThen('drives stone 2', async () => {
          await passStones(scene.tempDir, ['1']);
          await fs.writeFile(
            path.join(scene.tempDir, '.route', '.drive.blockers.latest.json'),
            JSON.stringify({
              count: 0,
              stone: '1',
              brain: { slug: 'opus', stone: '1' },
            }),
          );
          return stepRouteDrive({ route: scene.tempDir });
        });

        then('the inherited brain is NAMED, never silently carried', () => {
          // .why = case=7 [t3]: "why is this stone expensive" is answered by this line,
          //        which also parts case=7 from case=10
          expect(result.emit?.stdout).toContain('brain = opus');
        });

        then(
          'it is a LINE in `where do we go?`, never a section above it',
          () => {
            // .why = the bucket answers "what is live right now?"; a provenance section
            //        above the drive answers another question, so none may render
            const stdout = result.emit?.stdout ?? '';
            expect(stdout).not.toContain('⟨inherited — unconfirmed⟩');
            expect(stdout).not.toContain('last set by');
            expect(stdout.indexOf('stone = 2')).toBeLessThan(
              stdout.indexOf('brain = opus'),
            );
          },
        );

        then('it is an ATTRIBUTION, never a fresh switch', () => {
          // the sticky half: a brainless stone dispatches naught, so no halt renders and
          // the live brain is left exactly as stone 1 set it. the line above REPORTS the
          // carry-forward; it must never read as a switch this stone performed
          expect(result.emit?.stdout).not.toContain(
            'brain switch could not land',
          );
          expect(result.emit?.stdout).not.toContain('sonnet');
        });

        then('the stone-two guidance renders normally', () => {
          expect(result.emit?.stdout).toContain('--as passed');
        });

        // the `toContain` rows prove the words; the snapshot proves the SHAPE — where the
        // attribution sits, and that the drive body survives whole beneath it
        then('t0 stdout matches the brainless-inherit snapshot', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case20c.t0.brainless-inherits',
          );
        });
      });

      when('[t1] stones 1+2 passed → the sonnet stone 3 is current', () => {
        const result = useThen('drives stone 3', async () => {
          await passStones(scene.tempDir, ['1', '2']);
          return stepRouteDrive({ route: scene.tempDir });
        });

        then('a DIFFERENT declared brain re-dispatches its OWN brain', () => {
          // the change half: stone 3 declares `sonnet`, so a switch to sonnet is attempted
          // (and halts unenrolled/unreadable, naming the new brain — never the prior opus)
          expect(result.emit?.stdout).toContain('sonnet');
          expect(result.emit?.stdout).toContain('brain switch could not land');
          expect(result.emit?.stdout).not.toContain('opus');
        });

        // the CHANGE half, pinned as composed — the trio above proves the new brain is
        // named and the prior one is not; the snapshot proves the halt reads as a whole
        // to the human parked at stone 3
        then('t1 stdout matches the brain-change snapshot', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case20c.t1.brain-changes',
          );
        });
      });
    },
  );

  given('[case20d] a route where NO stone declares a brain (case=10)', () => {
    /**
     * .what = case=10: a route with no `brain:` key anywhere — every extant route — reads
     *         byte-identical to before this feature (case20c is case=7, on its own route)
     *
     * 🟡 .note = a record is seeded on a route that could never write one, on purpose: the
     *           per-ROUTE gate must return BEFORE the state read, so any render at all
     *           proves the gate fired too late
     */
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case20d', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(path.join(tempDir, '1.stone'), '# stone: one');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.writeFile(path.join(tempDir, '2.stone'), '# stone: two');
      await fs.writeFile(
        path.join(tempDir, '2.guard'),
        ['artifacts:', '  - $route/2.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'passed' }) + '\n',
      );
      await fs.writeFile(
        path.join(tempDir, '.route', '.drive.blockers.latest.json'),
        JSON.stringify({
          count: 0,
          stone: '1',
          brain: { slug: 'opus', stone: '1' },
        }),
      );
      return { tempDir };
    });

    when('[t0] the brainless stone 2 is driven', () => {
      const result = useThen('drives stone 2', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('it says NO word about a brain, at all', () => {
        expect(result.emit?.stdout).not.toContain('brain');
        expect(result.emit?.stdout).not.toContain('opus');
        expect(result.emit?.stdout).not.toContain('inherited');
        expect(result.emit?.stdout).not.toContain('prescribed');
      });

      then('the stone-two guidance renders normally', () => {
        expect(result.emit?.stdout).toContain('--as passed');
      });

      // the snapshot is the real clamp here — the four `not.toContain` rows above prove
      // four words are absent, and only this proves no LINE was added anywhere. a future
      // build that renders a blank row, an extra rule, or a shifted indent on this path
      // goes red here and nowhere else
      then('t0 stdout matches the untouched-drive snapshot', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case20d.t0.no-brain-anywhere',
        );
      });
    });
  });

  // 🔴 clamp: the hard-stop gate composes the prescribed brain + advisory onto a
  //    MALFUNCTION halt, for the halted stone. before the gate fix, it returned the
  //    malfunction message alone — a declared `brain:` never reached the human parked
  //    at the broken stone. this goes red (no 'opus') before the fix, green after.
  given('[case21] a malfunction stone that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case21', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'malfunction' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop hits the malfunction gate', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the malfunction still escalates (exit 1)', () => {
        expect(result.emit?.stderr?.code).toEqual(1);
      });

      then('the prescribed brain reaches the human at the broken stone', () => {
        expect(result.emit?.stdout).toContain('opus');
      });

      then('the malfunction message is NOT hidden by the brain surface', () => {
        // 🔴 the brain halt STACKS above the malfunction halt (whenUndispatched:
        //    'prepend'), so both problems stay visible
        expect(result.emit?.stdout).toContain('malfunction');
      });

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case21.t0.onstop',
        );
      });
    });
  });

  // 🔴 clamp: the hard-stop gate composes the prescribed brain onto a DRIVER-WALL halt
  //    too. before the fix, the wall message alone reached the human.
  given('[case22] a driver-wall stone that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case22', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1', status: 'blocked' }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop hits the driver-wall gate', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the wall still allows a graceful stop (no exit stderr)', () => {
        expect(result.emit?.stderr).toBeUndefined();
      });

      then('the prescribed brain reaches the human at the walled stone', () => {
        expect(result.emit?.stdout).toContain('opus');
      });

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case22.t0.onstop',
        );
      });
    });
  });

  // 🔴 clamp: a stone that halts straight to EXHAUSTED with a declared brain marks its
  //    entry, so a later tick does not re-dispatch the brain (a subprocess spawn) on
  //    every hook. before setDriveEntryStone, the exhausted path computed the brain but
  //    never wrote the marker, so `entered` stayed true and it re-dispatched forever.
  given('[case23] an exhausted stone that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case23', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'exhausted',
          reason: 'peer reviewer budget exhausted: limited',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop enters the exhausted stone', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the prescribed brain reaches the driver', () => {
        expect(result.emit?.stdout).toContain('opus');
      });

      then('the exhausted prompt is NOT hidden by the brain surface', () => {
        // 🔴 an undispatched brain STACKS above a halt, never REPLACES it: the exhausted
        //    prompt is a message the human must act on
        expect(result.emit?.stdout).toContain('exhausted');
      });

      then(
        'the entry is NOT marked on a FAILED dispatch, so a later tick RETRIES',
        async () => {
          // 🔴 a FAILED switch (no `rhx` here) must NOT burn the entry marker, else the next
          //    onStop tick goes silent — "fail loud once, then no-op". the marker stays null
          //    so the next tick retries; a `requested` dispatch marks (applyStoneBrainOnEntry.test.ts)
          const state = await getDriveBlockerState({ route: scene.tempDir });
          expect(state.stone).toEqual(null);
        },
      );

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case23.t0.onstop',
        );
      });
    });
  });

  // 🔴 clamp: a RESUMED session that BOOTS onto a halted stone whose entry marker is
  //    already written must STILL apply the prescribed brain (F7, at the hard-stop gate).
  //    an onBoot gated on entry goes red here (no 'opus')
  given(
    '[case24] a resumed onBoot at a malfunction stone with the marker set',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case24', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1', status: 'malfunction' }) + '\n',
        );
        // the PRIOR session already entered stone 1 and wrote the marker to disk
        await fs.writeFile(
          path.join(tempDir, '.route', '.drive.blockers.latest.json'),
          JSON.stringify({ count: 0, stone: '1' }, null, 2),
        );
        return { tempDir };
      });

      when('[t0] a fresh session boots onto the still-halted stone', () => {
        const result = useThen('returns the halt', async () =>
          stepRouteDrive({ route: scene.tempDir, when: 'hook.onBoot' }),
        );

        then(
          'the prescribed brain is STILL applied, despite the marker',
          () => {
            // 🔴 the resumed-session gap: `entered === false` here, so an entry-gated
            //    dispatch would skip. onBoot must dispatch unconditionally (F7).
            expect(result.emit?.stdout).toContain('opus');
          },
        );

        then('onBoot does not block session start (no exit stderr)', () => {
          expect(result.emit?.stderr).toBeUndefined();
        });

        then('the exact composed bytes a resumed driver reads', () => {
          // .why = pins the hard-stop GATE's composition on onBoot (brain halt above the
          //        malfunction tree); the asserts above miss a reorder or dropped separator
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case24.t0.onboot',
          );
        });
      });
    },
  );

  // 🔴 clamp: the WORK path (push-forward guidance, with its `--as passed` invitation)
  //    must REPLACE, not stack, when the brain is undispatched — an unswitched stone may
  //    never read as ready (case=8 [t2]). the counter-clamp to case23
  given('[case25] a push-forward stone that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case25', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // an agent-fixable blocker → the disposition PUSHES forward → work-prose guidance
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'blocked',
          blocker: 'review.self',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop pushes forward with an undispatched brain', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the prescribed brain reaches the driver', () => {
        expect(result.emit?.stdout).toContain('opus');
      });

      then('the work invitation is REPLACED (unswitched ≠ ready)', () => {
        // 🔴 case=8 [t2]: an unswitched stone must not read as ready-to-pass. on the
        //    work path the brain halt REPLACES the drive body, so the `--as passed`
        //    invitation does not survive beneath it.
        expect(result.emit?.stdout).not.toContain('--as passed');
      });

      then('the stop is still blocked (exit code 2)', () => {
        expect(result.emit?.stderr?.code).toEqual(2);
      });

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case25.t0.onstop',
        );
      });

      then('the exact bytes of the code-2 push-block stderr reason', () => {
        // .why = stderr is a second surface a consumer READS; pinned by byte, since a
        //        `code` equality misses a reword
        // 🟡 .note = this pin CERTIFIES A KNOWN DIVERGENCE: stdout REPLACES the body (no
        //           `--as passed`) while this reason is the raw body (`--as passed` kept), so
        //           a harness that renders it reads an unswitched stone as ready. deferred:
        //           `.dream/v2026_09_18.fix.the-push-stderr-bypasses-the-brain-halt.md`
        expect(
          asStableDriveStdout(result.emit?.stderr?.reason),
        ).toMatchSnapshot('case25.t0.onstop.stderr');
      });
    });
  });

  // 🔴 clamp: the getRouteDriveBlockerMessage HALT path (approval-needed) crossed with an
  //    undispatched brain. the approval prompt is a message the human must act on, so the
  //    brain halt STACKS above it — red (no 'human approval') if the call site drops `'halt'`
  given('[case26] an approval-blocked stone that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case26', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // blocked on human approval → getRouteDriveBlockerMessage returns the
      // approval-needed prompt (blocksStop: false), the HALT path
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'blocked',
          blocker: 'approval',
        }) + '\n',
      );
      return { tempDir };
    });

    when('[t0] onStop hits the approval blocker-message path', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the prescribed brain reaches the driver', () => {
        expect(result.emit?.stdout).toContain('opus');
      });

      then('the approval prompt is NOT hidden by the brain surface', () => {
        // 🔴 the blocker-message HALT path stacks too: 'human approval required' survives
        expect(result.emit?.stdout).toContain('human approval');
      });

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case26.t0.onstop',
        );
      });
    });
  });

  // 🔴 clamp: the onStop 21-block STUCK-CUTOFF return (exit 1) crossed with a declared
  //    brain. the route is stuck and a human is escalated — the moment the brain matters
  //    most. red (no 'opus') without the asStopped wrap
  given('[case27] a stuck-route stone (count>21) that DECLARES a brain', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case27', git: true });
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild it.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- it works',
      );
      await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
      await fs.writeFile(
        path.join(tempDir, '1.guard'),
        ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      // an agent-fixable blocker (review.self) → the disposition PUSHES forward (not the
      // driver-wall gate), so onStop reaches the count check; the seeded count exceeds the
      // 21 cutoff, so it hits the stuck-route malfunction return (case6's push shape)
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({
          stone: '1',
          status: 'blocked',
          blocker: 'review.self',
        }) + '\n',
      );
      // seed the block count above the 21 cutoff, on a DIFFERENT stone so the entry
      // marker does not suppress the count (setDriveBlockerState will increment to 23)
      await fs.writeFile(
        path.join(tempDir, '.route', '.drive.blockers.latest.json'),
        JSON.stringify({ count: 22, stone: '0' }, null, 2),
      );
      return { tempDir };
    });

    when('[t0] onStop hits the stuck-route cutoff', () => {
      const result = useThen('returns the halt', async () =>
        stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
      );

      then('the route is escalated as stuck (exit 1)', () => {
        expect(result.emit?.stderr?.code).toEqual(1);
      });

      then(
        'the prescribed brain STILL reaches the human at the stuck stone',
        () => {
          expect(result.emit?.stdout).toContain('opus');
        },
      );

      then('the stuck-route message is NOT hidden by the brain surface', () => {
        expect(result.emit?.stdout).toContain('stuck');
      });

      then('the exact bytes a driver reads', () => {
        expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
          'case27.t0.onstop',
        );
      });

      then('the exact bytes of the code-1 stuck escalate stderr reason', () => {
        // .why = the third stderr surface, beside case25 (code 2) and case29 (code 1); a
        //        reword ships green under the `toEqual(1)` above
        expect(
          asStableDriveStdout(result.emit?.stderr?.reason),
        ).toMatchSnapshot('case27.t0.onstop.stderr');
      });
    });
  });

  given(
    '[case28] a guard with a dropped key ALONGSIDE a brain that fails to dispatch',
    () => {
      /**
       * .why = the most likely place for a guard-warn prepend to REGROW: the halt is the arm
       *        that renders through `formatStoneBrainOutcome`'s `prepend` mode
       *
       * .note = case18's dropped alias (`model:`) plus case20's undispatched `brain: opus`,
       *         in one guard; no `rhx` in the tempdir, so the outcome halts hermetically
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case28', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          [
            'model: claude-opus-5[1m]',
            'brain: opus',
            'artifacts:',
            '  - $route/1.i*.md',
            '',
          ].join('\n'),
        );

        return { tempDir };
      });

      const SURFACES = [
        { name: 'the onStop hook', when: 'hook.onStop' as const },
        { name: 'the onBoot hook', when: 'hook.onBoot' as const },
        { name: 'direct mode', when: undefined },
      ];

      SURFACES.forEach((surface, index) => {
        when(`[t${index}] ${surface.name} renders the drive`, () => {
          const result = useThen('returns the drive', async () =>
            stepRouteDrive({ route: scene.tempDir, when: surface.when }),
          );

          then('NO advisory prepends the halt', () => {
            // 🔴 .why this is the sharpest place to assert it = the halt is the one arm
            //    that renders through `formatStoneBrainOutcome`'s `prepend` mode, so a
            //    guard-warn prepend re-introduced anywhere would compose HERE first
            expect(result.emit?.stdout).not.toContain('🗿 guard:');
            expect(result.emit?.stdout).not.toContain(
              'reads as an alias of `brain:`',
            );
          });

          then('the undispatched-brain halt reaches the human', () => {
            expect(result.emit?.stdout).toContain('opus');
            expect(result.emit?.stdout).toContain('the clone probe');
          });

          then(
            'the halt is the WHOLE output — it replaces the drive body',
            () => {
              // 🔴 .why = case20's own invariant, now proven to hold on a guard that ALSO
              //          carries a dropped key. the halt replaces, and no block rides above
              // .note = the halt is a branch of the drive's own tree (`S13`), so it opens
              //         with the owl and the root — never with an advisory above them
              expect(result.emit?.stdout).not.toContain('--as passed');
              expect(result.emit?.stdout ?? '').toMatch(
                /^🦉 where were we\?\n\n🗿 route\.drive\n/,
              );
            },
          );

          then(
            'the exact composed bytes a driver reads on this surface',
            () => {
              expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
                `case28.t${index}.${surface.when ?? 'direct'}`,
              );
            },
          );
        });
      });
    },
  );

  given(
    '[case29] a MIXED halt (malfunction + budget exhausted) that DECLARES a brain',
    () => {
      /**
       * .what = a brain halt stacked on the MIXED malfunction arm (`formatRouteDriveMixedHalt`)
       * .why = case21 pins only the bare arm; the mixed arm is a byte-distinct composition
       *        (`rule.require.contract-snapshot-exhaustiveness`)
       *
       * .note = case21's scene, plus 'budget exhausted' in the persisted reason, which selects
       *         the mixed arm; no `rhx` in the tempdir, so the brain outcome is `undispatched`
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case29', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        // a malfunction whose reason ALSO names an exhaustion → the MIXED arm
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1',
            status: 'malfunction',
            reason:
              'reviewer malfunctioned; peer reviewer budget exhausted: limited',
          }) + '\n',
        );
        return { tempDir };
      });

      when('[t0] onStop hits the MIXED malfunction gate', () => {
        const result = useThen('returns the halt', async () =>
          stepRouteDrive({ route: scene.tempDir, when: 'hook.onStop' }),
        );

        then('the malfunction still escalates (exit 1)', () => {
          expect(result.emit?.stderr?.code).toEqual(1);
        });

        then(
          'the prescribed brain reaches the human at the broken stone',
          () => {
            expect(result.emit?.stdout).toContain('opus');
          },
        );

        then(
          'the malfunction reason survives beneath the brain surface',
          () => {
            expect(result.emit?.stdout).toContain('malfunction');
          },
        );

        then('the EXHAUSTION guidance survives too — the MIXED arm', () => {
          // 🔴 .why = this is what parts the mixed arm from the bare one. a driver at a
          //          stone that malfunctioned AND ran a level dry needs both remedies;
          //          the bare `formatRouteDriveMalfunction` carries only the first
          expect(result.emit?.stdout).toContain('exhausted');
        });

        then('the exact composed bytes a driver reads', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case29.t0.onstop',
          );
        });

        then('the exact bytes of the code-1 stderr reason', () => {
          // .why = only here do stderr (the MALFUNCTION reason) and stdout (the mixed tree)
          //          diverge; a reword of the reason would ship green under the `code` assert
          expect(
            asStableDriveStdout(result.emit?.stderr?.reason),
          ).toMatchSnapshot('case29.t0.onstop.stderr');
        });
      });
    },
  );

  /**
   * .what = the halt-STACK composition, pinned on onBoot and direct
   * .why = each call site passes its own `'halt'` kind; a site that drops it flips stack →
   *        replace and loses the drive body, while every `toContain` stays green
   *
   * .note = onStop is pinned by case23/22
   */
  const HALT_SURFACES_UNPINNED = [
    { name: 'the onBoot hook', when: 'hook.onBoot' as const, tag: 'onboot' },
    { name: 'direct mode', when: undefined, tag: 'direct' },
  ];

  given(
    '[case30] an EXHAUSTED stone that DECLARES a brain, at onBoot and direct',
    () => {
      /**
       * .what = case23's scene, read on the two surfaces case23 does not read.
       * .why = each surface reaches the exhausted prompt by its own branch, with its own
       *        `'halt'` argument; one may drop it unnoticed by the other
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case30', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1',
            status: 'exhausted',
            reason: 'peer reviewer budget exhausted: limited',
          }) + '\n',
        );
        return { tempDir };
      });

      HALT_SURFACES_UNPINNED.forEach((surface, index) => {
        when(`[t${index}] ${surface.name} renders the exhausted halt`, () => {
          const result = useThen('returns the halt', async () =>
            stepRouteDrive({ route: scene.tempDir, when: surface.when }),
          );

          then('the prescribed brain reaches the driver', () => {
            expect(result.emit?.stdout).toContain('opus');
          });

          then(
            'the exhausted prompt SURVIVES beneath the brain surface',
            () => {
              // .why = drop the `'halt'` at this call site and the prompt is replaced: the
              //          human learns the switch failed, never that the budget ran out (case=8)
              expect(result.emit?.stdout).toContain('exhausted');
            },
          );

          then('the exact composed bytes on this surface', () => {
            expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
              `case30.t${index}.${surface.tag}`,
            );
          });
        });
      });
    },
  );

  given(
    '[case31] an APPROVAL-blocked stone that DECLARES a brain, at onBoot and direct',
    () => {
      /**
       * .what = case26's scene, read on the two surfaces case26 does not read.
       * .why = each surface renders `getRouteDriveBlockerMessage` through its own call site;
       *        the approval prompt is the one halt a driver cannot clear alone, so a replace
       *        there leaves the human no next move
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case31', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({
            stone: '1',
            status: 'blocked',
            blocker: 'approval',
          }) + '\n',
        );
        return { tempDir };
      });

      HALT_SURFACES_UNPINNED.forEach((surface, index) => {
        when(`[t${index}] ${surface.name} renders the approval halt`, () => {
          const result = useThen('returns the halt', async () =>
            stepRouteDrive({ route: scene.tempDir, when: surface.when }),
          );

          then('the prescribed brain reaches the driver', () => {
            expect(result.emit?.stdout).toContain('opus');
          });

          then('the approval prompt SURVIVES beneath the brain surface', () => {
            expect(result.emit?.stdout).toContain('human approval');
          });

          then('the exact composed bytes on this surface', () => {
            expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
              `case31.t${index}.${surface.tag}`,
            );
          });
        });
      });
    },
  );

  given(
    '[case32] a DRIVER-WALL stone that DECLARES a brain, in direct mode',
    () => {
      /**
       * .what = case22's scene, read in direct mode.
       * .why = direct mode alone owns a `blocked` arm, so this composed shape has one caller
       *        and no peer surface to disagree with if it drifts
       */
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'drive-int-case32', git: true });
        await fs.writeFile(
          path.join(tempDir, '0.wish.md'),
          '# wish\n\nbuild it.',
        );
        await fs.writeFile(
          path.join(tempDir, '1.stone'),
          '# stone: implement\n\ndone when:\n- it works',
        );
        await fs.writeFile(path.join(tempDir, '1.i1.md'), '# artifact');
        await fs.writeFile(
          path.join(tempDir, '1.guard'),
          ['brain: opus', 'artifacts:', '  - $route/1.i*.md', ''].join('\n'),
        );
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          JSON.stringify({ stone: '1', status: 'blocked' }) + '\n',
        );
        return { tempDir };
      });

      when('[t0] direct mode renders the driver wall', () => {
        const result = useThen('returns the halt', async () =>
          stepRouteDrive({ route: scene.tempDir, when: undefined }),
        );

        then('the prescribed brain reaches the reader', () => {
          expect(result.emit?.stdout).toContain('opus');
        });

        then('the wall SURVIVES beneath the brain surface', () => {
          // 🔴 .why = a driver who consults `rhx route.drive` at a walled stone must read
          //          BOTH facts: the wall a human owns, and the switch that did not land
          expect(result.emit?.stdout).toContain('blocked');
        });

        then('the exact composed bytes on the direct surface', () => {
          expect(asStableDriveStdout(result.emit?.stdout)).toMatchSnapshot(
            'case32.t0.direct',
          );
        });
      });
    },
  );
});
