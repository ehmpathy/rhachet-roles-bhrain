import { given, then, when } from 'test-fns';

import { asLinesWithFenceState } from './asLinesWithFenceState';

const TEST_CASES = [
  {
    description: 'text with no fence: no line is a fence or in one',
    given: { text: 'a\nb' },
    expect: {
      output: [
        { line: 'a', isFence: false, inFence: false },
        { line: 'b', isFence: false, inFence: false },
      ],
    },
  },
  {
    description:
      'a fenced block: the marks are fences, never in one; the body is in one',
    given: { text: 'x\n```ts\ncode\n```\ny' },
    expect: {
      output: [
        { line: 'x', isFence: false, inFence: false },
        { line: '```ts', isFence: true, inFence: false },
        { line: 'code', isFence: false, inFence: true },
        { line: '```', isFence: true, inFence: false },
        { line: 'y', isFence: false, inFence: false },
      ],
    },
  },
  {
    description: 'an indented fence mark still opens and closes',
    given: { text: '  ```\n  body\n  ```' },
    expect: {
      output: [
        { line: '  ```', isFence: true, inFence: false },
        { line: '  body', isFence: false, inFence: true },
        { line: '  ```', isFence: true, inFence: false },
      ],
    },
  },
  {
    description: 'blank lines keep their entry, so an index is its line index',
    given: { text: '```\n\nbody\n```\n\nz' },
    expect: {
      output: [
        { line: '```', isFence: true, inFence: false },
        { line: '', isFence: false, inFence: true },
        { line: 'body', isFence: false, inFence: true },
        { line: '```', isFence: true, inFence: false },
        { line: '', isFence: false, inFence: false },
        { line: 'z', isFence: false, inFence: false },
      ],
    },
  },
  {
    description: 'an unclosed fence holds every line after it',
    given: { text: '```\na\nb' },
    expect: {
      output: [
        { line: '```', isFence: true, inFence: false },
        { line: 'a', isFence: false, inFence: true },
        { line: 'b', isFence: false, inFence: true },
      ],
    },
  },
];

describe('asLinesWithFenceState', () => {
  TEST_CASES.forEach((thisCase, index) =>
    given(`[case${index + 1}] ${thisCase.description}`, () => {
      when('[t0] the text is folded', () => {
        then('each line carries its fence state, at its own index', () => {
          const output = asLinesWithFenceState({ text: thisCase.given.text });
          expect(output).toEqual(thisCase.expect.output);
          expect(output.length).toEqual(thisCase.given.text.split('\n').length);
        });
      });
    }),
  );
});
