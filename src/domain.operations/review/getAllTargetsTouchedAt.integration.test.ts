import * as fs from 'fs/promises';
import { BadRequestError, getError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getAllTargetsTouchedAt } from '@src/domain.operations/review/getAllTargetsTouchedAt';

/**
 * .what = integration tests for the target mtime read, over real files
 * .why = it stats the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 *        no mocks: real files in a real temp dir.
 */
describe('getAllTargetsTouchedAt.integration', () => {
  given('[case1] a corpus of targets, one of which has vanished', () => {
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-touched-at-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      await fs.writeFile(path.join(cwd, 'present.ts'), 'export const a = 1;\n');

      return {
        cwd,
        found: await getAllTargetsTouchedAt({
          cwd,
          paths: ['present.ts', 'vanished.ts'],
        }),
      };
    });

    when('[t0] the corpus is read', () => {
      then('a present file answers its mtime', () => {
        const one = scene.found.find((it) => it.path === 'present.ts');
        expect(typeof one?.touchedAt).toEqual('number');
      });

      then('a vanished file answers null rather than a throw', () => {
        // a target may vanish between enumeration and this stat, and a deleted
        // target is the common case — a fact about the file, never a failed read
        const one = scene.found.find((it) => it.path === 'vanished.ts');
        expect(one?.touchedAt).toEqual(null);
      });

      then('the answer holds one row per path, in order', () => {
        expect(scene.found.map((it) => it.path)).toEqual([
          'present.ts',
          'vanished.ts',
        ]);
      });
    });
  });

  given('[case2] a target handed in as an ABSOLUTE path', () => {
    /**
     * 🔴 `path.join(cwd, abs)` concatenates rather than resets, so a bare join
     * yields a doubled path that can never exist. under that defect the stat
     * rejects, `touchedAt` falls to null, and the target is pinned to the TAIL
     * forever — its stability never measured, and wish bar 7 defeated for it.
     *
     * `readFileContent` in `stepReview` already guards this for the READ, and its
     * own comment states the hazard verbatim. the stat owed the same guard.
     */
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-touched-at-abs-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      const absolute = path.join(cwd, 'absolute.ts');
      await fs.writeFile(absolute, 'export const b = 2;\n');

      return {
        found: await getAllTargetsTouchedAt({
          // a cwd deliberately UNRELATED to the file, so a join would be doubly wrong
          cwd: os.tmpdir(),
          paths: [absolute],
        }),
      };
    });

    when('[t0] the absolute target is read', () => {
      then('🔴 its mtime is measured, never nulled by a doubled path', () => {
        expect(typeof scene.found[0]?.touchedAt).toEqual('number');
      });
    });
  });

  given('[case3] a target that is present and cannot be read', () => {
    /**
     * 🔴 the failhide this clamps. a bare `.catch(() => null)` allowlists the whole
     * error class, so a permission denial arrives as "absent" and the file is graded
     * least-stable — the review proceeds as though it merely had no readable mtime.
     *
     * the stat is taken on the file's PARENT dir permissions, so a dir with no
     * execute bit yields EACCES on a child that plainly exists.
     */
    const scene = useBeforeAll(async () => {
      // root reads a mode-000 dir, so no denial occurs — refuse by name
      if (process.getuid?.() === 0)
        throw new BadRequestError(
          'case3 needs a non-root user — root reads a mode-000 dir, so no denial occurs',
          { uid: 0, hint: 'run the integration suite as a non-root user' },
        );

      const cwd = path.join(
        os.tmpdir(),
        `int-touched-at-eacces-${Date.now()}-${process.pid}`,
      );
      const locked = path.join(cwd, 'locked');
      await fs.mkdir(locked, { recursive: true });
      await fs.writeFile(
        path.join(locked, 'secret.ts'),
        'export const c = 3;\n',
      );
      await fs.chmod(locked, 0o000);
      return { cwd, locked };
    });

    when('[t0] the unreadable target is read', () => {
      // 🔴 the throw is provoked ONCE and shared. both assertions grade the SAME
      // error — its message and its metadata — so two stats of a chmod'ed path
      // bought a second copy of one fact
      // (rule.forbid.redundant-expensive-operations)
      //
      // 🟡 the error is wrapped in a PLAIN OBJECT rather than handed back bare.
      // `useThen` hands you a proxy over what the thunk returned, and an Error's
      // `message` is NON-ENUMERABLE — so a proxied Error reads `undefined` for
      // `.message` and `"{}"` for `JSON.stringify`, which is what both
      // assertions below grade. one `{ of }` wrapper keeps the Error whole
      const thrown = useThen('it rejects', async () => {
        const error = await getError(
          getAllTargetsTouchedAt({
            cwd: scene.cwd,
            paths: ['locked/secret.ts'],
          }),
        );

        // restore the mode the moment the denial is caught, so a red assertion below
        // still leaves the temp tree removable (as isRunArtifactPresent does)
        await fs.chmod(scene.locked, 0o755);
        return { of: error };
      });

      then('🔴 it THROWS rather than grade the file least-stable', () => {
        // a defect must surface with the path that failed, never read as an
        // absence (rule.forbid.failhide + rule.require.failloud)
        expect(thrown.of.message).toContain('cache stability');
        expect(String(thrown.of)).not.toEqual('null');
      });

      then('the error names the path a human must repair', () => {
        expect(JSON.stringify(thrown.of)).toContain('locked/secret.ts');
      });
    });
  });

  given('[case4] a corpus far larger than one concurrency wave', () => {
    /**
     * 🔴 the clamp on the BOUNDED-WAVE rewrite, not on the bound.
     *
     * `stepReview` hands this the full scoped target list, so an unbounded
     * `Promise.all` queues one stat per target at once. the repair pours in waves
     * of `BOUND_OF_CONCURRENT_STATS` — and a wave loop has its own regression
     * surface that `Promise.all` never had: a slice may drop a tail, or the
     * pushes may land out of order, and `getAllTargetsByCacheStability` sorts on
     * what this returns.
     *
     * .note = 🟡 this does NOT clamp the descriptor pressure itself. that is a
     *         PROCESS limit, unreachable at any corpus size a hermetic test may
     *         honestly build — stated rather than faked (rule.forbid.failhide).
     *
     * 150 paths spans several waves and ends PARTIAL, so a tail-drop shows.
     */
    const QUANT_OF_TARGETS = 150;

    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-touched-at-waves-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(cwd, { recursive: true });

      // every third target is left ABSENT, so the null path is exercised at
      // wave boundaries too rather than only in a tidy prefix
      const paths = Array.from(
        { length: QUANT_OF_TARGETS },
        (_, index) => `lane${index}.ts`,
      );
      await Promise.all(
        paths
          .filter((_, index) => index % 3 !== 0)
          .map((one) =>
            fs.writeFile(path.join(cwd, one), `export const a = 1;\n`),
          ),
      );

      return { paths, found: await getAllTargetsTouchedAt({ cwd, paths }) };
    });

    when('[t0] the whole corpus is read', () => {
      then('🔴 every path is answered — no wave drops its tail', () => {
        expect(scene.found).toHaveLength(QUANT_OF_TARGETS);
      });

      then('🔴 the answer holds the input order across every wave', () => {
        expect(scene.found.map((it) => it.path)).toEqual(scene.paths);
      });

      then(
        'a present target answers its mtime, whichever wave it sat in',
        () => {
          const present = scene.found.filter((_, index) => index % 3 !== 0);
          expect(
            present.every((it) => typeof it.touchedAt === 'number'),
          ).toEqual(true);
        },
      );

      then('an absent target answers null, whichever wave it sat in', () => {
        const absent = scene.found.filter((_, index) => index % 3 === 0);
        expect(absent.every((it) => it.touchedAt === null)).toEqual(true);
      });
    });
  });
});
