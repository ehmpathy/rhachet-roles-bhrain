import { asRefusalHintLines } from './asRefusalHintLines';

const TEST_CASES = [
  {
    description:
      'a plain hint renders as its own did-you-know block, never a hint leaf',
    given: { lines: [], hint: 'run with --help for --mode' },
    expect: {
      lines: ['', '✨ did you know?', '   └─ run with --help for --mode'],
    },
  },
  {
    description:
      'a plain hint after detail rows closes the tree on its last row first',
    given: {
      lines: ['   ├─ received: x', '   ├─ known', '   │  └─ a'],
      hint: 'run with --help for usage',
    },
    expect: {
      lines: [
        '   ├─ received: x',
        '   └─ known',
        '      └─ a',
        '',
        '✨ did you know?',
        '   └─ run with --help for usage',
      ],
    },
  },
  {
    description:
      'a paste-ready fix keeps its own fix label, as the closed leaf of the tree',
    given: { lines: [], hint: "fix: --partition 'src=src/**'" },
    expect: { lines: ["   └─ fix: --partition 'src=src/**'"] },
  },
];

describe('asRefusalHintLines', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      const lines = asRefusalHintLines(thisCase.given);
      expect(lines).toEqual(thisCase.expect.lines);
      // no row ever wears a `hint:` label
      expect(lines.join('\n')).not.toContain('hint:');
    }),
  );
});
