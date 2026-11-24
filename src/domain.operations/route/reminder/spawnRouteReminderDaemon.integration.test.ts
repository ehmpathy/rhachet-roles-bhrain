import type { ChildProcess, spawn as spawnChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getRouteReminderLogPath } from './getRouteReminderLogPath';
import { spawnRouteReminderDaemon } from './spawnRouteReminderDaemon';

/**
 * .what = clamps the detachment contract of the daemon host spawn — IN CODE, not a fixture
 * .why = the review's blocker was that `detached:true` + `stdio:ignore/log` + `.unref()` lived only
 *        in a test fixture, so a real host could omit them and silently defeat the "external
 *        self-exit daemon" premise. these now live in spawnRouteReminderDaemon; this test injects a
 *        recorder spawn and asserts every flag, so a regression that drops detachment flips red.
 */

// a recorder that captures how spawn was called + whether unref ran; it hands back a fake child.
// the fake child is a real EventEmitter so a test can emit the async `'error'` event — an emit
// of `'error'` on an EventEmitter with ZERO listeners THROWS, so a quiet `emitError` (no throw)
// IS the proof that the host attached an `'error'` listener (the clamp for the async-crash blocker).
const genSpawnRecorder = (): {
  spawn: typeof spawnChildProcess;
  calls: { command: string; args: readonly string[]; options: unknown }[];
  wasUnrefCalled: () => boolean;
  emitError: (error: Error) => void;
} => {
  const calls: {
    command: string;
    args: readonly string[];
    options: unknown;
  }[] = [];
  let unrefCalled = false;
  // a minimal ChildProcess stand-in built on an EventEmitter: pid + unref are read by the host
  // boundary, and `.on('error', ...)` / `.emit('error', ...)` come from the emitter. one
  // documented boundary cast builds the test double; the prod code never casts.
  const fakeChild = Object.assign(new EventEmitter(), {
    pid: 424242,
    unref: () => {
      unrefCalled = true;
    },
  }) as unknown as ChildProcess;
  const spawn = ((
    command: string,
    args: readonly string[],
    options: unknown,
  ): ChildProcess => {
    calls.push({ command, args, options });
    return fakeChild;
  }) as unknown as typeof spawnChildProcess;
  return {
    spawn,
    calls,
    wasUnrefCalled: () => unrefCalled,
    emitError: (error: Error) => {
      (fakeChild as unknown as EventEmitter).emit('error', error);
    },
  };
};

