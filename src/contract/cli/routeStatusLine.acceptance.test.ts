import { execFileSync, execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

import { sanitizeBranchName } from '@src/domain.operations/review/sanitizeBranchName';

/**
 * .what = acceptance tests for the route.status.line cli contract
 * .why = the vision specifies the harness contract: the harness runs the renderer
 *        with cwd = project root and renders stdout as the status line. the renderer
 *        emits `🗿 <stone>` for the branch-bound route, or an empty line when unbound
 *        or complete. this is a contract-grain test (per rule.require.test-coverage-by-grain):
 *        it spawns the real built cli (the `node -e` harness command) via the package's
 *        public contract boundary, no mocks — across positive, negative/edge, help, and
 *        fault paths, each snapped so a reviewer sees exactly what the user sees.
 *
 * .how = spawns the exact `node -e` command the init writes into settings.json, but
 *        imports the package by absolute path so the spawn cwd is free to be the
 *        anchor. the *anchor* under test is the spawn cwd (as the harness supplies it),
 *        not a stdin payload — the renderer reads no stdin.
 *
 * .note = a genuine fault is logged to stderr and rethrown (no swallow): the process
 *         exits non-zero and the harness blanks the line. the fault path is exercised
 *         directly here via an ambiguous multi-bind (two bind flags for one branch →
 *         `getRouteBindByBranch` throws). this proves the fail-loud reconciliation (r8
 *         vs `rule.forbid.failhide`) that survived three review rounds.
 */
const RENDER_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/route'),
).href;
const RENDER_COMMAND = `import(${JSON.stringify(
  RENDER_MODULE_URL,
)}).then(m => m.routeStatusLine())`;

/**
 * .what = runs the renderer via node -e from a given cwd (the harness anchor)
 * .why = mirrors the harness invocation; captures stdout, stderr, and exit code
 */
