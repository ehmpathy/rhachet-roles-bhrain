import { given, then, when } from 'test-fns';

import { getOneOffsetOfFirstBlockMarker } from './getOneOffsetOfFirstBlockMarker';

const MARKERS = ['## target', '## rules'];

const TEST_CASES: Array<{
  description: string;
  given: { text: string; from: number };
  expected: number;
}> = [
  {
    description: 'the target header opens the first block',
    given: { text: '## output format\n## target\n## rules', from: 0 },
    expected: 17,
  },
  {
    description: 'the rubric header opens it, in the prior layout',
    given: { text: '## output format\n## rules\n## target', from: 0 },
    expected: 17,
  },
  {
    description: 'a header ahead of the cursor is skipped',
    given: { text: '## rules\n## output format\n## target', from: 9 },
    expected: 26,
  },
  {
    description: 'no header at or after the cursor reads -1',
    given: { text: '## target\n## output format', from: 10 },
    expected: -1,
  },
];

describe('getOneOffsetOfFirstBlockMarker', () => {
  given('[case1] a table of texts and cursors', () => {
    TEST_CASES.forEach((thisCase, index) => {
      when(`[t${index}] ${thisCase.description}`, () => {
        then('it reads the expected offset', () => {
          expect(
            getOneOffsetOfFirstBlockMarker({
              ...thisCase.given,
              markers: MARKERS,
            }),
          ).toEqual(thisCase.expected);
        });
      });
    });
  });
});
