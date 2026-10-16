import * as fs from 'fs';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import { asGuardReviewOutputPath } from '../__test_assets__/asGuardReviewOutputPath';
import { setOneReviewRunLogDir } from '../__test_assets__/setOneReviewRunLogDir';
import { asLogDirMintedAt } from '../asLogDirMintedAt';
import { asReviewLogsDir } from '../asReviewLogsDir';
import { NAME_OF_RUN_ARTIFACT } from '../asRunArtifactPath';
import { getOnePromptComposition } from '../getOnePromptComposition';
import { setInputArtifacts } from '../setInputArtifacts';
import { getOneReviewerLastRunAt } from './getOneReviewerLastRunAt';

/** the epoch — a bound every real run sorts after */
const SINCE_OF_ALL_TIME = new Date(0);

describe('getOneReviewerLastRunAt', () => {
  given('[case1] a tree that has never run a review', () => {
    when('[t0] the warmer asks when this lane last ran', () => {
      then(
        '🔴 it answers null rather than throws on the absent dir',
        async () => {
          // a fresh worktree has no `.log/bhrain/review/` at all. a throw here
          // would take down the warmer on its very first wake, on every new tree
          const cwd = genTempDir({ slug: 'warmer-lastrun-empty' });
          expect(
            await getOneReviewerLastRunAt({
              cwd,
              reviewer: 'repo-rules',
              since: SINCE_OF_ALL_TIME,
            }),
          ).toEqual(null);
        },
      );
    });
  });

  given('[case2] three runs across two lanes, at known instants', () => {
    /**
     * .why = THE bar-16 clamp. the warmer defers a poke where a real review
     *           already warmed the replica, and this read is the only thing that
     *           can tell it one did. a wrong answer here is SILENT: the warmer
     *           simply never defers, and pays for a redundant poke on every wake
     *           with no signal at all.
     */
    const cwd = genTempDir({ slug: 'warmer-lastrun-lanes' });

    const stampEarly = '2026-09-21T10-00-00-000Z';
    const stampLate = '2026-09-21T14-00-00-000Z';
    const stampOther = '2026-09-21T18-00-00-000Z';

    setOneReviewRunLogDir({ cwd, stamp: stampEarly, slug: 'repo-rules' });
    setOneReviewRunLogDir({ cwd, stamp: stampLate, slug: 'repo-rules' });
    setOneReviewRunLogDir({ cwd, stamp: stampOther, slug: 'mech-failhides' });

    const atEarly = asLogDirMintedAt({ name: stampEarly });
    const atLate = asLogDirMintedAt({ name: stampLate });

    when('[t0] the bound admits every run', () => {
      // the read is WRAPPED in an object, never handed back bare. `useBeforeAll`
      // answers a Proxy that defers the access, and a Proxy over a `Date` cannot
      // forward `getTime` — a date carries internal slots the trap never reaches.
      // one property read unwraps to the real date, so the calls below are on it
      const read = useBeforeAll(async () => ({
        lastRunAt: await getOneReviewerLastRunAt({
          cwd,
          reviewer: 'repo-rules',
          since: SINCE_OF_ALL_TIME,
        }),
      }));

      then('🔴 it answers the LATEST run of that lane, never the first', () => {
        // a `Math.min`, or a `[0]` off an unsorted readdir, would answer the
        // early one — and the warmer would then read a 4h-old touch as fresh
        expect(read.lastRunAt?.getTime()).toEqual(atLate.getTime());
      });

      then('🔴 and it never answers another lane`s run', () => {
        // the other lane ran LATER, so a read that ignored the reviewer would
        // answer `stampOther` — the sharpest miss this case can catch
        expect(read.lastRunAt?.getTime()).not.toEqual(
          asLogDirMintedAt({ name: stampOther }).getTime(),
        );
      });
    });

    when('[t1] the bound sits between the two runs of that lane', () => {
      then(
        'the earlier run is excluded, so the later one still wins',
        async () => {
          const lastRunAt = await getOneReviewerLastRunAt({
            cwd,
            reviewer: 'repo-rules',
            since: new Date(atEarly.getTime() + 1),
          });
          expect(lastRunAt?.getTime()).toEqual(atLate.getTime());
        },
      );
    });

    when('[t2] the bound sits after every run of that lane', () => {
      then(
        '🔴 it answers null — the warmer pokes rather than defers',
        async () => {
          // the whole reason the scan takes a `since`: an unbounded read would
          // re-walk every run on the tree on every wake, and the corpus grows
          // without limit
          expect(
            await getOneReviewerLastRunAt({
              cwd,
              reviewer: 'repo-rules',
              since: new Date(atLate.getTime() + 1),
            }),
          ).toEqual(null);
        },
      );
    });

    when('[t3] a lane that has never run is asked about', () => {
      then('it answers null, with other lanes` runs present', async () => {
        expect(
          await getOneReviewerLastRunAt({
            cwd,
            reviewer: 'never-ran',
            since: SINCE_OF_ALL_TIME,
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case3] a log root littered with dirs the mint never made', () => {
    /**
     * .why = a log root is a shared dir a human pokes at. the four shapes below
     *           are all real — a scratch dir, a run killed before it wrote its
     *           args, a half-written args file, an args file from a HAND review
     *           (no guard identity in its output path).
     *
     * the harm is not a throw. `zzz-debug` sorts LATE alphabetically, so a read
     *    that admitted it would report a scratch dir as the newest run — and the
     *    warmer would defer forever on a touch that never happened.
     */
    const cwd = genTempDir({ slug: 'warmer-lastrun-noise' });
    const logsDir = asReviewLogsDir({ cwd });

    const stampReal = '2026-09-21T09-00-00-000Z';
    setOneReviewRunLogDir({ cwd, stamp: stampReal, slug: 'repo-rules' });

    // a scratch dir a human made — sorts after every iso stamp
    fs.mkdirSync(path.join(logsDir, 'zzz-debug'), { recursive: true });

    // a run killed before it wrote its args
    fs.mkdirSync(
      path.join(
        logsDir,
        `2026-09-21T23-00-00-000Z.pid${process.pid}.${getUuid()}`,
      ),
      { recursive: true },
    );

    // a half-written args file — the json is truncated
    const dirOfTorn = path.join(
      logsDir,
      `2026-09-21T23-30-00-000Z.pid${process.pid}.${getUuid()}`,
    );
    fs.mkdirSync(dirOfTorn, { recursive: true });
    fs.writeFileSync(path.join(dirOfTorn, NAME_OF_RUN_ARTIFACT.args), '{"out');

    // a HAND `rhx review` — real spend, but its output path carries no lane
    const dirOfHand = path.join(
      logsDir,
      `2026-09-21T23-45-00-000Z.pid${process.pid}.${getUuid()}`,
    );
    fs.mkdirSync(dirOfHand, { recursive: true });
    fs.writeFileSync(
      path.join(dirOfHand, NAME_OF_RUN_ARTIFACT.args),
      JSON.stringify({ args: { output: '.scratch/my-review.md' } }),
    );

    // a FIFTH shape, and the one the `?? ''` fallback exists for: an args file
    // that parses and carries no `output` key at all. it is reachable from a
    // file with no cast — an older reviewer version, or a hand-edited artifact —
    // and it sorts LATEST of the five, so a fallback that fabricated a lane
    // would let it beat the real run outright
    const dirOfNoOutput = path.join(
      logsDir,
      `2026-09-22T00-00-00-000Z.pid${process.pid}.${getUuid()}`,
    );
    fs.mkdirSync(dirOfNoOutput, { recursive: true });
    fs.writeFileSync(
      path.join(dirOfNoOutput, NAME_OF_RUN_ARTIFACT.args),
      JSON.stringify({ rules: 'briefs/**/*.md' }),
    );

    when('[t0] the warmer asks when this lane last ran', () => {
      // wrapped, for the same reason `[case2][t0]` states: a `useBeforeAll`
      // proxy cannot forward a `Date`'s own methods
      const read = useBeforeAll(async () => ({
        lastRunAt: await getOneReviewerLastRunAt({
          cwd,
          reviewer: 'repo-rules',
          since: SINCE_OF_ALL_TIME,
        }),
      }));

      then('🔴 the real run wins, though five later dirs sit beside it', () => {
        expect(read.lastRunAt?.getTime()).toEqual(
          asLogDirMintedAt({ name: stampReal }).getTime(),
        );
      });

      then('🔴 and an args file with NO output key claims no lane', () => {
        // the `?? ''` fallback's own branch. the harm of a fallback that named a
        // lane instead is directional and expensive: the no-output dir sorts
        // LATEST, so it would become "the last run of repo-rules" and the warmer
        // would DEFER forever on a touch that never happened — the same harm
        // `[t0]`'s scratch-dir row guards, reached through a different door
        //
        // ⇒ proven red by neuter, 2 of 12: a fallback that answers a real lane
        //   path in place of `''` makes this row and the one above it fail,
        //   because the fabricated lane wins on recency
        //   (rule.forbid.unexpected-defaults)
        //
        // ⇒ a neuter must reproduce the DEFECT, never merely change a line: a
        //   fabricated path with a plausible basename (`report.i001.<slug>.md`)
        //   rather than the grammar `asPeerReviewOutputParts` actually parses
        //   answers null for the same reason `''` does, so the clamp cannot
        //   tell them apart. the grammar lives in `asGuardReviewOutputPath`, and
        //   a neuter that does not speak it proves the parser instead of the
        //   fallback
        expect(read.lastRunAt?.getTime()).not.toEqual(
          asLogDirMintedAt({
            name: '2026-09-22T00-00-00-000Z',
          }).getTime(),
        );
      });

      then('and no unreadable dir takes the read down', () => {
        // a torn args file is the likeliest of the four in practice: a warmer
        // wakes mid-write of a concurrent lane's artifacts
        expect(read.lastRunAt).not.toEqual(null);
      });
    });
  });

  /**
   * .why = the MIRROR of `[case3]`, and the half that had no clamp until
   *           2026-09-25. `[case3]` proves the two BENIGN faults read as "no
   *           match"; this proves every OTHER fs fault FAILS LOUD.
   *
   *           the operation states the harm in its own words: *"a swallowed EACCES
   *           reads as 'this reviewer never ran', so the warmer spends a poke on a
   *           fact it never established — and the grade downstream renders a
   *           confident decision on top of a hidden malfunction."*
   *
   *           ⇒ so the allowlist is a bar-16 defence: a fault that arrives as an
   *           absence turns a DEFER into a POKE, which is real money spent on a
   *           premise nobody checked (rule.forbid.failhide).
   *
   * .note = the fault is a REAL one from the real fs, never a mock. an args
   *         path that is a DIRECTORY answers EISDIR — present to `existsSync`,
   *         unreadable to `readFileSync`, and absent from `CODES_OF_ABSENCE`. that
   *         is the one shape reachable with no stub and no cast, which is why it is
   *         the shape this case takes (`rule.forbid.integration.mocks`).
   *
   * .note = the SECOND refusal in this operation — the non-`SyntaxError` parse
   *         throw — is deliberately NOT clamped here, and the reason is stated
   *         rather than omitted: `readFileSync(path, 'utf8')` answers a string, and
   *         `JSON.parse` of a string raises `SyntaxError` and no other class. so
   *         that branch is unreachable without a stub, and a clamp that reaches it
   *         by a cast would assert the cast. it stands as a forward guard for a
   *         future reviver, on the same terms as the `never` gates this subsystem
   *         carries.
   */
  given('[case4] an args file that is present and NOT readable', () => {
    const cwd = genTempDir({ slug: 'warmer-lastrun-unreadable' });
    const logsDir = asReviewLogsDir({ cwd });

    // a real run, so the corpus is not empty and a throw cannot be mistaken
    // for the absent-dir path `[case1]` already covers
    setOneReviewRunLogDir({
      cwd,
      stamp: '2026-09-21T09-00-00-000Z',
      slug: 'repo-rules',
    });

    // the args path is a DIRECTORY — so `existsSync` answers true and the read
    // answers EISDIR, which is a DEFECT rather than an absence
    const dirOfUnreadable = path.join(
      logsDir,
      `2026-09-21T23-00-00-000Z.pid${process.pid}.${getUuid()}`,
    );
    fs.mkdirSync(path.join(dirOfUnreadable, NAME_OF_RUN_ARTIFACT.args), {
      recursive: true,
    });

    when('[t0] the warmer asks when this lane last ran', () => {
      // one read, shared. the outcome rides in a plain object, since the
      // `useThen` proxy does not carry an Error instance or a `Date` through
      const read = useThen('it reads', async () =>
        getOneReviewerLastRunAt({
          cwd,
          reviewer: 'repo-rules',
          since: SINCE_OF_ALL_TIME,
        }).then(
          (lastRunAt) => ({ answer: lastRunAt, error: null }),
          (error: unknown) => ({ answer: 'threw', error }),
        ),
      );

      then('🔴 it FAILS LOUD rather than reads as "never ran"', () => {
        // the silent alternative is the expensive one: a null here defers to a
        // poke on a lane whose last run is unknown, so the warmer bills for a
        // premise the read could not establish
        expect(read.answer).toEqual('threw');
        expect(read.error).not.toEqual(null);
      });

      then('🔴 and it does NOT answer the real run it read first', () => {
        // the sharp half. a real `repo-rules` run sits EARLIER in the scan, so a
        // reader that swallowed the fault would hold a valid stamp in hand — a
        // true figure, older than the truth, with no caveat at all
        expect(read.answer).toEqual('threw');
      });

      then('and the fault names the path it could not read', () => {
        // an operator who trips this needs the path, not merely the errno — the
        // log root is shared, so "one args file is unreadable" is unactionable
        expect(String(read.error)).toContain(NAME_OF_RUN_ARTIFACT.args);
      });
    });
  });

  /**
   * .why = the LOG ROOT's own read. `[case1]` proves an ABSENT root answers
   *           null; this proves a root that EXISTS and is not a directory
   *           answers null too, rather than a throw.
   *
   *           `existsSync(logsDir)` then `readdirSync(logsDir)` would be a
   *           check-then-act pair against a live log root a concurrent lane
   *           writes into (`rule.forbid.behavior-hazards`) — one disposition
   *           for "present" and one for "absent", and the fs has more than two:
   *           a path that satisfies `existsSync` and refuses `readdir` falls
   *           through the gap and throws BARE.
   *
   *           the harm is not merely an ugly stack. this runs inside a DETACHED
   *           warmer whose `stdio` is `'ignore'`, so the throw would take the
   *           whole loop down — no retire row, no fault row, no signal anywhere.
   *           the lane goes cold and the ledger's last word is a poke that
   *           looked healthy.
   *
   * .note = the RACE itself — a root that vanishes BETWEEN two calls — is not
   *         clamped here. it is unreachable without a stub, and a clamp that
   *         reached it by a cast would assert the cast
   *         (`rule.forbid.integration.mocks`). ONE read closes it by
   *         CONSTRUCTION: there is no window between two.
   *
   *         ⇒ what this case CAN reach with no stub is the same gap through a
   *         different door. a log root that is a FILE answers ENOTDIR, which
   *         `CODES_OF_ABSENCE` holds beside ENOENT on purpose — *"a path whose
   *         parent is a file answers ENOTDIR for the identical reason ENOENT
   *         would: the artifact is not there."*
   */
  given('[case5] a log root that is present and NOT a directory', () => {
    const cwd = genTempDir({ slug: 'warmer-lastrun-rootfile' });
    const logsDir = asReviewLogsDir({ cwd });

    // the log ROOT is a file. `existsSync` answers true, so the old pair
    // walked straight into a `readdirSync` that could only throw
    fs.mkdirSync(path.dirname(logsDir), { recursive: true });
    fs.writeFileSync(logsDir, 'not a directory');

    when('[t0] the warmer asks when this lane last ran', () => {
      then('🔴 it answers null rather than takes the warmer down', async () => {
        // "this tree has no review log" is the honest reading of a root that is
        // not a directory, and it is the one a DETACHED loop can act on. the old
        // pair threw instead, from a process with no terminal to throw into
        expect(
          await getOneReviewerLastRunAt({
            cwd,
            reviewer: 'repo-rules',
            since: SINCE_OF_ALL_TIME,
          }),
        ).toEqual(null);
      });

      /**
       * the null here is a READING, never a swallowed fault — the allowlist is
       * consulted, so an errno OUTSIDE it still throws. that half is NOT asserted
       * here on purpose: it is `getAllEntriesInDir`'s own contract, clamped in
       * `getAllEntriesInDir`'s own suite, and a second copy of it in this file
       * would grade a neighbour rather than this read. what `[case4]` above proves
       * is the same property at THIS operation's grain — a defect in an args file
       * fails loud — so the pair of cases brackets both dispositions.
       */
    });
  });

  /**
   * .why = the clamp on the WRITER, not the fixture. every case above seeds its
   *        args through `setOneReviewRunLogDir`, so they prove the reader agrees
   *        with the fixture and naught more. a reader once looked for `output`
   *        on the root while `setInputArtifacts` nests it under `args`; the
   *        fixture nested it on the root too, so every case stayed green while no
   *        production run ever matched and the warmer never deferred.
   *
   *        ⇒ this run is written by the production writer itself, so a reader
   *        that drifts from it fails here whatever the fixture says
   */
  given('[case6] a run whose args were written by setInputArtifacts', () => {
    const cwd = genTempDir({ slug: 'warmer-lastrun-writer' });
    const stamp = '2026-09-21T09-00-00-000Z';
    const dir = path.join(
      asReviewLogsDir({ cwd }),
      `${stamp}.pid${process.pid}.${getUuid()}`,
    );

    when('[t0] the warmer asks when that lane last ran', () => {
      const read = useBeforeAll(async () => {
        const prompt = `# review\n## output format\nfmt\n## rules\n${'r'.repeat(40)}`;
        await setInputArtifacts({
          logDir: dir,
          args: {
            rules: 'rules/*.md',
            output: asGuardReviewOutputPath({
              route: '.behavior/v2026_09_20.review-cost-meter',
              stone: '5.1.execution.from_vision',
              slug: 'repo-rules',
              iteration: 3,
              index: 1,
            }),
            focus: 'push',
            goal: 'representative',
            polluters: 'drop',
            join: 'intersect',
            brain: 'openrouter/deepseek/flash',
            optional: [],
            partitions: [],
            partition: null,
          },
          scope: {
            ruleFiles: [],
            refFiles: [],
            conversationFiles: [],
            targetFiles: [],
          },
          metrics: {
            tokenEstimate: 0,
            contextWindowPercent: 0,
            costEstimate: asIsoPriceHuman('USD 0.00'),
          },
          prompt,
          composition: getOnePromptComposition({
            focus: 'push',
            rules: [{ path: 'rules/rule.md', content: 'r'.repeat(40) }],
            refs: [],
            conversation: [],
            targets: [],
            promptHeadStatic: prompt,
            promptTailVariable: '',
          }),
        });
        return {
          lastRunAt: await getOneReviewerLastRunAt({
            cwd,
            reviewer: 'repo-rules',
            since: SINCE_OF_ALL_TIME,
          }),
        };
      });

      then('🔴 it answers that run, never null', () => {
        // null here is the silent defect: the warmer reads "never ran" off a
        // run that did, and pays a poke a real review already made redundant
        expect(read.lastRunAt?.getTime()).toEqual(
          asLogDirMintedAt({ name: stamp }).getTime(),
        );
      });
    });
  });
});
