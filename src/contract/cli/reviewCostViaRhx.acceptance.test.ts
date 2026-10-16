import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { isLogDirName } from '@src/domain.operations/review/isLogDirName';

/**
 * .what = acceptance coverage for `review._.cost` through the PUBLISHED entrypoint —
 *         the rhachet runner a human actually types, never the module behind it
 * .why = `reviewCost.acceptance.test.ts` spawns the cli by package subpath, so
 *        every one of its snapshots grades output no human meets. between the two
 *        sits the runner, which writes a banner to STDOUT ahead of every skill — so
 *        the `--json` journey the skill advertises is broken at the published
 *        surface and no test could see it.
 *
 *        *a test grades the artifact it was pointed at; a runthrough grades the
 *        artifact a human meets.* the entrypoint a suite spawns is part of what it
 *        clamps, and one that reaches past the published surface has quietly
 *        narrowed its own scope (`rule.require.acceptance.blackbox`, F19).
 *
 * .how = spawns `node_modules/.bin/rhachet run --skill review._.cost`, which is what
 *        `rhx review._.cost` expands to — the repo-local binary rather than the
 *        host's global `rhx`, so the suite is hermetic
 *        (`rule.forbid.bare-host-deps`).
 *
 * .note = the cwd MUST be this repo's root. the runner looks up a skill against
 *         `.agent/` relative to cwd (`rule.forbid.cwd-outside-gitroot`), so a spawn
 *         from a fixture dir finds no skill at all. that is precisely why the peer
 *         suite spawns the module — and why every fixture here is reached by `--at`
 *         rather than by cwd.
 *
 * .note = this suite deliberately does NOT snapshot the runner's banner. a snapshot
 *         is a claim about OUR contract, and those bytes belong to a dependency —
 *         so they are asserted structurally, and the day they move this suite says
 *         so without twenty unrelated files turned red.
 *
 *         but the command's OWN bytes ARE snapped here, from the banner's end on.
 *         a published journey graded by `toContain` alone leaves every byte between
 *         the reaches free to drift — so the help body, the refusal block, and the
 *         `--json` document are each pinned at the grain a human meets them
 *         (`rule.require.contract-snapshot-exhaustiveness`).
 */
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const RUNNER = path.join(REPO_ROOT, 'node_modules', '.bin', 'rhachet');

/**
 * .what = swaps every machine-local path this repo's own output can echo
 * .why = the order carries weight. a fixture root lives UNDER the repo root, so a
 *        repo-root swap run first would eat the fixture path's prefix and leave a
 *        half-scrubbed string no later swap could match. longest first settles it.
 */
const asStablePaths = (input: {
  text: string;
  root: string | null;
}): string => {
  const repos = [REPO_ROOT, fs.realpathSync(REPO_ROOT)];
  const temps = input.root ? [input.root, fs.realpathSync(input.root)] : [];
  return [...temps, ...repos]
    .sort((a, b) => b.length - a.length)
    .reduce(
      (text, local) =>
        text
          .split(local)
          .join(repos.includes(local) ? '<repo-root>' : '<temp-root>'),
      input.text,
    );
};

/**
 * .what = one ansi color sequence, as the runner emits them
 * .why = the escape is built from its char code rather than written literally, so the
 *        source carries no control character at all — a literal `\u001b` in a regex is
 *        a lint defect (`noControlCharactersInRegex`) and would need a suppression
 *        comment that states less than this `.why` does
 */
const PATTERN_OF_ANSI = new RegExp(
  `${String.fromCharCode(27)}\\[[0-9;]*m`,
  'g',
);

