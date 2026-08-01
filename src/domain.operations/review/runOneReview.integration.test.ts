import { given, then, useThen, when } from 'test-fns';

import { genContextReviewBrainSupplyDemo } from '../route/__test_assets__/genContextReviewBrainSupplyDemo';
import { runOneReview } from './runOneReview';

/**
 * .what = integration test for the shared review runner
 * .why = runOneReview is ejected from the guard's runOneStoneGuardReview. it execs a review
 *        command as a subprocess, captures output, tallies via the deterministic regex tactic,
 *        and surfaces the exit code. the brain-fallback + malfunction-promotion + timeout paths
 *        are regression-covered through the guard (runStoneGuardReviews.integration.test.ts,
 *        which now dispatches this same runner), so they are not re-faked here.
 */
const noopContext = genContextReviewBrainSupplyDemo();
const cwd = process.cwd();

describe('runOneReview', () => {
  given('[case1] a review command that emits a clean numeric verdict', () => {
    when('[t0] the runner execs it', () => {
      const run = useThen('it resolves a run', async () =>
        runOneReview(
          {
            cmd: 'echo "blockers: 0\\nnitpicks: 2\\nreview output"',
            timeout: 'PT1M',
            cwd,
          },
          noopContext,
        ),
      );

      then('it exits 0', () => {
        expect(run.exitCode).toEqual(0);
      });

      then('it detects a verdict via the deterministic tactic', () => {
        expect(run.detected).toEqual(true);
        expect(run.tallier).toEqual('deterministic');
      });

      then('it reads the blocker + nitpick counts', () => {
        expect(run.blockers).toEqual(0);
        expect(run.nitpicks).toEqual(2);
      });

      then('it captures stdout', () => {
        expect(run.stdout).toContain('review output');
      });
    });
  });

  given('[case2] a review that exits nonzero but still declares counts', () => {
    when('[t0] the runner execs it', () => {
      const run = useThen('it resolves a run', async () =>
        runOneReview(
          {
            cmd: 'sh -c \'echo "blockers: 3\\nnitpicks: 1"; exit 2\'',
            timeout: 'PT1M',
            cwd,
          },
          noopContext,
        ),
      );

      then('it surfaces the nonzero exit code', () => {
        expect(run.exitCode).toEqual(2);
      });

      then('it still reads the declared counts', () => {
        expect(run.detected).toEqual(true);
        expect(run.blockers).toEqual(3);
        expect(run.nitpicks).toEqual(1);
      });
    });
  });

  given('[case4] a review run with a live stdout tee (the streaming tactic)', () => {
    when('[t0] the runner is passed an onStdoutChunk callback', () => {
      // capture every chunk the runner tees; two writes with a gap prove progressive delivery
      const chunks: string[] = [];
      const run = useThen('it resolves a run', async () =>
        runOneReview(
          {
            cmd: 'sh -c \'printf "blockers: 1\\nnitpicks: 0\\n"; sleep 0.2; printf "review output\\n"\'',
            timeout: 'PT1M',
            cwd,
          },
          {
            ...noopContext,
            onStdoutChunk: (chunk: string) => {
              chunks.push(chunk);
            },
          },
        ),
      );

      then('it tees the child stdout live to the callback', () => {
        expect(chunks.length).toBeGreaterThan(0);
        expect(chunks.join('')).toContain('review output');
      });

      then('the tee is byte-identical to the accumulated capture', () => {
        // the streamed tactic must yield the SAME stdout the buffered exec would — only delivery
        // differs. so the concatenated chunks equal the run's captured stdout.
        expect(chunks.join('')).toEqual(run.stdout);
      });

      then('it tallies the verdict via the spawn path exactly as exec would', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.detected).toEqual(true);
        expect(run.tallier).toEqual('deterministic');
        expect(run.blockers).toEqual(1);
        expect(run.nitpicks).toEqual(0);
      });
    });
  });

  given('[case3] a review that crashes with no verdict', () => {
    when('[t0] the runner execs it', () => {
      const run = useThen('it resolves a run', async () =>
        runOneReview(
          {
            cmd: 'sh -c \'echo "boom, no counts here"; exit 2\'',
            timeout: 'PT1M',
            cwd,
          },
          noopContext,
        ),
      );

      then('it surfaces the nonzero exit code', () => {
        expect(run.exitCode).toEqual(2);
      });

      then('it reports no detected verdict (never a faked 0/0)', () => {
        // .note = the brain fallback is NOT reached — it only rescues an exit-0 review.
        //         a nonzero exit stays a no-verdict, and the counts default to 0 with detected=false.
        expect(run.detected).toEqual(false);
        expect(run.tallier).toEqual(null);
      });
    });
  });
});
