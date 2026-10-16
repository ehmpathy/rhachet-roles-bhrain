import * as path from 'path';
import { given, then, when } from 'test-fns';

import { asReviewWarmerDir, DIR_OF_WARMERS } from './asReviewWarmerDir';
import { asReviewWarmerOutputPath } from './asReviewWarmerOutputPath';

const CWD_OF_TEST = path.join('/tmp', 'a-tree');

/**
 * .what = two run slugs of the shape `genLogDirName` mints, an hour apart
 * .why = real slugs, never `run-a`/`run-b` — the escaped iso stamp leads and is of
 *        fixed width, so a lexical sort of these names is a chronological one.
 *
 * .note = the pid and uuid sort against the clock on purpose (`pid999` before
 *         `pid100`, `zzzzzzzz` before `aaaaaaaa`), so only the leading stamp can
 *         order this pair correctly — a clamp that agreed on every segment would
 *         pass even with the segments reversed.
 */
const RUN_OF_FIRST = '2026-09-26T09-00-00-000Z.pid999.zzzzzzzz';
const RUN_OF_LATER = '2026-09-26T10-00-00-000Z.pid100.aaaaaaaa';

describe('asReviewWarmerDir and the paths it roots', () => {
  given('[case1] an ordinary reviewer slug', () => {
    when('[t0] its warmer paths are composed', () => {
      then('the dir is keyed by reviewer, under the declared root', () => {
        // keyed by reviewer, never by run — a lane has at most one live warmer
        // across the many rounds a guard drives it
        expect(
          asReviewWarmerDir({ cwd: CWD_OF_TEST, reviewer: 'repo-rules' }),
        ).toEqual(
          path.join(CWD_OF_TEST, DIR_OF_WARMERS, 'reviewer=repo-rules'),
        );
      });

      then('the output log names the RUN the warmer was spawned for', () => {
        expect(
          path.basename(
            asReviewWarmerOutputPath({
              cwd: CWD_OF_TEST,
              reviewer: 'repo-rules',
              run: RUN_OF_FIRST,
            }),
          ),
        ).toEqual(`output.${RUN_OF_FIRST}.log`);
      });
    });

    /**
     * .why = the whole of bar 9b. the key is the run, never `attempt` (1..k within
     *        one warmer's life, reset to 1 on the next spawn) — attempt parts the
     *        pokes of one warmer but not warmers from each other. keyed by attempt,
     *        `cat output.*.log` would yield every attempt-1 row across all history
     *        then every attempt-2, k interleaved chronologies sorted by poke index
     *        rather than time, so a driver checking a live spender could read a
     *        week-old row as current.
     */
    when('[t1] one lane is warmed across two rounds', () => {
      then(
        '🔴 each ROUND gets its own file — no two warmers interleave',
        () => {
          const ofFirstRound = asReviewWarmerOutputPath({
            cwd: CWD_OF_TEST,
            reviewer: 'repo-rules',
            run: RUN_OF_FIRST,
          });
          const ofLaterRound = asReviewWarmerOutputPath({
            cwd: CWD_OF_TEST,
            reviewer: 'repo-rules',
            run: RUN_OF_LATER,
          });
          expect(ofLaterRound).not.toEqual(ofFirstRound);
        },
      );

      then('🔴 and the glob over them sorts by the CLOCK', () => {
        // the second property `cat output.*.log` needs, and it belongs to the run
        // slug rather than this join: `genLogDirName` leads with an escaped iso
        // stamp of fixed width, so a lexical sort of these names is chronological.
        // a spawn-time uuid would part the files and scramble their order
        expect(
          [
            asReviewWarmerOutputPath({
              cwd: CWD_OF_TEST,
              reviewer: 'repo-rules',
              run: RUN_OF_LATER,
            }),
            asReviewWarmerOutputPath({
              cwd: CWD_OF_TEST,
              reviewer: 'repo-rules',
              run: RUN_OF_FIRST,
            }),
          ].sort(),
        ).toEqual([
          asReviewWarmerOutputPath({
            cwd: CWD_OF_TEST,
            reviewer: 'repo-rules',
            run: RUN_OF_FIRST,
          }),
          asReviewWarmerOutputPath({
            cwd: CWD_OF_TEST,
            reviewer: 'repo-rules',
            run: RUN_OF_LATER,
          }),
        ]);
      });
    });

    when('[t2] one warmer spends every poke of its plan', () => {
      then('🔴 all k rows land in ONE file — one chronology, one block', () => {
        // the other half of bar 9b: the run is fixed for a warmer's whole life, so
        // the attempt index cannot reach this path at all
        const ofEveryAttempt = [1, 2, 3, 12].map(() =>
          asReviewWarmerOutputPath({
            cwd: CWD_OF_TEST,
            reviewer: 'repo-rules',
            run: RUN_OF_FIRST,
          }),
        );
        expect(new Set(ofEveryAttempt).size).toEqual(1);
      });
    });
  });

  given('[case2] a slug that would escape the cache dir', () => {
    /**
     * .why = the slug is not a constant — it is recovered from a guard's output
     *        path by `asReviewRunIdentity`, whose `slug` group is `.+`, so it
     *        carries whatever a lane's filename carried, separators and all. the
     *        harm is a write outside the tree's cache dir: a warmer creates its
     *        dir with `recursive: true` and writes a pid file into it, so a
     *        traversal plants a file at an arbitrary path, and a driver reading
     *        `logs:` in the stdout is pointed at it as though it were ours.
     */
    when('[t0] the slug carries a parent traversal', () => {
      const dir = asReviewWarmerDir({
        cwd: CWD_OF_TEST,
        reviewer: '../../etc/cron.d/x',
      });

      then('🔴 it stays under the warmers root', () => {
        expect(
          dir.startsWith(path.join(CWD_OF_TEST, DIR_OF_WARMERS) + path.sep),
        ).toEqual(true);
      });

      then('🔴 and no SEPARATOR survives into the segment', () => {
        // the property is that one segment sits below the root, asserted on the
        // remainder rather than `path.basename` — basename returns the last
        // segment by definition, so it can never hold a separator, even where an
        // unsanitized `path.join` popped the `..` and traversed.
        //
        // `..` alone is harmless — `reviewer=..-..-etc-cron.d-x` is one ordinary
        // segment. it is the separator that traverses, which is why the negatives
        // lead: the separator is the security property, the exact string is the
        // narrower check
        const root = path.join(CWD_OF_TEST, DIR_OF_WARMERS) + path.sep;
        const below = dir.slice(root.length);
        expect(below).not.toContain(path.sep);
        expect(below).not.toContain('/');
        expect(below).toEqual('reviewer=..-..-etc-cron.d-x');
      });
    });

    when('[t1] the slug carries shell metacharacters', () => {
      then('they are replaced rather than carried into a path', () => {
        expect(
          path.basename(
            asReviewWarmerDir({ cwd: CWD_OF_TEST, reviewer: 'a;rm -rf $HOME' }),
          ),
        ).toEqual('reviewer=a-rm--rf--HOME');
      });
    });

    when('[t2] the slug is one a real guard lane carries', () => {
      then(
        'it passes through untouched — the allowlist is not a mangle',
        () => {
          // a sanitizer that mangled real slugs would break the findsert — two
          // rounds of one lane would key on different dirs and both warmers spawn
          for (const slug of ['repo-rules', 'mech-failhides', 'ergo.cli_v2'])
            expect(
              path.basename(
                asReviewWarmerDir({ cwd: CWD_OF_TEST, reviewer: slug }),
              ),
            ).toEqual(`reviewer=${slug}`);
        },
      );
    });
  });
});
