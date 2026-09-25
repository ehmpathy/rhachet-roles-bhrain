import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { surfaceRouteReminderFault } from './surfaceRouteReminderFault';

/**
 * .what = integration tests for surfaceRouteReminderFault — the benign-fault backstop for the
 *         auto-wire (a non-orphan reminder fault is surfaced, never swallowed).
 * .why = this is the last-resort rule.forbid.failhide guard on the whole auto-sync fault path. its
 *        happy path (write to the watched per-session log) AND its two stderr FLOORS (no clone addr,
 *        and a log-write that itself faults) must each be proven — an unexercised failhide backstop
 *        is exactly the silent-swallow this project forbids.
 */
describe('surfaceRouteReminderFault.integration', () => {
  // the fault backstop keys the per-session log on RHACHET_CLONE_SERIAL; guard it so a set/unset in
  // one case never leaks into another.
  const priorSerial = process.env.RHACHET_CLONE_SERIAL;
  afterEach(() => {
    if (priorSerial === undefined) delete process.env.RHACHET_CLONE_SERIAL;
    else process.env.RHACHET_CLONE_SERIAL = priorSerial;
  });

  given('[case1] an enrolled session whose per-session log is writable', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'surface-fault-case1', git: false });
      // the log sits in `.route/`; create it so the append succeeds (the happy path)
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      return { tempDir };
    });

    when('[t0] a benign fault is surfaced', () => {
      then(
        'the fault line is appended to the WATCHED per-session reminder log',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-surface-1';
          await surfaceRouteReminderFault({
            route: scene.tempDir,
            error: new Error('spawn EACCES (benign)'),
          });

          const logPath = getRouteReminderLogPath({
            route: scene.tempDir,
            // getRouteDriverCloneAddr auto-prefixes the raw env serial with '@:' — match that
            // here so the log path this test reads is the SAME path surfaceRouteReminderFault wrote
            cloneAddr: '@:clone-surface-1',
          });
          const logText = await fs.readFile(logPath, 'utf-8');
          expect(logText).toContain('RouteReminder auto-sync fault');
          expect(logText).toContain('spawn EACCES (benign)');
        },
      );
    });
  });

  given('[case2] a plain (non-enrolled) session — no clone address', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'surface-fault-case2', git: false });
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      return { tempDir };
    });

    when('[t0] a fault is surfaced with no RHACHET_CLONE_SERIAL', () => {
      then('it falls to the stderr floor (no per-session log)', async () => {
        delete process.env.RHACHET_CLONE_SERIAL;
        // a real collector function, not a jest mock of the console global
        // (rule.forbid.integration.mocks) — surfaceRouteReminderFault takes an
        // injectable `stderr` writer for exactly this purpose.
        const lines: string[] = [];

        await surfaceRouteReminderFault(
          {
            route: scene.tempDir,
            error: new Error('boom with no clone'),
          },
          { stderr: (line) => lines.push(line) },
        );

        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('RouteReminder auto-sync fault');
        expect(lines[0]).toContain('boom with no clone');
      });
    });
  });

  given('[case3] an enrolled session whose log write ITSELF faults', () => {
    // a tempdir with NO `.route/` subdir → the log path's parent is absent, so appendFile faults
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'surface-fault-case3', git: false });
      return { tempDir };
    });

    when('[t0] a fault is surfaced but the log append faults', () => {
      then(
        'it falls to the stderr floor, re-states BOTH faults (never hidden)',
        async () => {
          process.env.RHACHET_CLONE_SERIAL = 'clone-surface-3';
          // a real collector function, not a jest mock of the console global
          // (rule.forbid.integration.mocks).
          const lines: string[] = [];

          await surfaceRouteReminderFault(
            {
              route: scene.tempDir,
              error: new Error('original fault'),
            },
            { stderr: (thisLine) => lines.push(thisLine) },
          );

          expect(lines).toHaveLength(1);
          const line = lines[0] ?? '';
          expect(line).toContain('original fault');
          expect(line).toContain('reminder-log write faulted');
        },
      );
    });
  });
});