/**
 * .what = the command's OWN bytes, stabilized for a snapshot
 * .why = a published journey graded by `toContain` alone leaves every byte between
 *        the reaches free to drift. this makes those bytes snappable without a
 *        claim about a single byte the command does not own:
 *
 *          1. the runner COLORS its stderr. our cli emits no ansi at all, so an
 *             unstripped snapshot would pin a dependency's palette — and go red on
 *             any host whose tty detection differs
 *          2. the runner BANNERS ahead of every skill. sliced from our own first
 *             line, so a banner reword reddens no render here (F19)
 *          3. a fixture root carries a TIMESTAMP and a repo root is machine-local.
 *             both are swapped, or the snapshot cannot hold on a second host
 *             (`rule.require.hermetic-tests`)
 *
 * .note = throws where the command's own head is absent. a slice that silently
 *         returned the whole stream would snapshot the banner it claims to drop, and
 *         one that returned `''` would snapshot an empty render as though it were a
 *         green one (`rule.forbid.failhide`).
 */
const asStablePayload = (input: {
  text: string;
  head: string;
  root: string | null;
}): string => {
  const plain = input.text.replace(PATTERN_OF_ANSI, '');
  const at = plain.indexOf(input.head);
  if (at === -1)
    throw new UnexpectedCodePathError("the command's own output is absent", {
      expected: input.head,
      text: plain,
      hint: 'the skill never printed its own head; check `rhx review._.cost --help` by hand — a runner or skill-link fault shows there before it shows here',
    });
  return asStablePaths({ text: plain.slice(at), root: input.root });
};

/**
 * .what = runs the skill exactly as `rhx review._.cost …` does
 * .why = one seam, so every case below grades the same published journey
 */
