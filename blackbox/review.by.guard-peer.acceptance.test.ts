import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-guard-review-by');

/**
 * .what = raise the per-test budget — a full guard run drives a real LLM review as its peer
 * .why = the guard execs `rhx review.by --role learner --for <rubric>`, which runs a real review
 *        subprocess (~1 min). when.repeatably re-drives the whole guard on variance, so the per-test
 *        budget must cover several serial guard+review runs. scoped to THIS file.
 */
// eslint-disable-next-line no-undef
jest.setTimeout(420000);

/**
 * .what = config for probabilistic cases that invoke LLM review subprocesses
 * .why = LLM responses vary; retry keeps CI green while it still proves the contract. criteria SOME
 *        skips the remaining attempts once one passes — an LLM verdict is inherently probabilistic,
 *        so one green attempt proves the shape (rule.require.repeatable-for-llm-tests).
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: 'SOME',
} as const;

/**
 * .what = a fixed brain for the LLM-backed seam cases
 * .why = pins the base review's `🦉 let's review` brain row so the guard-tree + peer snapshots are
 *        deterministic in that dimension (the verdict itself is what varies, handled by SOME).
 */
const BRAIN = 'fireworks/deepseek/v4-flash';

/**
 * .what = sanitizes a route.stone.set guard-tree stdout so it snapshots stably
 * .why = the guard tree carries two volatile dimensions: verdict durations (`rejected 109.5s`) and
 *        the hash+iteration segment of each peer-artifact path (`.i001.<hash>.r001.`). the shared
 *        sanitizeTimeForSnapshot masks every duration verb + the temp-dir prefix; we add the
 *        hash-scrub so the `given:`/`taken:` artifact references stay stable. what remains is the
 *        DETERMINISTIC seam structure: the `r{n}: <slug> (l1, N/3)` reviewer row, the verdict word,
 *        the blocker/nitpick counts, and the judge outcomes — the guard EXPERIENCE a human reads.
 */
const sanitizeGuardTreeForSnapshot = (stdout: string): string =>
  sanitizeTimeForSnapshot(stdout).replace(
    /\.i\d+\.[0-9a-f]+\.r\d+\./g,
    '.i[N].[HASH].r[N].',
  );

/**
 * .what = sanitizes a guard-captured peer artifact so it snapshots stably
 * .why = the guard writes the disintermediated base-review stdout into a `given.by_peer` artifact,
 *        wrapped in its own `├─ stdout` / `└─ tallied` tree. that captured text carries the base
 *        review's volatile telemetry — the `🔭 metrics.expected`, `🪵 logs`, and `✨ metrics.realized`
 *        subtrees (token counts, cost, latency, timestamped log paths) — plus a `logs:` line under
 *        the verdict header. a byte-exact snapshot would fight rule.require.repeatable-for-llm-tests.
 *        so we drop those volatile regions and keep the DETERMINISTIC structure that proves
 *        disintermediation flows through the guard: the two `🪨 run solid skill` banners (review.by
 *        wrapper → base review), the `🦉 let's review` scope block, the verdict header, the `review:`
 *        output path, the base review's `summary` block, and the guard's `└─ tallied` footer — with
 *        NO `🔍 review.by` anchor and NO `rubrics` bucket (the review.by tree chrome that
 *        disintermediation removes).
 */
const sanitizeCapturedPeerForSnapshot = (artifact: string): string => {
  const lines = artifact
    // strip ANSI color/style escape codes
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    // mask the volatile temp-dir prefix
    .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/')
    .split('\n');

  // drop the three telemetry SUBTREES: skip from a telemetry header (🔭/🪵/✨) until the next
  // verdict header (🦉) — the base review emits banner, `🦉 let's review`, [telemetry×3], then
  // `🦉 <verdict>`, so the next 🦉 after any telemetry header is the verdict where retention resumes.
  const kept: string[] = [];
  let skipTelemetry = false;
  for (const line of lines) {
    if (/(🔭 metrics|🪵 logs|✨ metrics)/.test(line)) {
      skipTelemetry = true;
      continue;
    }
    if (skipTelemetry && line.includes('🦉')) skipTelemetry = false;
    if (skipTelemetry) continue;
    // drop the single volatile `logs:` child line under the verdict header (a timestamped path)
    if (/├─ logs:/.test(line)) continue;
    kept.push(line);
  }
  return kept.join('\n').trim();
};

/**
 * .what = drives a route guard whose ONLY peer runs `$rhx review.by --role learner --for <rubric>`,
 *         then returns the guard-tree stdout + the captured peer artifact
 * .why = this is the seam under test: route.stone.set → runOneReview → review.by → base review. the
 *        driver writes the guard (one review.by peer for the given rubric + brain) and a src file of
 *        the given content, marks the stone passed to fire the guard, and reads back both the guard's
 *        rendered stdout AND the `given.by_peer.<rubric>` artifact the guard captured from the peer.
 *        every seam case shares this driver so the four verdict-class cases differ ONLY in the rubric
 *        + fixture content that steer the verdict.
 */
