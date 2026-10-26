import { getOwnInvocationArgs } from './getOwnInvocationArgs';

/**
 * .what = data-driven cases for getOwnInvocationArgs across argv shapes
 * .why = the harness prepends its identity flags; they must vanish, and no other arg may
 */
const CASES: { description: string; argv: string[]; expected: string[] }[] = [
  {
    description:
      'eval mode: the space-form injected flags and their values are dropped',
    argv: [
      'node',
      '--skill',
      'census.cues',
      '--role',
      'librarian',
      '--repo',
      'bhrain',
      '--glob',
      'a/*.md',
    ],
    expected: ['--glob', 'a/*.md'],
  },
  {
    description: 'the combined injected flags are dropped, each as one token',
    argv: ['node', '--skill=census.cues', '--repo=bhrain', '--emit'],
    expected: ['--emit'],
  },
  {
    description: 'no injected flags: every arg is kept',
    argv: ['node', '--glob', 'a/*.md', '--files'],
    expected: ['--glob', 'a/*.md', '--files'],
  },
  {
    description: 'a lookalike flag is kept',
    argv: ['node', '--skills', 'x'],
    expected: ['--skills', 'x'],
  },
  {
    description: 'no args at all: empty',
    argv: ['node'],
    expected: [],
  },
];

describe('getOwnInvocationArgs', () => {
  CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(getOwnInvocationArgs(thisCase.argv)).toEqual(thisCase.expected);
    });
  });
});
