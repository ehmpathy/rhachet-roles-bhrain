import { execSync, spawn, spawnSync } from 'child_process';
import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { fileURLToPath, pathToFileURL } from 'url';

import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

/**
 * .what = acceptance tests for the node entry of the route.status.line cli contract —
 *         the command a seat runs while its settings predate the bash reader
 * .why = the harness runs the bound command with cwd = project root and renders stdout
 *        as the status line: `🗿 <stone>` for the branch-bound route, or an empty line
 *        when unbound or complete. a seat bound before the bash reader keeps this node
 *        entry until its next `rhx init`, so its contract still holds. this is a
 *        contract-grain test (per rule.require.test-coverage-by-grain): it spawns the real
 *        built cli via the package's public contract boundary, no mocks — across positive,
 *        negative/edge, help, and fault paths, each snapped so a reviewer sees exactly
 *        what such a seat sees.
 *
 * .note = the command `rhx init` binds today is the bash reader, and its own contract is
 *         proven where it runs under bash: `route.status.line.integration.test.ts` (every
 *         line state, each snapped) and `init.claude.status-line.survives-layout.integration.test.ts`
 *         (the bound command, run as the harness runs it). the node command below is
 *         frozen text in older seats' settings, not a value any current file declares, so
 *         there is no bound config to derive it from
 *
 * .how = spawns the `node -e` command a seat holds from before the bash reader, but
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
  require.resolve('rhachet-roles-bhrain/cli/route.status.line'),
).href;

/**
 * .what = the `node -e` body a seat runs while its settings predate the bash reader
 * .why = the init now binds the bash reader (`route.status.line.sh`); a seat whose
 *        settings were written before then still runs this node entry until its next
 *        `rhx init`, so its contract holds and is tested here. only the import specifier
 *        differs from the command such a seat holds: the bare package name is not found
 *        from a temp cwd, so it is swapped for the absolute file url of the same module
 */