describe('spawnRouteReminderDaemon.integration', () => {
  given('[case1] a clone anchor dir and an injected recorder spawn', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-spawn-'),
      );
      const recorder = genSpawnRecorder();
      const result = await spawnRouteReminderDaemon(
        {
          repoRoot,
          cloneAddr: '@:driver-1',
          intervalMs: 1200000,
          sayTimeoutMs: 30000,
        },
        { spawn: recorder.spawn },
      );
      return { repoRoot, recorder, result };
    });

    when('[t0] the daemon is spawned', () => {
      then('it hands back the spawned pid', () => {
        expect(scene.result.pid).toBe(424242);
      });

      then('the command is the current node binary', () => {
        expect(scene.recorder.calls).toHaveLength(1);
        expect(scene.recorder.calls[0]?.command).toBe(process.execPath);
      });

      then(
        'the daemon args carry repo-root + clone-addr + interval + say-timeout, and no route',
        () => {
          const args = scene.recorder.calls[0]?.args ?? [];
          expect(args).not.toContain('--route');
          expect(args).toContain('--repo-root');
          expect(args).toContain(scene.repoRoot);
          expect(args).toContain('--clone-addr');
          expect(args).toContain('@:driver-1');
          expect(args).toContain('--interval-ms');
          expect(args).toContain('1200000');
          expect(args).toContain('--say-timeout-ms');
          expect(args).toContain('30000');
        },
      );

      then('it is spawned DETACHED (survives a parent exit)', () => {
        const options = scene.recorder.calls[0]?.options as {
          detached?: boolean;
        };
        expect(options.detached).toBe(true);
      });

      then(
        'stdout+stderr are redirected to a real log fd (observability)',
        () => {
          const options = scene.recorder.calls[0]?.options as {
            stdio?: [unknown, unknown, unknown];
          };
          // stdin ignored; stdout+stderr go to the SAME numeric log fd
          expect(options.stdio?.[0]).toBe('ignore');
          expect(typeof options.stdio?.[1]).toBe('number');
          expect(options.stdio?.[2]).toBe(options.stdio?.[1]);
        },
      );

      then('the parent unrefs the child (does not wait on it)', () => {
        expect(scene.recorder.wasUnrefCalled()).toBe(true);
      });

      then(
        'the clone daemon log file was created in the clone home, which ignores itself',
        async () => {
          const logPath = getRouteReminderLogPath({
            repoRoot: scene.repoRoot,
            cloneAddr: '@:driver-1',
          });
          const stat = await fs.stat(logPath);
          expect(stat.isFile()).toBe(true);
          const gitignore = await fs.readFile(
            path.join(path.dirname(logPath), '.gitignore'),
            'utf-8',
          );
          expect(gitignore).toEqual('*\n');
        },
      );
    });
  });

  given(
    '[case3] a RELATIVE repo root input + an injected recorder spawn',
    () => {
      // the detached child runs from the git root, so a relative `--repo-root` handed through as-is
      // would be read against the wrong dir: the daemon would find no focus and self-exit while the
      // register reported it live. a relative input must reach the argv in its ABSOLUTE form
      const scene = useBeforeAll(async () => {
        const repoRootAbsolute = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-relroot-'),
        );
        const repoRootRelative = path.relative(process.cwd(), repoRootAbsolute);
        const recorder = genSpawnRecorder();
        await spawnRouteReminderDaemon(
          {
            repoRoot: repoRootRelative,
            cloneAddr: '@:driver-1',
            intervalMs: 1200000,
            sayTimeoutMs: 30000,
          },
          { spawn: recorder.spawn },
        );
        return { repoRootAbsolute, repoRootRelative, recorder };
      });

      when('[t0] the daemon is spawned from the relative repo root', () => {
        then('the daemon argv carries the ABSOLUTE repo root', () => {
          const args = scene.recorder.calls[0]?.args ?? [];
          const rootArg = args[args.indexOf('--repo-root') + 1];
          expect(rootArg).toBe(scene.repoRootAbsolute);
          expect(args).not.toContain(scene.repoRootRelative);
        });

        then(
          'the clone log was created under the ABSOLUTE repo root',
          async () => {
            const logPath = getRouteReminderLogPath({
              repoRoot: scene.repoRootAbsolute,
              cloneAddr: '@:driver-1',
            });
            const stat = await fs.stat(logPath);
            expect(stat.isFile()).toBe(true);
          },
        );
      });
    },
  );

  given(
    '[case2] a spawned daemon that emits a DELAYED async `error` after return',
    () => {
      // a detached child can fire `'error'` asynchronously (EACCES, a platform race, a resource
      // limit) AFTER spawnRouteReminderDaemon has already returned its pid. node throws an uncaught
      // exception that crashes the HOST if that `'error'` has zero listeners. this clamps that the
      // host attaches an `'error'` listener: emit on a listener-less EventEmitter throws, so a quiet
      // emit proves the listener is present. RED before the fix (no listener → emit throws), GREEN
      // after (listener attached → emit is caught + logged loud).
      const scene = useBeforeAll(async () => {
        const route = await fs.mkdtemp(
          path.join(os.tmpdir(), 'reminder-spawnerr-'),
        );
        const recorder = genSpawnRecorder();
        // a real collector function, not a jest mock of the console global
        // (rule.forbid.integration.mocks) — spawnRouteReminderDaemon takes an
        // injectable `stderr` writer for exactly this purpose.
        const lines: string[] = [];
        const result = await spawnRouteReminderDaemon(
          {
            repoRoot: route,
            cloneAddr: '@:driver-1',
            intervalMs: 1200000,
            sayTimeoutMs: 30000,
          },
          { spawn: recorder.spawn, stderr: (line) => lines.push(line) },
        );
        return { route, recorder, result, lines };
      });

      when('[t0] the child emits a delayed `error` event', () => {
        then('it still handed back the spawned pid on return', () => {
          expect(scene.result.pid).toBe(424242);
        });

        then(
          'the host absorbs the async error (a listener is attached — no host crash)',
          () => {
            // proves the `'error'` listener exists (else emit would throw uncaught), and that the
            // fault reaches the real injected stderr writer — a genuine collector, not a spy.
            expect(() =>
              scene.recorder.emitError(new Error('spawn EACCES')),
            ).not.toThrow();
            expect(scene.lines).toHaveLength(1);
            expect(scene.lines[0]).toContain('errored asynchronously');
          },
        );
      });
    },
  );
});
