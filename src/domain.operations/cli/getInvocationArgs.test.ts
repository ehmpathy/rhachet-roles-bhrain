import { getInvocationArgs } from './getInvocationArgs';

/**
 * .what = data-driven cases for getInvocationArgs across argv shapes
 * .why = the eval-mode offset is the exact spot the review flagged: a bare positional
 *        token must be KEPT (so a downstream guard can reject it), never dropped by the
 *        wrong slice — these cases pin that behavior
 */
const CASES: {
  description: string;
  argv: string[];
  expected: string[];
}[] = [
  {
    description: 'eval mode: a --flag second arg is kept (slice 1)',
    argv: ['node', '--when', 'hook.onStop'],
    expected: ['--when', 'hook.onStop'],
  },
  {
    description: 'eval mode: a BARE positional second arg is KEPT, not dropped',
    // the review flagged this: the buggy variant sliced it away before any guard
    // could reject it, so a stray token silently reached the clone face that writes
    argv: ['node', 'foo'],
    expected: ['foo'],
  },
  {
    description: 'eval mode: no args at all → empty',
    argv: ['node'],
    expected: [],
  },
  {
    description: 'normal mode: a .js entrypoint path is skipped (slice 2)',
    argv: ['node', '/repo/dist/cli/learn.js', '--when', 'hook.onStop'],
    expected: ['--when', 'hook.onStop'],
  },
  {
    description: 'normal mode: a .ts entrypoint path is skipped (slice 2)',
    argv: ['node', '/repo/src/cli/learn.ts', '--help'],
    expected: ['--help'],
  },
  {
    description: 'the posix `--` end-of-options marker is filtered out',
    argv: ['node', '--', '--when', 'hook.onStop'],
    expected: ['--when', 'hook.onStop'],
  },
  {
    description: 'a lone `--` yields no args (clone-face no-op)',
    argv: ['node', '--'],
    expected: [],
  },
];

describe('getInvocationArgs', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(getInvocationArgs(thisCase.argv)).toEqual(thisCase.expected);
    }),
  );
});