const runSkill = (input: {
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync(
    RUNNER,
    ['run', '--skill', 'review._.cost', ...input.args],
    {
      cwd: REPO_ROOT,
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
 * .what = seeds one priceable review run under a tree
 * .why = the `--json` case needs a corpus that PRICES; a refusal emits no document,
 *        so it cannot show whether the document a consumer receives is parseable
 *
 * .note = deliberately minimal — the peer suite owns the honesty-grade matrix. this
 *         one owns the ENTRYPOINT, so its fixture is the smallest corpus that makes
 *         the command succeed (`rule.prefer.wet-over-dry`: a second, narrower copy
 *         beats a shared helper that must serve two unrelated claims).
 *
 * .note = the dir name MUST carry milliseconds. `isLogDirName` admits only what
 *         `genLogDirName` mints — `/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\./`
 *         — and a name it rejects is dropped from the corpus in silence.
 *
 *         a dir name that lacks the millisecond segment is invisible to the meter,
 *         so the corpus reads EMPTY and the command refuses with *"no reviews to
 *         price"* — a product refusal that is correct about the corpus it was
 *         handed, but points at the cli for what is really a fixture defect.
 *
 *         the mint is asserted below rather than trusted, so a fixture that drifts
 *         from the grammar again says so as a fixture defect.
 */
const setOnePriceableRun = (input: { tree: string }): void => {
  const name = '2026-09-23T00-00-00-000Z.pid1.aaa';

  // the clamp on the fixture itself. without it, a name the meter drops reads as
  //    an empty corpus, and the suite blames the command (rule.forbid.failhide)
  if (!isLogDirName({ name }))
    throw new UnexpectedCodePathError(
      "the fixture's run dir name is not one `genLogDirName` mints, so the meter will drop it",
      {
        name,
        hint: 'rename the fixture dir to the shape `genLogDirName` mints, e.g. `2026-09-23T00-00-00-000Z.pid1.aaa` — milliseconds included',
      },
    );

  const dir = path.join(input.tree, '.log', 'bhrain', 'review', name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'input.args.json'),
    JSON.stringify({
      args: { output: 'out.md', focus: 'push' },
      scope: { ruleFiles: ['a.md'], refFiles: [], targetFiles: ['x.ts'] },
    }),
  );
  fs.writeFileSync(path.join(dir, 'input.prompt.md'), '# review task');
  fs.writeFileSync(
    path.join(dir, 'metrics.realized.json'),
    JSON.stringify({
      tokens: {
        input: 400_000,
        inputCacheCreation: 0,
        inputCacheRead: 100_000,
        output: 1_000,
      },
      cost: { total: '$0.2500' },
    }),
  );
};

describe('reviewCostViaRhx.acceptance', () => {
  given(
    '[case1] a human who asks the published command to explain itself',
    () => {
      const scene = useBeforeAll(async () => ({
        run: runSkill({ args: ['--help'] }),
      }));

      when('[t0] `rhx review._.cost --help` is typed', () => {
        then('🔴 the published journey WORKS — it exits clean', () => {
          // the baseline this suite exists to establish. the module spawn could
          // never state it, because it never reached the runner at all
          expect(scene.run.exitCode).toEqual(0);
        });

        then('the help a human reads arrives intact', () => {
          // the same body `reviewCost.acceptance.test.ts [case5]` snaps at module
          // grain — asserted here to prove the runner passes it through whole
          expect(scene.run.stdout).toContain('review._.cost');
          expect(scene.run.stdout).toContain('run | tree | grove');
        });

        then('🔴 and the runner writes a BANNER to stdout ahead of it', () => {
          // .why = this is the defect the module spawn hid. it is asserted rather
          //        than snapped, because the bytes belong to `rhachet` and a
          //        snapshot is a claim about OUR contract (F19)
          //
          // .note = the claim is about ORDER, not about line 0 — the runner emits
          //         its own leading blank line off a tty, so a `split('\n')[0]`
          //         assertion graded that blank rather than the banner
          expect(scene.run.stdout).toContain('run solid skill');
          expect(scene.run.stdout).toContain('review._.cost');
          expect(scene.run.stdout.indexOf('run solid skill')).toBeLessThan(
            scene.run.stdout.indexOf('review._.cost — what review cost'),
          );
        });

        // the help body is SNAPPED here, not merely at module grain. the peer
        // suite's snapshot proves the module renders it; this one proves the
        // RUNNER hands it through whole — a truncation, a re-wrap, or a dropped
        // section between the two `toContain` reaches above would ship green
        then('the help renders as the human reads it, banner aside', () => {
          expect(
            asStablePayload({
              text: scene.run.stdout,
              head: 'review._.cost — what review cost',
              root: null,
            }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] an empty corpus, priced through the published command', () => {
    const scene = useBeforeAll(async () => {
      const at = genTempDir({ slug: 'review-cost-via-rhx-case2' });
      return { at, run: runSkill({ args: ['--of', 'tree', '--at', at] }) };
    });

    when('[t0] the refusal travels through the runner', () => {
      then('it exits 2 — the constraint survives the runner', () => {
        // rule.require.exit-code-semantics. a runner that swallowed the code
        // would make every refusal in this cli read as a success to a caller
        expect(scene.run.exitCode).toEqual(2);
      });

      then(
        '🔴 the whole refusal reaches STDERR, where a human reads it',
        () => {
          expect(scene.run.stderr).toContain('no reviews to price');
          expect(scene.run.stderr).toContain('looked in:');
          expect(scene.run.stderr).toContain('fix:');
        },
      );

      then('🔴 and NO report reaches stdout — only the runner banner', () => {
        // the failhide this forbids at the published grain: a `$0.00` total, or
        // any figure at all, printed over a corpus nobody could price
        expect(scene.run.stdout).not.toContain('cost:');
        expect(scene.run.stdout).not.toContain('cache hit rate');
      });

      // the refusal is SNAPPED at the published grain. stderr is where a human
      // reads a failure, and the runner is what carries it there — so a reworded
      // `why`, a dropped `fix:` line, or a broken tree alignment must go red here
      // and not only in the module suite a human never reaches
      then('the refusal renders as the human reads it', () => {
        expect(
          asStablePayload({
            text: scene.run.stderr,
            head: '🦉 woah there',
            root: scene.at,
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] the `--json` journey the skill advertises', () => {
    /**
     * `review._.cost.sh` documents `--json` as *"json instead of a tree"*, and the
     * module-grain suite clamps that its stdout parses. through the PUBLISHED
     * entrypoint it does not: the runner's banner lands on stdout first, so
     * `rhx review._.cost --of tree --json | jq` fails at every breadth.
     *
     * this case pins the journey AS IT IS TODAY, deliberately. it is a
     *   characterization clamp, not a claim that the behavior is correct:
     *
     *     - the day `rhachet` moves its banner to stderr, `[t1]` goes RED
     *     - that red is the SIGNAL, not a regression — delete `[t1]`, promote
     *       the parse below to the assertion, and F19 closes
     *
     *   the cause is seeded where it belongs:
     *   `.dream/v2026_09_23.fix.rhx-prints-its-skill-banner-to-stdout-so-no-json-pipes.md`
     *
     * .why a pin rather than silence = `rule.forbid.failhide`. the alternative was
     *      the state this branch shipped until now — a `--json` flag advertised by a
     *      skill, clamped at a grain no human reaches, and broken where they do.
     */
    const scene = useBeforeAll(async () => {
      const at = genTempDir({ slug: 'review-cost-via-rhx-case3' });
      setOnePriceableRun({ tree: at });
      return {
        at,
        run: runSkill({ args: ['--of', 'tree', '--at', at, '--json'] }),
      };
    });

    when('[t0] a priceable tree is asked for json', () => {
      then('the command itself succeeds', () => {
        expect(scene.run.exitCode).toEqual(0);
      });

      then('🔴 the json document IS emitted — the payload is not lost', () => {
        // the defect is a PREFIX, never a dropped document. a reader who saw the
        // parse failure alone could conclude the report never rendered
        expect(scene.run.stdout).toContain('"tokens"');
        expect(scene.run.stdout).toContain('"cost"');
      });

      then('and the document renders whole', () => {
        // two key reaches leave every byte between them free to drift — a document
        //    that gained a top-level key, lost a branch, or reordered its axes passes
        //    both. this is the whole payload, in the PR diff, where a reviewer can
        //    read it (rule.require.contract-snapshot-exhaustiveness)
        //
        // snapped as TEXT here, where `[t1]` snaps it PARSED. the two are not
        //    redundant: parsed pins the shape a consumer reads, text pins the bytes
        //    on the wire — and this branch's own `--json` defect is a byte-level one
        //    (a prefix), which a parsed snapshot cannot see by construction
        expect(
          asStablePayload({
            text: scene.run.stdout,
            head: '{',
            root: scene.at,
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the consumer pipes it to a json reader', () => {
      then(
        '🔴 it does NOT parse — the runner banner precedes the document',
        () => {
          // RED-WHEN-FIXED. see the case header: this asserts today's broken
          // journey so it cannot be forgotten, and its failure is the signal
          // that the dream landed
          expect(() => JSON.parse(scene.run.stdout)).toThrow();
        },
      );

      then('🔴 and the cause is a PREFIX, not the payload', () => {
        // names the defect precisely, so the red above is never mis-read as
        // "the report broke" (rule.require.errors-name-the-fix, at test grain).
        //
        // the claim is positional: the runner's banner sits BEFORE the first `{`,
        // which is exactly what makes the stream unparseable
        expect(scene.run.stdout).toContain('run solid skill');
        expect(scene.run.stdout.indexOf('run solid skill')).toBeLessThan(
          scene.run.stdout.indexOf('{'),
        );
      });

      then('🟡 and the document behind the banner IS well-formed json', () => {
        // the half that proves the cli is innocent: strip the banner the runner
        // added, and the payload parses. so the repair is owed by `rhachet`,
        // and this branch's `--json` contract is sound
        const at = scene.run.stdout.indexOf('{');
        expect(at).toBeGreaterThan(0);
        expect(() => JSON.parse(scene.run.stdout.slice(at))).not.toThrow();
      });

      // and the document is SNAPPED, parsed rather than raw. a consumer reads
      // this payload, so its SHAPE is the contract — a renamed key or a dropped
      // branch is a break the `"tokens"`/`"cost"` reaches above cannot see.
      //
      // .why parsed = the raw text carries the banner and the root; parsed, the
      //      snapshot is the document itself, and jest renders it stably
      then('the json document a consumer receives is snapped', () => {
        const doc = JSON.parse(
          asStablePayload({
            text: scene.run.stdout,
            head: '{',
            root: scene.at,
          }),
        );
        expect(doc).toMatchSnapshot();
      });
    });
  });
});
