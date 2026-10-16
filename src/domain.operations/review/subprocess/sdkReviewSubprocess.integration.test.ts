import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { sdkReviewSubprocess } from './sdkReviewSubprocess';

/**
 * .what = the two capture tactics, each against a real child process
 * .why = the tactics are the boundary likeliest to drift from each other, so each case runs
 *        BOTH and asserts they settle into the same capture
 */
describe('sdkReviewSubprocess', () => {
  const cwd = genTempDir({ slug: 'sdk-review-subprocess' });
  const env = { ...process.env };

  /**
   * .what = runs one cmd through both tactics, and the chunks the streamed one teed
   */
  const runBoth = async (input: { cmd: string; timeoutMs: number }) => {
    const chunks: string[] = [];
    const [viaExec, viaSpawn] = await Promise.all([
      sdkReviewSubprocess.exec({
        cmd: input.cmd,
        cwd,
        env,
        timeoutMs: input.timeoutMs,
      }),
      sdkReviewSubprocess.spawn({
        cmd: input.cmd,
        cwd,
        env,
        timeoutMs: input.timeoutMs,
        onStdoutChunk: (chunk) => chunks.push(chunk),
      }),
    ]);
    return { viaExec, viaSpawn, chunks };
  };

  given('[case1] a child that prints and exits 0', () => {
    when('[t0] it runs through each tactic', () => {
      const result = useThen('both settle', async () =>
        runBoth({ cmd: 'echo "2 blockers"', timeoutMs: 30_000 }),
      );

      then('both capture the same stdout and exit 0', () => {
        expect(result.viaExec).toEqual({
          stdout: '2 blockers\n',
          stderr: '',
          exitCode: 0,
        });
        expect(result.viaSpawn).toEqual(result.viaExec);
      });

      then('the streamed tactic teed the stdout live', () => {
        expect(result.chunks.join('')).toEqual('2 blockers\n');
      });
    });
  });

  given('[case2] a child that exits non-zero', () => {
    when('[t0] it runs through each tactic', () => {
      const result = useThen('both settle', async () =>
        runBoth({ cmd: 'echo out; echo err 1>&2; exit 3', timeoutMs: 30_000 }),
      );

      then('both keep the output, the stderr, and the code', () => {
        expect(result.viaExec).toEqual({
          stdout: 'out\n',
          stderr: 'err\n',
          exitCode: 3,
        });
        expect(result.viaSpawn).toEqual(result.viaExec);
      });
    });
  });

  given('[case3] 🔴 a child that outlives its bound', () => {
    when('[t0] it runs through each tactic', () => {
      const result = useThen('both settle', async () =>
        runBoth({ cmd: 'sleep 5', timeoutMs: 300 }),
      );

      then('both read the kill as a timeout malfunction, exit 1', () => {
        expect(result.viaExec.exitCode).toEqual(1);
        expect(result.viaExec.stderr).toContain(
          '💥 MalfunctionError: review timed out after',
        );
        expect(result.viaSpawn).toEqual(result.viaExec);
      });
    });
  });

  given('[case4] a cwd that does not exist', () => {
    when('[t0] the streamed tactic spawns there', () => {
      then('it fails loud, never a capture', async () => {
        const error = await getError(
          sdkReviewSubprocess.spawn({
            cmd: 'echo hi',
            cwd: `${cwd}/absent`,
            env,
            timeoutMs: 30_000,
            onStdoutChunk: () => undefined,
          }),
        );
        // the child_process fault comes from node's own realm, so assert its code, not its class
        expect(error).toMatchObject({ code: 'ENOENT' });
      });
    });
  });
});
