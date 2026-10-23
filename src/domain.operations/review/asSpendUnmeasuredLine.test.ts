import { asSpendUnmeasuredLine } from '@src/domain.operations/review/asSpendUnmeasuredLine';

const TEST_CASES = [
  {
    description: '🔴 one unmeasured ask reads `1 ask`, never `1 ask(s)`',
    given: { unmeasured: 1 },
    expect: {
      contains: '💥 MalfunctionError: 1 ask may have been billed',
      output:
        "💥 MalfunctionError: 1 ask may have been billed with no reported spend (a runaway with no output count, or a fault a retry swallowed); this run's spend is unmeasured, so metrics.realized.json is not written",
    },
  },
  {
    description: 'two unmeasured asks read `2 asks`',
    given: { unmeasured: 2 },
    expect: {
      contains: '💥 MalfunctionError: 2 asks may have been billed',
      output:
        "💥 MalfunctionError: 2 asks may have been billed with no reported spend (a runaway with no output count, or a fault a retry swallowed); this run's spend is unmeasured, so metrics.realized.json is not written",
    },
  },
];

describe('asSpendUnmeasuredLine', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const line = asSpendUnmeasuredLine(thisCase.given);
      expect(line).toContain(thisCase.expect.contains);
      expect(line).not.toContain('ask(s)');
      expect(line).toContain('metrics.realized.json is not written');

      // the whole line, pinned: its tail clause, separator, and words alike
      expect(line).toEqual(thisCase.expect.output);
    }),
  );
});
