import { maskVerdictCounts } from './maskVerdictCounts';

const TEST_CASES = [
  {
    description: 'a findings tally masks to [N], its glyph masked beside it',
    given: { text: '├─ 2 blockers 🔴\n└─ 1 nitpick 🟠\n' },
    expect: { text: '├─ [N] blockers [GLYPH]\n└─ [N] nitpicks [GLYPH]\n' },
  },
  {
    description: 'a clean tally masks too, with its ✓ — a caller keeps a pass case unmasked',
    given: { text: '└─ 0 blockers ✓\n' },
    expect: { text: '└─ [N] blockers [GLYPH]\n' },
  },
  {
    description: 'a tally with no glyph still gains the [GLYPH] slot, so shapes agree',
    given: { text: '3 blockers\n0 nitpicks' },
    expect: { text: '[N] blockers [GLYPH]\n[N] nitpicks [GLYPH]' },
  },
  {
    description: 'a tally inside a quoted string masks up to the quote',
    given: { text: '"1 blocker 🔴"' },
    expect: { text: '"[N] blockers [GLYPH]"' },
  },
  {
    description: 'the judge threshold masks its count and keeps its > bound',
    given: { text: 'blockers exceed threshold (2 > 0)' },
    expect: { text: 'blockers exceed threshold ([N] > 0)' },
  },
  {
    description: 'a peer budget slot is the guard arithmetic, left untouched',
    given: { text: '(l1, 1/3)' },
    expect: { text: '(l1, 1/3)' },
  },
  {
    description: 'text with no tally is returned unchanged',
    given: { text: '🦉 needs your talons\npassage = blocked' },
    expect: { text: '🦉 needs your talons\npassage = blocked' },
  },
];

describe('maskVerdictCounts', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(maskVerdictCounts(thisCase.given.text)).toEqual(
        thisCase.expect.text,
      );
    }),
  );
});