const driveGuardWithReviewByPeer = async (input: {
  slug: string;
  rubric: 'term-application' | 'term-aggregation';
  brain: string;
  srcContent: string;
}): Promise<{ cli: { stdout: string }; artifact: string | null }> => {
  const cwd = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });

  // link driver (route skills) + reviewer (review engine) + learner (rubrics + wrapper)
  for (const role of ['driver', 'reviewer', 'learner'])
    await execAsync(`npx rhachet roles link --role ${role}`, { cwd });

  // point the guard's single peer at the named learner rubric, via review.by --for (the seam).
  // scoped to a fixed path so the base review's `🦉 let's review` scope block is deterministic.
  await fs.writeFile(
    path.join(cwd, '1.execute.guard'),
    [
      'artifacts:',
      '  - src/**/*.ts',
      '',
      'reviews:',
      '  peer:',
      `    - slug: ${input.rubric}`,
      `      run: $rhx review.by --role learner --for ${input.rubric} --paths 'src/**/*.ts' --brain ${input.brain}`,
      '      budget: 3',
      '      level: 1',
      '',
      'judges:',
      '  - $rhachet run --repo bhrain --skill route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 3',
      '',
    ].join('\n'),
  );

  await fs.mkdir(path.join(cwd, 'src'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'src', 'feature.ts'), input.srcContent);

  const cli = await invokeRouteSkill({
    skill: 'route.stone.set',
    args: { stone: '1.execute', route: '.', as: 'passed' },
    cwd,
  });

  const peerDir = path.join(cwd, '.reviews', 'peer');
  const files = await fs.readdir(peerDir).catch(() => [] as string[]);
  const artifactFile = files.find(
    (file) =>
      file.includes(`given.by_peer.${input.rubric}`) && file.endsWith('.md'),
  );
  const artifact = artifactFile
    ? await fs.readFile(path.join(peerDir, artifactFile), 'utf-8')
    : null;

  return { cli, artifact };
};

// a clean, non-domain util — declares NO domain object or operation, so term-aggregation
// (itemization) has no declared term to require → a deterministic 0/0 pass verdict.
const SRC_CLEAN_GENERIC =
  'export const addNumbers = (input: { a: number; b: number }): number =>\n' +
  '  input.a + input.b;\n';

// a clean, well-termed domain op — one unambiguous concept per word, so term-application passes.
const SRC_CLEAN_TERMS =
  'export const getSurferName = (input: { surferId: string }): string =>\n' +
  '  input.surferId;\n';

// deliberately term-dirty: ONE concept (a reserved lesson slot) under THREE words, plus one word
// overloaded across two concepts — so term-application reliably BITES (inconsistency + ambiguity).
const SRC_DIRTY_TERMS =
  '// inconsistency: one concept (a reserved lesson slot) under three words.\n' +
  'export interface Reservation {\n' +
  '  surfer: string;\n' +
  '  slot: string;\n' +
  '}\n' +
  '\n' +
  'export const getHold = (input: { id: string }): Reservation => {\n' +
  "  return { surfer: 'kai', slot: '9am' };\n" +
  '};\n' +
  '\n' +
  'export const cancelAppointment = (input: {\n' +
  '  reservation: Reservation;\n' +
  '}): void => {\n' +
  '  // three words, one concept\n' +
  '};\n' +
  '\n' +
  "// ambiguity (overload): 'session' means BOTH a surf lesson AND an auth login.\n" +
  'export interface Session {\n' +
  '  lessonMinutes: number;\n' +
  '}\n' +
  '\n' +
  'export const openSession = (input: { token: string }): { token: string } => {\n' +
  '  return { token: input.token };\n' +
  '};\n';

/**
 * .what = the EXHAUSTIVE seam matrix between a route guard and review.by --for
 * .why = a route guard peer review is the MAIN consumer of `review.by --for`. this proves the whole
 *        chain end to end AND across every verdict class the seam can yield:
 *
 *          | verdict     | rubric            | fixture        | guard outcome     |
 *          |-------------|-------------------|----------------|-------------------|
 *          | pass (agg)  | term-aggregation  | clean generic  | approved, exit 0  |
 *          | pass (app)  | term-application  | clean terms    | approved, exit 0  |
 *          | findings    | term-application  | dirty terms    | rejected, exit 2  |
 *          | malfunction | term-aggregation  | (bad brain)    | blocked, exit ≠0  |
 *
 *        each case snapshots BOTH:
 *          - the guard-tree stdout — the EXPERIENCE a human reads (reviewer row, verdict, counts,
 *            judge outcome), sanitized for durations + artifact hashes
 *          - the captured peer artifact — the disintermediated base review the guard tallied off,
 *            proving `review.by --for` handed the guard a NORMAL review (no review.by tree)
 *
 *        so the crux (rule.require.review-by-disintermediates) is proven at EVERY seam boundary, not
 *        just the happy path. the fixture links the REAL shipped learner role, so `rhx review.by
 *        --role learner` finds the learner-owned wrapper → base, for real.
 */
