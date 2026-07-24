import { execSync, spawnSync } from 'child_process';
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
 *
 * .note = uses spawnSync (not execFileSync) so stderr is captured on BOTH the
 *         success (exit 0) and failure paths. the phase-degrade case exits 0 yet
 *         logs to stderr; execFileSync only surfaces stderr on a throw, so it would
 *         drop the degrade log and leave the fault unverified.
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
  const result = spawnSync('node', nodeArgs, {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
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
  // fail loud, never hide: if the anchor is absent the fault shape has drifted — surface
  // the real stderr so the change is revealed, rather than mask it behind a static
  // placeholder that would snapshot-match and hide the regression (rule.forbid.failhide)
  if (!input.stderr.includes(anchor))
    throw new Error(
      `fault stderr lacks the expected guidance anchor "${anchor}"; got:\n${input.stderr}`,
    );
  return input.stderr.trim();
};

/**
 * .what = a peer-review guard for stone 1.vision (one reviewer, level 1, budget 3)
 * .why = the peer/blocked/exhausted/uncontemplated/fault cases all need the same guard shape
 */
const PEER_GUARD = [
  'artifacts:',
  '  - "$route/1.vision*.md"',
  'reviews:',
  '  peer:',
  '    - slug: reviewer-a',
  '      run: echo test',
  '      budget: 3',
  '      level: 1',
  'judges: []',
].join('\n');

/**
 * .what = a self-review guard for stone 1.vision (two self reviews)
 * .why = the self-review phase case needs two self reviews so it can render r{done}/r{total}
 */
const SELF_GUARD = [
  'artifacts:',
  '  - "$route/1.vision*.md"',
  'reviews:',
  '  self:',
  '    - slug: slug-a',
  '      say: review a',
  '    - slug: slug-b',
  '      say: review b',
  'judges: []',
].join('\n');

/**
 * .what = builds a hermetic git repo with ONE branch-bound route (stone 1.vision) + optional state
 * .why = each phase-variant acceptance case needs a bound route whose guard/passage/meter state
 *        yields one specific phase; this centralizes the repo scaffold (rule.prefer.wet-over-dry:
 *        8 near-identical setups earn a shared builder) so each case declares only its own state
 */
const genBoundRouteRepo = (input: {
  slug: string;
  guard?: string;
  passage?: Record<string, unknown>[];
  meters?: Record<string, unknown>[];
  metersRaw?: string;
  promiseSlugs?: string[];
}): string => {
  const tempDir = genTempDir({ slug: input.slug, git: true });
  const branch = execSync('git rev-parse --abbrev-ref HEAD', {
    cwd: tempDir,
    encoding: 'utf-8',
  }).trim();
  const branchFlat = sanitizeBranchName({ branch });

  const routeDir = path.join(tempDir, 'my-route');
  const bindDir = path.join(routeDir, '.route');
  fs.mkdirSync(bindDir, { recursive: true });
  fs.writeFileSync(
    path.join(routeDir, '0.wish.md'),
    '# wish\n\nbuild a feature.',
  );
  fs.writeFileSync(path.join(routeDir, '1.vision.stone'), '# stone: vision');
  fs.writeFileSync(path.join(bindDir, `.bind.${branchFlat}.flag`), '');

  if (input.guard !== undefined)
    fs.writeFileSync(path.join(routeDir, '1.vision.guard'), input.guard);
  if (input.passage !== undefined)
    fs.writeFileSync(
      path.join(bindDir, 'passage.jsonl'),
      `${input.passage.map((e) => JSON.stringify(e)).join('\n')}\n`,
    );
  if (input.metersRaw !== undefined)
    fs.writeFileSync(
      path.join(bindDir, 'reviewPeerMeters.jsonl'),
      input.metersRaw,
    );
  else if (input.meters !== undefined)
    fs.writeFileSync(
      path.join(bindDir, 'reviewPeerMeters.jsonl'),
      `${input.meters.map((e) => JSON.stringify(e)).join('\n')}\n`,
    );
  for (const slug of input.promiseSlugs ?? [])
    fs.writeFileSync(
      path.join(bindDir, `1.vision.guard.promise.${slug}.md`),
      '# promised',
    );

  return tempDir;
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
            expect(lines[0]).toEqual('🗿 1.vision, yield 🌾');
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
          expect(lines[0]).toEqual('🗿 route complete 🌴🤙');
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

  given('[case6] a bound route in the self-review phase', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case6',
        guard: SELF_GUARD,
        promiseSlugs: ['slug-a'],
        passage: [
          { stone: '1.vision', status: 'blocked', blocker: 'review.self' },
        ],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the self-review phase (r1/r2 + magnifier)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual('🗿 1.vision, review.self, r1/r2 🔍');
      });

      then('its output matches the self-review snapshot', () => {
        expect(out.stdout).toMatchSnapshot('route.status.line - review.self');
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case7] a bound route in the peer-review phase', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case7',
        guard: PEER_GUARD,
        meters: [
          { stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 2 },
        ],
        passage: [
          { stone: '1.vision', status: 'blocked', blocker: 'review.peer' },
        ],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the peer-review phase (l1@i002 + magnifier)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual('🗿 1.vision, review.peer, l1@i002 🔍');
      });

      then('its output matches the peer-review snapshot', () => {
        expect(out.stdout).toMatchSnapshot('route.status.line - review.peer');
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case8] a bound route blocked on human approval', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case8',
        passage: [
          { stone: '1.vision', status: 'blocked', blocker: 'approval' },
        ],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the approval-judge phase (approved? + wave)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual('🗿 1.vision, judge, approved? 👋');
      });

      then('its output matches the approval-judge snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - judge.approval',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case9] a bound route blocked on a non-approval judge', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case9',
        passage: [{ stone: '1.vision', status: 'blocked', blocker: 'judge' }],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the plain judge phase (magnifier, machine turn)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual('🗿 1.vision, judge 🔍');
      });

      then('its output matches the non-approval-judge snapshot', () => {
        expect(out.stdout).toMatchSnapshot('route.status.line - judge.machine');
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case10] a bound route driver-blocked over a peer phase', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case10',
        guard: PEER_GUARD,
        meters: [
          { stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 2 },
        ],
        passage: [{ stone: '1.vision', status: 'blocked' }],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the blocked overlay (peer phase + stop-hand)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual(
          '🗿 1.vision, review.peer, l1@i002, blocked ✋',
        );
      });

      then('its output matches the blocked-overlay snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - blocked.overlay',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case11] a bound route with an exhausted peer-budget status', () => {
    const scene = useBeforeAll(async () => ({
      // exhausted is its own passage status now (not a 'review.peer.exhausted'
      // blocker); it renders over its peer phase + waves for a human (approve/extend)
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case11',
        guard: PEER_GUARD,
        meters: [
          { stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 3 },
        ],
        passage: [{ stone: '1.vision', status: 'exhausted' }],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it shows the peer phase + exhausted + a wave for a human', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual(
          '🗿 1.vision, review.peer, l1@i003, exhausted 👋',
        );
      });

      then('its output matches the exhausted snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - peer.exhausted',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case12] a bound route blocked on uncontemplated peer review', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case12',
        guard: PEER_GUARD,
        meters: [
          { stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 2 },
        ],
        passage: [
          {
            stone: '1.vision',
            status: 'blocked',
            blocker: 'review.peer.uncontemplated',
          },
        ],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it emits the peer-review phase (agent replies)', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual('🗿 1.vision, review.peer, l1@i002 🔍');
      });

      then('its output matches the uncontemplated snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - peer.uncontemplated',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given(
    '[case13] a bound route whose phase derivation faults (degrade)',
    () => {
      const scene = useBeforeAll(async () => ({
        // a corrupt meter file faults the PHASE read only (not the strict lookup); the
        // SyntaxError is allowlisted, so the renderer degrades to the plain stone line
        tempDir: genBoundRouteRepo({
          slug: 'statusline-cli-case13',
          guard: PEER_GUARD,
          metersRaw: '{ this is not valid json\n',
        }),
      }));

      when('[t0] the renderer runs with that cwd', () => {
        const out = useBeforeAll(async () =>
          runRenderer({ cwd: scene.tempDir }),
        );

        then(
          'it degrades to the plain stone line (phase dropped, base kept)',
          () => {
            const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
            expect(lines[0]).toEqual('🗿 1.vision');
          },
        );

        then('it logs the phase fault to stderr (surfaced, not hidden)', () => {
          expect(out.stderr).toContain('[route.status.line]');
        });

        then('its stderr matches the phase-fault snapshot', () => {
          // snap only the renderer's own diagnostic line (the first stderr line):
          // node may append an env-volatile object dump of the caught error after it,
          // which is not part of the stable contract — the anchor line is
          expect(out.stderr.split('\n')[0]).toMatchSnapshot(
            'route.status.line - phase.degrade.stderr',
          );
        });

        then('its output matches the degrade snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'route.status.line - phase.degrade',
          );
        });

        then(
          'it exits 0 (a benign read fault degrades, does not crash)',
          () => {
            expect(out.exitCode).toEqual(0);
          },
        );
      });
    },
  );

  given(
    '[case14] a bound route with a driver-blocked guardless stone (yield phase)',
    () => {
      // a driver wall (--as blocked, no guard blocker) over a guardless stone: phase stays
      // yield (no guard → no review phase), disposition is halt(blocked) → the stop-hand ✋
      const scene = useBeforeAll(async () => ({
        tempDir: genBoundRouteRepo({
          slug: 'statusline-cli-case14',
          passage: [{ stone: '1.vision', status: 'blocked' }],
        }),
      }));

      when('[t0] the renderer runs with that cwd', () => {
        const out = useBeforeAll(async () =>
          runRenderer({ cwd: scene.tempDir }),
        );

        then('it yields blocked ✋ (yield + blocked + stop-hand)', () => {
          const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
          expect(lines[0]).toEqual('🗿 1.vision, yield, blocked ✋');
        });

        then('its output matches the blocked-yield snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'route.status.line - blocked.yield',
          );
        });

        then('it exits 0', () => {
          expect(out.exitCode).toEqual(0);
        });
      });
    },
  );

  given('[case15] a bound route with a malfunctioned reviewer', () => {
    // a guard malfunction (status malfunction) over a peer phase: disposition halt(malfunction)
    // → the collision 💥, the hard-stop that a human must fix
    const scene = useBeforeAll(async () => ({
      tempDir: genBoundRouteRepo({
        slug: 'statusline-cli-case15',
        guard: PEER_GUARD,
        meters: [
          { stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 2 },
        ],
        passage: [{ stone: '1.vision', status: 'malfunction' }],
      }),
    }));

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it shows the peer phase + malfunction + collision', () => {
        const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
        expect(lines[0]).toEqual(
          '🗿 1.vision, review.peer, l1@i002, malfunction 💥',
        );
      });

      then('its output matches the malfunction snapshot', () => {
        expect(out.stdout).toMatchSnapshot(
          'route.status.line - peer.malfunction',
        );
      });

      then('it exits 0', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });
});