const RENDER_COMMAND = `import(${JSON.stringify(RENDER_MODULE_URL)}).then(m => m.routeStatusLine())`;

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
  env?: Record<string, string>;
}): { stdout: string; stderr: string; exitCode: number } => {
  const args = input.args ?? [];
  const nodeArgs =
    args.length > 0
      ? ['-e', RENDER_COMMAND, '--', ...args]
      : ['-e', RENDER_COMMAND];
  const result = spawnSync('node', nodeArgs, {
    cwd: input.cwd,
    env: { ...process.env, ...input.env },
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
 * .why = the peer/blocked/exhausted/feedbackUnabsorbed/fault cases all need the same guard shape
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

        then('it exits 0, with no stderr', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toEqual('');
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

        then('it exits 0, with no stderr', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toEqual('');
        });
      });
    },
  );

  given('[case3] the --help flag', () => {
    // --help is the first branch of `routeStatusLine`: it prints and returns before any read
    // of cwd, git, or the route, so the cwd cannot change its output. a temp repo keeps it
    // hermetic like its peers, and off this worktree's live branch and bound stone
    when('[t0] the renderer runs with --help', () => {
      const out = useBeforeAll(async () =>
        runRenderer({
          cwd: genTempDir({ slug: 'statusline-cli-help', git: true }),
          args: ['--help'],
        }),
      );

      then('it prints usage', () => {
        expect(out.stdout).toContain('route.status.line');
      });

      then('its help output matches the snapshot', () => {
        expect(out.stdout).toMatchSnapshot('route.status.line - help');
      });

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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
        expect(out.stderr).toContain('✋ ConstraintError: [route.status.line]');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
      });
    });
  });

  given(
    '[case12] a bound route blocked on feedbackUnabsorbed peer review',
    () => {
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
              blocker: 'review.peer.unabsorbed',
            },
          ],
        }),
      }));

      when('[t0] the renderer runs with that cwd', () => {
        const out = useBeforeAll(async () =>
          runRenderer({ cwd: scene.tempDir }),
        );

        then('it emits the peer-review phase (agent replies)', () => {
          const lines = out.stdout.split('\n').filter((l) => l.trim() !== '');
          expect(lines[0]).toEqual('🗿 1.vision, review.peer, l1@i002 🔍');
        });

        then('its output matches the feedbackUnabsorbed snapshot', () => {
          expect(out.stdout).toMatchSnapshot(
            'route.status.line - peer.feedbackUnabsorbed',
          );
        });

        then('it exits 0, with no stderr', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toEqual('');
        });
      });
    },
  );

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

      when('[t1] a second repaint runs, served from the cache', () => {
        const out = useBeforeAll(async () => {
          // the [t0] repaint wrote the cache; this one is a hit
          const first = runRenderer({ cwd: scene.tempDir });
          const second = runRenderer({ cwd: scene.tempDir });
          return { first, second };
        });

        then('CLAMP: the hit prints the same degrade row on stderr', () => {
          expect(out.second.stderr.split('\n')[0]).toEqual(
            out.first.stderr.split('\n')[0],
          );
          expect(out.second.stderr).toContain('phase derivation faulted');
        });

        then('the replayed row matches its snapshot', () => {
          expect(out.second.stderr.split('\n')[0]).toMatchSnapshot(
            'route.status.line - phase.degrade.stderr.replay',
          );
        });

        then('the hit prints the plain stone line and exits 0', () => {
          expect(out.second.stdout.trim()).toEqual('🗿 1.vision');
          expect(out.second.exitCode).toEqual(0);
        });
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

        then('it exits 0, with no stderr', () => {
          expect(out.exitCode).toEqual(0);
          expect(out.stderr).toEqual('');
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

      then('it exits 0, with no stderr', () => {
        expect(out.exitCode).toEqual(0);
        expect(out.stderr).toEqual('');
      });
    });
  });

  given(
    '[case16] a bound route whose inputs do not change (a warm repaint)',
    () => {
      const scene = useBeforeAll(async () => ({
        tempDir: genBoundRouteRepo({ slug: 'statusline-cli-case16' }),
      }));

      when('[t0] the renderer runs cold, then again warm', () => {
        const out = useBeforeAll(async () => {
          const cold = runRenderer({ cwd: scene.tempDir });
          const warm = runRendererWithModuleProbe({ cwd: scene.tempDir });
          return { cold, warm };
        });

        then('the warm repaint prints the identical line', () => {
          expect(out.warm.stdout).toEqual(out.cold.stdout);
          expect(out.warm.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
        });

        then('it exits 0, with no fault on stderr', () => {
          expect(out.warm.exitCode).toEqual(0);
          expect(out.warm.stderr).not.toContain('[route.status.line] fault');
        });

        then(
          'CLAMP: the warm repaint loads no package from node_modules',
          () => {
            expect(out.warm.modules.external).toEqual([]);
          },
        );

        then(
          'CLAMP: the warm repaint loads neither the renderer nor the bind glob',
          () => {
            expect(out.warm.modules.dist).not.toContain(
              'stepRouteStatusLine.js',
            );
            expect(out.warm.modules.dist).not.toContain('getRouteBind.js');
            expect(out.warm.modules.dist).not.toContain(
              'getRouteBindByBranch.js',
            );
            expect(out.warm.modules.dist).not.toContain(
              'getAllBindFlagsByBranch.js',
            );
            expect(out.warm.modules.dist).not.toContain('route.js');
          },
        );

        then('the warm repaint module graph matches the snapshot', () => {
          expect(out.warm.modules.dist).toMatchSnapshot(
            'route.status.line - warm repaint module graph',
          );
        });
      });
    },
  );

  given('[case17] a cache dir that cannot be written', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case17' });
      // a FILE where the cache dir must go makes every cache write fail
      const blocker = path.join(
        tempDir,
        '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      fs.mkdirSync(path.dirname(blocker), { recursive: true });
      fs.writeFileSync(blocker, 'not a dir');
      return { tempDir };
    });

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('the line still prints, correct', () => {
        expect(out.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
      });

      then('the failed write is loud on stderr, with its code and path', () => {
        expect(out.stderr).toMatch(
          /^\[route\.status\.line\] fault: cache write failed \(E[A-Z]+\) at .+skill=route\.status\.line\/branch=.+\.json, the line renders uncached\. fix: make .+skill=route\.status\.line a writable dir \(remove a file in its place, or repair its permissions\)$/m,
        );
      });

      then('its stderr matches the snapshot', () => {
        expect(
          out.stderr
            .trim()
            .replace(
              / at \S+skill=route\.status\.line/,
              ' at $TEMP/.agent/.cache/…/skill=route.status.line',
            )
            .replace(
              / make \S+skill=route\.status\.line /,
              ' make $TEMP/.agent/.cache/…/skill=route.status.line ',
            )
            .replace(/branch=\S+\.json/, 'branch=$BRANCH.json'),
        ).toMatchSnapshot('route.status.line - cache write fault');
      });

      then('it exits 0 (a cache fault never fails the line)', () => {
        expect(out.exitCode).toEqual(0);
      });
    });
  });

  given('[case17b] a cache file that cannot be read', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case17b' });
      // a cold repaint writes the cache file; then a symlink to itself replaces it (ELOOP)
      runRenderer({ cwd: tempDir });
      const cacheDir = path.join(
        tempDir,
        '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      const cacheName = fs
        .readdirSync(cacheDir)
        .find((name) => name.endsWith('.json'));
      if (!cacheName) throw new Error('the cold repaint wrote no cache file');
      const cachePath = path.join(cacheDir, cacheName);
      fs.rmSync(cachePath);
      fs.symlinkSync(cachePath, cachePath);
      return { tempDir };
    });

    when('[t0] the renderer runs, then runs again', () => {
      const out = useBeforeAll(async () => ({
        first: runRenderer({ cwd: scene.tempDir }),
        second: runRenderer({ cwd: scene.tempDir }),
      }));

      then('the line still prints, correct', () => {
        expect(out.first.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
      });

      then(
        'the failed read is loud on stderr, with its code, path, and fix',
        () => {
          expect(out.first.stderr).toMatch(
            /^\[route\.status\.line\] fault: cache read failed \(ELOOP\) at .+skill=route\.status\.line\/branch=.+\.json, the line renders afresh\. fix: remove .+\.json, or repair its permissions$/m,
          );
        },
      );

      then('its stderr matches the snapshot', () => {
        expect(
          out.first.stderr
            .trim()
            .replace(
              /\S+skill=route\.status\.line\/branch=\S+?\.json/g,
              '$TEMP/.agent/.cache/…/skill=route.status.line/branch=$BRANCH.json',
            ),
        ).toMatchSnapshot('route.status.line - cache read fault');
      });

      then('it exits 0 (a cache fault never fails the line)', () => {
        expect(out.first.exitCode).toEqual(0);
      });

      then('the miss rewrote the file, so the next repaint is quiet', () => {
        expect(out.second.stderr.trim()).toEqual('');
        expect(out.second.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
      });
    });
  });

  given('[case17d] a cache file torn mid-record', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case17d' });
      // a cold repaint writes the cache file; then half a record replaces its bytes
      runRenderer({ cwd: tempDir });
      const cacheDir = path.join(
        tempDir,
        '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      const cacheName = fs
        .readdirSync(cacheDir)
        .find((name) => name.endsWith('.json'));
      if (!cacheName) throw new Error('the cold repaint wrote no cache file');
      const cachePath = path.join(cacheDir, cacheName);
      fs.writeFileSync(cachePath, '{ torn half a recor');
      return { tempDir, cachePath };
    });

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then(
        'the line prints, correct, and exits 0: a torn cache is a miss',
        () => {
          expect(out.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
          expect(out.exitCode).toEqual(0);
        },
      );

      then('the cache is rewritten as a valid record', () => {
        const record = JSON.parse(fs.readFileSync(scene.cachePath, 'utf-8'));
        expect(record.line).toEqual('🗿 1.vision, yield 🌾');
      });
    });
  });

  given('[case17c] a passage ledger no stat can read (a malfunction)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case17c' });
      // a symlink to itself in the ledger's place: its stat faults ELOOP, no caller constraint
      const passagePath = path.join(tempDir, 'my-route/.route/passage.jsonl');
      fs.rmSync(passagePath, { force: true });
      fs.symlinkSync(passagePath, passagePath);
      return { tempDir };
    });

    when('[t0] the renderer runs with that cwd', () => {
      const out = useBeforeAll(async () => runRenderer({ cwd: scene.tempDir }));

      then('it prints no line and exits 1, the malfunction exit', () => {
        expect(out.stdout).toEqual('');
        expect(out.exitCode).toEqual(1);
      });

      then('stderr opens with the qualified malfunction row', () => {
        expect(out.stderr.split('\n')[0]).toMatch(
          /^💥 MalfunctionError: \[route\.status\.line\] .*ELOOP/,
        );
      });

      then('the row matches the snapshot, host path masked', () => {
        expect(
          out.stderr
            .split('\n')[0]
            ?.replace(
              /[^\s']*my-route\/\.route\/passage\.jsonl/g,
              '$TEMP/my-route/.route/passage.jsonl',
            ),
        ).toMatchSnapshot('route.status.line - malfunction row');
      });
    });
  });

  given(
    '[case18] a box of seats on one bound route repaint at once (a herd)',
    () => {
      const SEATS = 12;
      const scene = useBeforeAll(async () => {
        const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case18' });
        const cacheDir = path.join(
          tempDir,
          '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
        );
        return { tempDir, cacheDir };
      });

      /**
       * .what = the one cache record file in the cache dir, plus any leftover temp files
       * .why = the herd must leave one valid record, never a torn one or a stray temp
       */
      const readCacheDir = (): { record: string; strays: string[] } => {
        const names = fs.readdirSync(scene.cacheDir);
        const recordName = names.find((name) => name.endsWith('.json')) ?? null;
        if (!recordName)
          throw new MalfunctionError('the herd left no cache record', {
            cacheDir: scene.cacheDir,
            names,
            hint: 'the warm-up repaint must write the cache; check its stderr',
          });
        return {
          record: fs.readFileSync(
            path.join(scene.cacheDir, recordName),
            'utf-8',
          ),
          strays: names.filter((name) => name.endsWith('.tmp')),
        };
      };

      when('[t0] the caches are warm, and every seat repaints at once', () => {
        const out = useBeforeAll(async () => {
          runRenderer({ cwd: scene.tempDir });
          const recordBefore = readCacheDir().record;
          const herd = await runRendererHerd({
            cwd: scene.tempDir,
            seats: SEATS,
          });
          return { herd, recordBefore, after: readCacheDir() };
        });

        then('every seat prints the current line and exits 0', () => {
          expect(out.herd.map((seat) => seat.stdout.trim())).toEqual(
            Array(SEATS).fill('🗿 1.vision, yield 🌾'),
          );
          expect(out.herd.map((seat) => seat.exitCode)).toEqual(
            Array(SEATS).fill(0),
          );
        });

        then(
          'CLAMP: no seat renders — the cache record is byte-identical after the herd',
          () => {
            expect(out.after.record).toEqual(out.recordBefore);
          },
        );

        then('the herd lines and exit codes match their snapshot', () => {
          expect(asHerdSummary({ herd: out.herd })).toMatchSnapshot();
        });
      });

      when('[t1] a passage lands, then every seat repaints at once', () => {
        const out = useBeforeAll(async () => {
          fs.appendFileSync(
            path.join(scene.tempDir, 'my-route/.route/passage.jsonl'),
            `${JSON.stringify({ stone: '1.vision', status: 'blocked' })}\n`,
          );
          const herd = await runRendererHerd({
            cwd: scene.tempDir,
            seats: SEATS,
          });
          return { herd, after: readCacheDir() };
        });

        then('every seat shows the new state', () => {
          expect(out.herd.map((seat) => seat.stdout.trim())).toEqual(
            Array(SEATS).fill('🗿 1.vision, yield, blocked ✋'),
          );
        });

        then('no seat logs a fault', () => {
          expect(
            out.herd.filter((seat) => seat.stderr.includes('fault')),
          ).toEqual([]);
        });

        then(
          'the cache holds one valid record of the new line, and no stray temp file',
          () => {
            const record: { line: string } = JSON.parse(out.after.record);
            expect(record.line).toEqual('🗿 1.vision, yield, blocked ✋');
            expect(out.after.strays).toEqual([]);
          },
        );

        then('the herd lines and exit codes match their snapshot', () => {
          expect(asHerdSummary({ herd: out.herd })).toMatchSnapshot();
        });
      });
    },
  );

  given('[case19] a host whose timezone sits west of utc', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case19' });
      const cachePath = path.join(
        tempDir,
        '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      return { tempDir, cachePath };
    });

    when('[t0] the renderer runs twice under TZ=America/Chicago', () => {
      const out = useBeforeAll(async () => {
        const env = { TZ: 'America/Chicago' };
        const first = runRenderer({ cwd: scene.tempDir, env });
        const names = fs.readdirSync(scene.cachePath);
        const recordName = names.find((name) => name.endsWith('.json'));
        if (!recordName)
          throw new MalfunctionError('the first repaint left no cache record', {
            cachePath: scene.cachePath,
            names,
            stderr: first.stderr,
            hint: 'the first repaint must write the cache; check its stderr',
          });
        const recordPath = path.join(scene.cachePath, recordName);
        const recordBefore = fs.readFileSync(recordPath, 'utf-8');
        const second = runRenderer({ cwd: scene.tempDir, env });
        const recordAfter = fs.readFileSync(recordPath, 'utf-8');
        return { first, second, recordBefore, recordAfter };
      });

      then('both repaints print the current line', () => {
        expect(out.first.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
        expect(out.second.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
      });

      then(
        'the record holds no clock time: its age is its own file mtime, the same in every zone',
        () => {
          expect(Object.keys(JSON.parse(out.recordBefore)).sort()).toEqual([
            'degradeRow',
            'fingerprint',
            'line',
            'route',
          ]);
        },
      );

      then(
        'CLAMP: the second repaint is a hit — the record is byte-identical',
        () => {
          expect(out.recordAfter).toEqual(out.recordBefore);
        },
      );

      then('the lines of the step match their snapshot', () => {
        // split to rows, so the final newline the harness reads stays pinned as an empty row
        expect({
          first: out.first.stdout.split('\n'),
          second: out.second.stdout.split('\n'),
        }).toMatchSnapshot();
      });
    });
  });

  given('[case21] a seat whose miss is cancelled mid-render', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case21' });
      const cachePath = path.join(
        tempDir,
        '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
      );
      return { tempDir, cachePath };
    });

    when('[t0] the harness sends SIGTERM to a cold repaint, mid-miss', () => {
      const out = useBeforeAll(async () =>
        runRendererCancelled({ cwd: scene.tempDir }),
      );

      then(
        'CLAMP: the cache write still lands, so the next repaint is a hit',
        () => {
          const names = fs.existsSync(scene.cachePath)
            ? fs.readdirSync(scene.cachePath)
            : [];
          expect(names.filter((name) => name.endsWith('.json'))).toHaveLength(
            1,
          );
        },
      );

      then('the next repaint prints the current line from the cache', () => {
        const next = runRenderer({ cwd: scene.tempDir, env: {} });
        expect(next.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
      });

      then('the cancelled repaint exits within the grace', () => {
        expect(out.elapsedMs).toBeLessThan(5_000);
      });
    });

    when('[t1] the cancelled repaint hangs in its render', () => {
      const out = useBeforeAll(async () => {
        // drop the cache [t0] wrote, so this repaint misses and loads the render
        fs.rmSync(scene.cachePath, { recursive: true, force: true });
        return runRendererCancelled({ cwd: scene.tempDir, hang: true });
      });

      then('CLAMP: the grace kills it, exit 143', () => {
        expect(out.exitCode).toEqual(143);
      });

      then('it lives no shorter than the grace, and not far past it', () => {
        expect(out.elapsedMs).toBeGreaterThanOrEqual(5_000);
        expect(out.elapsedMs).toBeLessThan(15_000);
      });
    });

    when('[t2] a hung repaint is cancelled a second time', () => {
      const out = useBeforeAll(async () => {
        // drop any cache, so this repaint misses and loads the render
        fs.rmSync(scene.cachePath, { recursive: true, force: true });
        return runRendererCancelled({
          cwd: scene.tempDir,
          hang: true,
          secondSignalAfterMs: 1_000,
        });
      });

      then('CLAMP: the second SIGTERM kills it at once', () => {
        expect(out.signal).toEqual('SIGTERM');
        expect(out.elapsedMs).toBeLessThan(5_000);
      });
    });
  });

  given(
    '[case20] a repo whose settings still name the legacy cli/route barrel command',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genBoundRouteRepo({ slug: 'statusline-cli-case20' });
        const cachePath = path.join(
          tempDir,
          '.agent/.cache/repo=bhrain/role=driver/skill=route.status.line',
        );
        return { tempDir, cachePath };
      });

      when('[t0] the legacy command repaints a bound route', () => {
        const out = useBeforeAll(async () =>
          runLegacyRenderer({ cwd: scene.tempDir }),
        );

        then('it prints the same line the subpath prints, and exits 0', () => {
          expect(out.stdout.trim()).toEqual('🗿 1.vision, yield 🌾');
          expect(out.stderr).toEqual('');
          expect(out.exitCode).toEqual(0);
        });

        then(
          'it forwards to the subpath entry: it writes the cache record',
          () => {
            const names = fs.readdirSync(scene.cachePath);
            expect(names.filter((name) => name.endsWith('.json'))).toHaveLength(
              1,
            );
          },
        );

        then('the line matches its snapshot', () => {
          expect(out.stdout).toMatchSnapshot();
        });
      });

      when(
        '[t1] a second route is bound to the branch, then it repaints',
        () => {
          const out = useBeforeAll(async () => {
            const branch = execSync('git rev-parse --abbrev-ref HEAD', {
              cwd: scene.tempDir,
              encoding: 'utf-8',
            }).trim();
            const bindDir = path.join(
              scene.tempDir,
              'my-route-other',
              '.route',
            );
            fs.mkdirSync(bindDir, { recursive: true });
            fs.writeFileSync(
              path.join(
                bindDir,
                `.bind.${sanitizeBranchName({ branch })}.flag`,
              ),
              '',
            );

            // a hand-planted flag surfaces on the next miss, so drop the cache to force one
            fs.rmSync(scene.cachePath, { recursive: true, force: true });
            return runLegacyRenderer({ cwd: scene.tempDir });
          });

          then(
            'it prints no line, logs the shared qualified fault row, and exits 2',
            () => {
              expect(out.stdout.trim()).toEqual('');
              expect(out.exitCode).toEqual(2);
              expect(asStableFaultStderr({ stderr: out.stderr })).toEqual(
                '✋ ConstraintError: [route.status.line] multiple routes bound to this branch — unbind the extra route(s) so the status line can pick one',
              );
            },
          );

          then('the fault matches its snapshot', () => {
            expect(
              asStableFaultStderr({ stderr: out.stderr }),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );
});

/**
 * .what = runs the legacy `cli/route` barrel command, as a repo not yet re-inited still binds it
 * .why = that export stays so an old settings file keeps a correct line; it forwards to the
 *        subpath entry, so it is cached too, and keeps only the barrel's module load. it is a
 *        contract a human still meets, so it keeps an acceptance case of its own
 */
const runLegacyRenderer = (input: {
  cwd: string;
}): { stdout: string; stderr: string; exitCode: number } => {
  const moduleUrl = pathToFileURL(
    require.resolve('rhachet-roles-bhrain/cli/route'),
  ).href;
  const result = spawnSync(
    'node',
    [
      '-e',
      `import(${JSON.stringify(moduleUrl)}).then(m => m.routeStatusLine())`,
    ],
    {
      cwd: input.cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = the distinct lines and exit codes a herd printed, with the count of seats
 * .why = a snapshot of twelve identical rows hides the one fact it holds: every seat agreed
 */
const asHerdSummary = (input: {
  herd: { stdout: string; stderr: string; exitCode: number }[];
}): { seats: number; lines: string[]; exitCodes: number[] } => ({
  seats: input.herd.length,
  lines: [...new Set(input.herd.map((seat) => seat.stdout.trim()))],
  exitCodes: [...new Set(input.herd.map((seat) => seat.exitCode))],
});

/**
 * .what = runs N renderers at once from one cwd, as a box of seats repaints in one burst
 * .why = only separate processes race on the one cache file, the way the harness does
 */
const runRendererHerd = async (input: {
  cwd: string;
  seats: number;
}): Promise<{ stdout: string; stderr: string; exitCode: number }[]> =>
  Promise.all(
    Array.from(
      { length: input.seats },
      () =>
        new Promise<{ stdout: string; stderr: string; exitCode: number }>(
          (onDone) => {
            const child = spawn('node', ['-e', RENDER_COMMAND], {
              cwd: input.cwd,
              stdio: ['ignore', 'pipe', 'pipe'],
            });
            // .note = deliberate mutation, a scoped zone: a stream emits its bytes as events,
            //         so one child's output accretes here; it never leaves this closure
            const chunks = { stdout: '', stderr: '' };
            child.stdout.on('data', (data) => {
              chunks.stdout += String(data);
            });
            child.stderr.on('data', (data) => {
              chunks.stderr += String(data);
            });
            child.on('close', (code) =>
              onDone({ ...chunks, exitCode: code ?? 1 }),
            );
          },
        ),
    ),
  );

/**
 * .what = a preload that sends its own process SIGTERM the moment the lazy render op loads
 * .why = the render op loads only on a miss, so the signal lands mid-miss, before the cache
 *        write, on every run. a timer would race the miss, which ends in a few hundred ms
 */
const CANCEL_AT_RENDER_PRELOAD = [
  "const Module = require('module');",
  'const loadOriginal = Module._load;',
  'Module._load = function (request, ...rest) {',
  "  if (/\\/stepRouteStatusLine$/.test(request)) process.kill(process.pid, 'SIGTERM');",
  '  return loadOriginal.call(this, request, ...rest);',
  '};',
  '',
].join('\n');

/**
 * .what = a preload that sends SIGTERM as the render op loads, then makes the render hang
 * .why = drives the grace's kill bound: a render that never settles, with a ref'd handle
 *        that holds the event loop open, so only the grace timer (or a second signal) ends it
 */
const CANCEL_AT_HUNG_RENDER_PRELOAD = [
  "const Module = require('module');",
  'const loadOriginal = Module._load;',
  'Module._load = function (request, ...rest) {',
  '  const loaded = loadOriginal.call(this, request, ...rest);',
  '  if (!/\\/stepRouteStatusLine$/.test(request)) return loaded;',
  "  process.kill(process.pid, 'SIGTERM');",
  '  setInterval(() => undefined, 1000);',
  '  return { ...loaded, stepRouteStatusLine: () => new Promise(() => undefined) };',
  '};',
  '',
].join('\n');

/**
 * .what = runs one cold repaint that is sent SIGTERM mid-miss, and waits for it to exit
 * .why = mirrors the harness, which cancels an in-flight repaint when a new update lands
 *
 * .note = `hang` swaps in a render that never settles; `secondSignalAfterMs` sends the
 *         harness's second SIGTERM from outside, as a repeated cancel would
 */
const runRendererCancelled = async (input: {
  cwd: string;
  hang?: boolean;
  secondSignalAfterMs?: number;
}): Promise<{
  elapsedMs: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
}> => {
  const preloadDir = genTempDir({ slug: 'statusline-cancel-preload' });
  const preloadPath = path.join(preloadDir, 'cancelAtRender.js');
  fs.writeFileSync(
    preloadPath,
    input.hang ? CANCEL_AT_HUNG_RENDER_PRELOAD : CANCEL_AT_RENDER_PRELOAD,
  );
  return new Promise((onDone) => {
    const startedMs = Date.now();
    const child = spawn('node', ['-r', preloadPath, '-e', RENDER_COMMAND], {
      cwd: input.cwd,
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    const secondSignal =
      input.secondSignalAfterMs === undefined
        ? null
        : setTimeout(() => child.kill('SIGTERM'), input.secondSignalAfterMs);
    child.on('close', (exitCode, signal) => {
      if (secondSignal) clearTimeout(secondSignal);
      onDone({ elapsedMs: Date.now() - startedMs, exitCode, signal });
    });
  });
};

/**
 * .what = the dist root of this package, derived from the renderer module's own file url
 * .why = the module probe parts this package's own dist modules from any other module
 * .note = the renderer sits at `dist/contract/cli/route.status.line.js`, two dirs below dist
 */
const DIST_ROOT =
  path.join(path.dirname(fileURLToPath(RENDER_MODULE_URL)), '..', '..') +
  path.sep;

/**
 * .what = runs the renderer, then reports which modules the process loaded
 * .why = the clamp on the cost of a warm repaint: a hit must load only node builtins and the
 *        cache ops. the old `cli/route` command loads ~90 modules plus their packages, so
 *        this goes red against it
 *
 * .note = the module list rides stderr after a sentinel, so stdout stays the bare line
 */
const runRendererWithModuleProbe = (input: {
  cwd: string;
}): {
  stdout: string;
  stderr: string;
  exitCode: number;
  modules: { dist: string[]; external: string[] };
} => {
  const sentinel = 'MODULES=';
  const probe = `${RENDER_COMMAND}.then(() => console.error(${JSON.stringify(sentinel)} + JSON.stringify(Object.keys(require.cache))))`;
  const result = spawnSync('node', ['-e', probe], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stderr = result.stderr ?? '';
  const probeLine =
    stderr.split('\n').find((line) => line.startsWith(sentinel)) ?? null;
  if (!probeLine)
    throw new MalfunctionError(`module probe printed no ${sentinel} line`, {
      stderr,
      hint: 'run `npm run build` first; the probe loads the built dist entry',
    });
  const keys: string[] = JSON.parse(probeLine.slice(sentinel.length));
  return {
    stdout: result.stdout ?? '',
    stderr: stderr
      .split('\n')
      .filter((line) => !line.startsWith(sentinel))
      .join('\n'),
    exitCode: result.status ?? 1,
    modules: {
      dist: keys
        .filter((key) => key.startsWith(DIST_ROOT))
        .map((key) => path.basename(key))
        .sort(),
      external: keys.filter((key) => !key.startsWith(DIST_ROOT)).sort(),
    },
  };
};
