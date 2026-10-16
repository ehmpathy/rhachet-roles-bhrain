import { asTreeCauseLines } from './asTreeCauseLines';

const TEST_CASES = [
  {
    description: 'a one-line cause renders as one row',
    given: { cause: 'gh: not found' },
    expect: { lines: ['   ├─ cause: gh: not found'] },
  },
  {
    description:
      'a helpful-error cause drops its metadata json and keeps its hint as a labelled row',
    given: {
      cause:
        'BadRequestError: no latest map\n\n{\n  "choice": "nowhere/glm/flash/latest",\n  "hint": "pass a pinned slug"\n}',
    },
    expect: {
      lines: [
        '   ├─ cause: BadRequestError: no latest map',
        '   │    hint: pass a pinned slug',
      ],
    },
  },
  {
    description:
      'a helpful-error cause with no hint renders its headline alone, no json',
    given: {
      cause:
        '💥 MalfunctionError: withSimpleMutex: the cache backend faulted\n\n{\n  "key": {\n    "given": "hold.a"\n  }\n}',
    },
    expect: {
      lines: [
        '   ├─ cause: 💥 MalfunctionError: withSimpleMutex: the cache backend faulted',
      ],
    },
  },
  {
    description:
      'a cause whose tail is not a json object keeps every line, under the rail',
    given: { cause: 'gh failed\n\n{ not json' },
    expect: { lines: ['   ├─ cause: gh failed', '   │    { not json'] },
  },
  {
    description: 'an empty cause still renders a row, never a blank',
    given: { cause: '' },
    expect: { lines: ['   ├─ cause: (no message)'] },
  },
];

describe('asTreeCauseLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      // the exact rows pin both laws at once: every expected row opens with the
      // three-space rail (no line at column 0, which cut the tree), and no row is a
      // bare json brace (the bag is debug noise in a human frame)
      expect(asTreeCauseLines(thisCase.given)).toEqual(thisCase.expect.lines);
    }),
  );
});
