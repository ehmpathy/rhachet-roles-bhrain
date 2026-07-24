import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { stepRouteDrive } from './stepRouteDrive';
import { setStoneAsPromised } from './stones/setStoneAsPromised';

/**
 * .what = masks the volatile tempdir (timestamp + hash) in drive output
 * .why = a route path carries a per-run tempdir; mask it so the drive-output
 *        snapshots stay stable across runs while the slug stays visible
 */
const asStableDriveStdout = (stdout: string | undefined): string | undefined =>
  stdout?.replace(
    // /g: the volatile temp-dir can appear more than once (e.g. a driver-wall
    // block prints it in both `route = ...` and the blocker `reason:` path) — mask
    // every occurrence, else a real timestamp+hash bakes into the snapshot and flakes
    /\.temp\/genTempDir\.symlink\/[\dT.-]+Z\.([^.]+)\.[a-f0-9]+/g,
    '.temp/genTempDir.symlink/<ts>.$1.<hash>',
  );

/**
 * .what = integration tests for stepRouteDrive
 * .why = verifies GPS-like guidance with real filesystem
 *
 * .note = tests pass route param directly to avoid bind conflicts
 *         (all tests run in same git repo context)
 */
describe('stepRouteDrive.integration', () => {
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

      then('stdout prompts the human to approve or extend the budget', () => {
        expect(result.emit?.stdout).toContain('budget');
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
});