const runRenderer = (input: {
  cwd: string;
  args?: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const args = input.args ?? [];
  const nodeArgs =
    args.length > 0
      ? ['-e', RENDER_COMMAND, '--', ...args]
      : ['-e', RENDER_COMMAND];
  try {
    const stdout = execFileSync('node', nodeArgs, {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { stdout, stderr: '', exitCode: 0 };
  } catch (error) {
    // execFileSync throws on non-zero exit; capture streams for assertion
    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status: number }).status
        : 1;
    const stdout =
      error && typeof error === 'object' && 'stdout' in error
        ? String((error as { stdout: unknown }).stdout)
        : '';
    const stderr =
      error && typeof error === 'object' && 'stderr' in error
        ? String((error as { stderr: unknown }).stderr)
        : '';
    return { stdout, stderr, exitCode: status };
  }
};

/**
 * .what = derives the stable renderer fault stderr from the real captured output
 * .why = the multi-bind fault is now a caller-must-fix constraint that exits 2
 *        (rule.require.exit-code-semantics), so the process exits cleanly — there
 *        is no node uncaught-exception dump (stack + branch name + temp paths) to
 *        tokenize. the whole stderr is the renderer's own status-line-scoped
 *        guidance line, which carries no environment-volatile text, so the snapshot
 *        can derive from the real stderr verbatim (guarded by the guidance anchor)
 */
const asStableFaultStderr = (input: { stderr: string }): string => {
  const anchor = 'so the status line can pick one';
  if (!input.stderr.includes(anchor)) return '<unexpected fault stderr shape>';
  return input.stderr.trim();
};

describe('routeStatusLine.acceptance', () => {
  given(
    '[case1] the renderer anchored at a git repo with no bound route',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'statusline-cli-case1', git: true });
        return { tempDir };
      });

      when('[t0] the renderer runs with that cwd', () => {
        const out = useBeforeAll(async () =>
          runRenderer({ cwd: scene.tempDir }),
        );

        then('it emits an empty line (no route bound → absent stone)', () => {
          expect(out.stdout.trim()).toEqual('');
        });

        then('its output matches the unbound snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'route.status.line - unbound route',
          );
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });
      });
    },
  );

  given(
    '[case2] a temp repo with a single bound route (one unpassed stone)',
    () => {
      const scene = useBeforeAll(async () => {
        // a self-contained git repo with ONE bound route whose first stone is
        // unpassed → the renderer derives it from cwd and emits `🗿 1.vision`.
        // hermetic on purpose (rule.require.hermetic-tests): it does NOT spawn
        // against process.cwd(), so it never depends on this worktree's live branch
        // or bound stone — and it survives the merge to main (a cwd-anchored case
        // would emit an empty line once the feature branch's bind flag is gone).
        const tempDir = genTempDir({ slug: 'statusline-cli-case2', git: true });
        const branch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: tempDir,
          encoding: 'utf-8',
        }).trim();
        const branchFlat = sanitizeBranchName({ branch });

        // a single route bound to this repo's branch, with one unpassed stone
        const routeDir = path.join(tempDir, 'my-route');
        const bindDir = path.join(routeDir, '.route');
        fs.mkdirSync(bindDir, { recursive: true });
        fs.writeFileSync(
          path.join(routeDir, '0.wish.md'),
          '# wish\n\nbuild a feature.',
        );
        fs.writeFileSync(
          path.join(routeDir, '1.vision.stone'),
          '# stone: vision',
        );
        fs.writeFileSync(path.join(bindDir, `.bind.${branchFlat}.flag`), '');

        return { tempDir };
      });

      when('[t0] the renderer runs with that cwd', () => {
        const out = useBeforeAll(async () =>
          runRenderer({ cwd: scene.tempDir }),
        );

        then(
          'it emits exactly one clean stone line (no banner pollution)',
          () => {
            // guards the banner-pollution regression: the node -e command must not
            // print rhx's "🪨 run solid skill" header, only the bare status line
            const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
            expect(lines).toHaveLength(1);
            expect(lines[0]).toEqual('🗿 1.vision');
          },
        );

        then('its output matches the bound snapshot', () => {
          // the fixture pins the stone to 1.vision, so the line is deterministic —
          // no tokenization needed (unlike a live-cwd run, whose stone would drift)
          expect(out.stdout).toMatchSnapshot('route.status.line - bound route');
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });
      });
    },
  );

  given('[case3] the --help flag', () => {
    when('[t0] the renderer runs with --help', () => {
      const out = useBeforeAll(async () =>
        runRenderer({ cwd: process.cwd(), args: ['--help'] }),
      );

      then('it prints usage', () => {
        expect(out.stdout).toContain('route.status.line');
      });

      then('its help output matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('route.status.line - help');
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case4] an ambiguous multi-bind (a genuine lookup fault)', () => {
    const scene = useBeforeAll(async () => {
      // a temp git repo with TWO bind flags for its branch → getRouteBindByBranch throws
      const tempDir = genTempDir({ slug: 'statusline-cli-case4', git: true });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();
      const branchFlat = sanitizeBranchName({ branch });

      // plant two competing route binds for the same branch
      for (const routeSlug of ['route.alpha', 'route.beta']) {
        const bindDir = path.join(tempDir, routeSlug, '.route');
        fs.mkdirSync(bindDir, { recursive: true });
        fs.writeFileSync(path.join(bindDir, `.bind.${branchFlat}.flag`), '');
      }

      return { tempDir };
    });

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits no status line (stdout stays empty)', () => {
        expect(out.stdout.trim()).toEqual('');
      });

      then('it logs the fault to stderr (fail-loud, not hidden)', () => {
        expect(out.stderr).toContain('[route.status.line] fault:');
      });

      then('its stable fault output matches the error-variant snapshot', () => {
        // snap the whole fault stderr: it exits 2 cleanly (no node stack dump), so
        // the marker + status-line-scoped guidance is the entire, durable output —
        // no volatile paths/branch/line numbers to tokenize
        expect(asStableFaultStderr({ stderr: out.stderr })).toMatchSnapshot(
          'route.status.line - fault (multi-bind)',
        );
      });

      then(
        'it exits 2 (a caller-must-fix constraint: unbind the extra route)',
        () => {
          // the multi-bind is a caller-must-fix constraint per rule.require.exit-code-
          // semantics; exit 2 (not a bare non-zero) as the peer routeDrive does
          expect(out.exitCode).toEqual(2);
        },
      );
    });
  });

  given('[case5] a bound route whose stones have all passed (complete)', () => {
    const scene = useBeforeAll(async () => {
      // a self-contained git repo with ONE bound route whose only stone is passed
      // → the renderer sees no incomplete stone and emits the route-complete line.
      // hermetic (rule.require.hermetic-tests): its own temp repo + branch bind, so
      // it never depends on this worktree's live state and survives the merge to main
      const tempDir = genTempDir({ slug: 'statusline-cli-case5', git: true });
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        cwd: tempDir,
        encoding: 'utf-8',
      }).trim();
      const branchFlat = sanitizeBranchName({ branch });

      // a single route bound to this repo's branch, with its one stone passed
      const routeDir = path.join(tempDir, 'my-route');
      const bindDir = path.join(routeDir, '.route');
      fs.mkdirSync(bindDir, { recursive: true });
      fs.writeFileSync(
        path.join(routeDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.stone'),
        '# stone: vision',
      );
      fs.writeFileSync(
        path.join(routeDir, '1.vision.yield.md'),
        '# vision yielded',
      );
      fs.writeFileSync(path.join(bindDir, `.bind.${branchFlat}.flag`), '');
      fs.writeFileSync(
        path.join(bindDir, 'passage.jsonl'),
        `${JSON.stringify({ stone: '1.vision', status: 'passed' })}\n`,
      );

      return { tempDir };
    });

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then(
        'it emits exactly one route-complete line (no banner pollution)',
        () => {
          const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
          expect(lines).toHaveLength(1);
          expect(lines[0]).toEqual('🗿 route complete 🎉');
        },
      );

      then('its output matches the complete snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - route complete',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });
});
