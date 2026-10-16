import { given, then, when } from 'test-fns';

import { asReviewSubprocessCapture } from './asReviewSubprocessCapture';

describe('asReviewSubprocessCapture', () => {
  given('[case1] a child that exited on its own', () => {
    when('[t0] it exited 0', () => {
      then('the capture keeps its output and its exit', () => {
        expect(
          asReviewSubprocessCapture({
            stdout: 'ok',
            stderr: '',
            code: 0,
            killed: false,
            timeoutMs: 1_000,
          }),
        ).toEqual({ stdout: 'ok', stderr: '', exitCode: 0 });
      });
    });

    when('[t1] it exited 2 with a reason on stderr', () => {
      then('the capture keeps the code and the reason', () => {
        expect(
          asReviewSubprocessCapture({
            stdout: '',
            stderr: 'bad flag',
            code: 2,
            killed: false,
            timeoutMs: 1_000,
          }),
        ).toEqual({ stdout: '', stderr: 'bad flag', exitCode: 2 });
      });
    });

    when('[t2] 🔴 it reported no code at all', () => {
      then('the capture reads exit 1, never a clean 0', () => {
        expect(
          asReviewSubprocessCapture({
            stdout: '',
            stderr: '',
            code: null,
            killed: false,
            timeoutMs: 1_000,
          }).exitCode,
        ).toEqual(1);
      });
    });
  });

  given('[case2] 🔴 a child killed at its bound', () => {
    when('[t0] it had written partial output first', () => {
      const capture = asReviewSubprocessCapture({
        stdout: 'half a review',
        stderr: 'some noise',
        code: null,
        killed: true,
        timeoutMs: 90_000,
      });

      then('it reads as a timeout malfunction, exit 1', () => {
        expect(capture.exitCode).toEqual(1);
        expect(capture.stderr).toContain(
          '💥 MalfunctionError: review timed out after',
        );
      });

      then('the partial stdout is kept for the tally', () => {
        expect(capture.stdout).toEqual('half a review');
      });

      then('the stderr line is pinned', () => {
        expect(capture.stderr).toMatchSnapshot();
      });
    });
  });
});
