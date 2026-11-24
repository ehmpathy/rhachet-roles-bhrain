import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { surfaceRouteReminderFault } from './surfaceRouteReminderFault';

/**
 * .what = integration tests for surfaceRouteReminderFault — the benign-fault backstop for the
 *         auto-wire (a non-orphan reminder fault is surfaced, never swallowed).
 * .why = this is the last-resort rule.forbid.failhide guard on the whole auto-sync fault path. its
 *        happy path (write to the watched clone log) AND its two stderr FLOORS (no clone addr, and a
 *        log-write that itself faults) must each be proven.
 *
 * .note = each case anchors on an os temp dir (no git repo), so the clone log lands inside it and
 *         never in the repo the test runs from
 */
const genAnchorDir = (slug: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `${slug}-`));

describe('surfaceRouteReminderFault.integration', () => {
  // the fault backstop keys the clone log on RHACHET_CLONE_SERIAL; guard it so a set/unset in one
  // case never leaks into another.
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given('[case1] an enrolled session whose clone log is writable', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: await genAnchorDir('surface-fault-case1'),
    }));

    when('[t0] a benign fault is surfaced', () => {
      then(
        'the fault line is appended to the WATCHED clone reminder log',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-surface-1';
          await surfaceRouteReminderFault({
            from: scene.tempDir,
            error: new Error('spawn EACCES (benign)'),
          });

          const logPath = getRouteReminderLogPath({
            repoRoot: scene.tempDir,
            // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:' — match that
            // here so the log path this test reads is the SAME path surfaceRouteReminderFault wrote
            cloneAddr: '@:clone-surface-1',
          });
          const logText = await fs.readFile(logPath, 'utf-8');
          expect(logText).toContain('RouteReminder auto-sync fault');
          expect(logText).toContain('spawn EACCES (benign)');
          expect(logText).toMatchSnapshot();
        },
      );
    });
  });

  given('[case2] a plain (non-enrolled) session — no clone address', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: await genAnchorDir('surface-fault-case2'),
    }));

    when('[t0] a fault is surfaced with no RHACHET_CLONE_SERIAL', () => {
      then('it falls to the stderr floor (no clone log)', async () => {
        delete process.env.RHACHET_CLONE_SERIAL;
        // a real collector function, not a jest mock of the console global
        // (rule.forbid.integration.mocks)
        const lines: string[] = [];

        await surfaceRouteReminderFault(
          {
            from: scene.tempDir,
            error: new Error('boom with no clone'),
          },
          { stderr: (line) => lines.push(line) },
        );

        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('RouteReminder auto-sync fault');
        expect(lines[0]).toContain('boom with no clone');
        expect(lines[0]).toMatchSnapshot();
      });
    });
  });

  given('[case3] an enrolled session whose log write ITSELF faults', () => {
    // a regular FILE where the `.agent/` dir must go → the clone handle dir cannot be made, so the
    // log write faults (ENOTDIR, a tolerated io errno)
    const scene = useBeforeAll(async () => {
      const tempDir = await genAnchorDir('surface-fault-case3');
      await fs.writeFile(
        path.join(tempDir, '.agent'),
        'i am a file, not a dir',
      );
      return { tempDir };
    });

    when('[t0] a fault is surfaced but the log append faults', () => {
      then(
        'it falls to the stderr floor, re-states BOTH faults (never hidden)',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-surface-3';
          const lines: string[] = [];

          await surfaceRouteReminderFault(
            {
              from: scene.tempDir,
              error: new Error('original fault'),
            },
            { stderr: (thisLine) => lines.push(thisLine) },
          );

          expect(lines).toHaveLength(1);
          const line = lines[0] ?? '';
          expect(line).toContain('original fault');
          expect(line).toContain('reminder-log write faulted');
          // the errno detail names the temp anchor; mask it so the frame pins only stable bytes
          expect(line.split(scene.tempDir).join('<anchor>')).toMatchSnapshot();
        },
      );
    });
  });

  // the second shape of a log write that faults: the clone home exists, but it is read-only
  // (EACCES), so the append itself is refused rather than the dir that holds it
  given('[case3b] an enrolled session whose clone home is read-only', () => {
    const scene = useBeforeAll(async () => {
      // root ignores file modes, so this fixture cannot fault under it; fail loud, never pass hollow
      if (process.getuid?.() === 0)
        throw new Error('case3b needs a non-root uid: root ignores file modes');
      const tempDir = await genAnchorDir('surface-fault-case3b');
      const logPath = getRouteReminderLogPath({
        repoRoot: tempDir,
        cloneAddr: '@:clone-surface-3b',
      });
      await fs.mkdir(path.dirname(logPath), { recursive: true });
      await fs.chmod(path.dirname(logPath), 0o500);
      return { tempDir, logDir: path.dirname(logPath) };
    });
    afterAll(async () => {
      await fs.chmod(scene.logDir, 0o700);
    });

    when('[t0] a benign fault is surfaced', () => {
      then(
        'it falls to the stderr floor, re-states BOTH faults (never hidden)',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-surface-3b';
          const lines: string[] = [];

          await surfaceRouteReminderFault(
            {
              from: scene.tempDir,
              error: new Error('original fault'),
            },
            { stderr: (thisLine) => lines.push(thisLine) },
          );

          expect(lines).toHaveLength(1);
          const line = lines[0] ?? '';
          expect(line).toContain('original fault');
          expect(line).toContain('reminder-log write faulted');
          expect(line).toContain('EACCES');
        },
      );
    });
  });
});