describe('review.by.guard-peer.acceptance', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // verdict = PASS — term-aggregation on clean generic code → guard approves
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-pass-aggregation] guard peer runs review.by --for term-aggregation, code is clean', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the stone is passed → the guard approves off a raw base review',
      () => {
        const res = useThen('the guard runs the term-aggregation peer and approves', async () =>
          driveGuardWithReviewByPeer({
            slug: 'route-guard-review-by-pass-aggregation',
            rubric: 'term-aggregation',
            brain: BRAIN,
            srcContent: SRC_CLEAN_GENERIC,
          }),
        );

        then('the guard ran the term-aggregation peer (its reviewer row shows the slug)', () => {
          expect(res.cli.stdout).toContain('term-aggregation');
        });

        then('the captured peer artifact IS a raw base review, NOT a review.by tree', () => {
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = PASS — term-application on clean term code → guard approves
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-pass-application] guard peer runs review.by --for term-application, code is clean', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the stone is passed → the guard approves off a raw base review',
      () => {
        const res = useThen('the guard runs the term-application peer and approves', async () =>
          driveGuardWithReviewByPeer({
            slug: 'route-guard-review-by-pass-application',
            rubric: 'term-application',
            brain: BRAIN,
            srcContent: SRC_CLEAN_TERMS,
          }),
        );

        then('the guard ran the term-application peer (its reviewer row shows the slug)', () => {
          expect(res.cli.stdout).toContain('term-application');
        });

        then('the guard tallied a parseable count off the peer stdout', () => {
          // the guard parses the disintermediated stdout via getReviewCounts — the SAME path it
          // uses for a direct `$rhx review` peer — so the reviewer row carries a blockers count
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
        });

        then('the captured peer artifact IS a raw base review, NOT a review.by tree', () => {
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = FINDINGS — term-application on dirty terms → guard REJECTS
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-findings] guard peer runs review.by --for term-application, code is term-dirty', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the stone is passed → the peer bites, the guard rejects off a raw base review',
      () => {
        const res = useThen('the guard runs the peer, it finds blockers, the guard rejects', async () =>
          driveGuardWithReviewByPeer({
            slug: 'route-guard-review-by-findings',
            rubric: 'term-application',
            brain: BRAIN,
            srcContent: SRC_DIRTY_TERMS,
          }),
        );

        then('the guard rejected — its reviewer row carries a blocker count', () => {
          // the dirty fixture names one concept three ways + overloads a word, so term-application
          // finds at least one blocker; the guard folds that into the tree and the reviewed? judge
          // blocks (allow-blockers 0). proof the FINDINGS path flows through the seam.
          expect(res.cli.stdout).toContain('term-application');
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
        });

        then('the captured peer artifact IS a raw base review with findings, NOT a review.by tree', () => {
          // the crux at the findings boundary: even with blockers, the captured peer is the base
          // review's own stdout (a `summary` block), never a review.by tree.
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = MALFUNCTION — an unknown brain → the peer review faults → guard BLOCKS
  // (deterministic: the brain never loads, so no LLM call is made — a fast, stable case)
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-malfunction] guard peer runs review.by --for with an unknown brain', () => {
    when('[t0] the stone is passed → the peer review faults, the guard blocks on a malfunction', () => {
      const res = useThen('the guard runs the peer, its review subprocess faults', async () =>
        driveGuardWithReviewByPeer({
          slug: 'route-guard-review-by-malfunction',
          rubric: 'term-aggregation',
          // an unknown brain: the base review cannot start, so it emits no numeric verdict —
          // runOneReview promotes the no-verdict exit to a malfunction (never a fake 0/0), and the
          // guard blocks. deterministic (the brain is not found before any LLM call).
          brain: 'nonexistent/broken/brain',
          srcContent: SRC_CLEAN_GENERIC,
        }),
      );

      then('the guard did NOT pass the stone (a malfunction blocks)', () => {
        expect(res.cli.stdout).toContain('term-aggregation');
        // the guard surfaces the peer as a malfunction, not a clean pass
        expect(res.cli.stdout).toMatch(/malfunction|💥/i);
      });

      then('the captured peer artifact records the fault, NOT a review.by tree', () => {
        // even a faulted peer is captured as a plain-review artifact (its stdout/stderr), never a
        // review.by tree — disintermediation holds on the malfunction boundary too.
        expect(res.artifact).not.toBeNull();
        const artifact = res.artifact ?? '';
        expect(artifact).not.toContain('review.by --role');
        expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
      });

      then('the guard-tree stdout is stable (full snapshot)', () => {
        expect(sanitizeGuardTreeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });

      then('the captured peer artifact is stable (full snapshot)', () => {
        expect(res.artifact).not.toBeNull();
        expect(
          sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
        ).toMatchSnapshot();
      });
    });
  });
});
