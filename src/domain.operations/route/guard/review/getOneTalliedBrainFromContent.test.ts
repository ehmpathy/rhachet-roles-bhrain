import { getOneTalliedBrainFromContent } from './getOneTalliedBrainFromContent';
import { TALLIED_FOOTER_PREFIX } from './TALLIED_FOOTER_PREFIX';

const TEST_CASES = [
  {
    description: 'reads the pinned slug off the footer line',
    given: {
      content: [
        '└─ tallied',
        '   ├─ 1 blocker',
        '   ├─ 0 nitpicks',
        `   └─ ${TALLIED_FOOTER_PREFIX}openrouter/deepseek/flash/v4.1`,
      ].join('\n'),
    },
    expect: { output: 'openrouter/deepseek/flash/v4.1' },
  },
  {
    description: 'answers null where no sub-brain tallied',
    given: {
      content: ['└─ tallied', '   ├─ 1 blocker', '   └─ 0 nitpicks'].join('\n'),
    },
    expect: { output: null },
  },
  {
    description:
      'answers null where stdout QUOTES the phrase and no footer is present',
    given: {
      content: [
        '├─ stdout',
        `│  ├─ see: expect(result).toContain('${TALLIED_FOOTER_PREFIX}');`,
        '│  └─ 0 blockers',
        '└─ tallied',
        '   └─ 0 blockers',
      ].join('\n'),
    },
    expect: { output: null },
  },
  {
    description:
      'reads the footer, never a quote above it, where both are present',
    given: {
      content: [
        '├─ stdout',
        `│  ├─ see: expect(result).toContain('${TALLIED_FOOTER_PREFIX}');`,
        '│  └─ 1 blocker',
        '└─ tallied',
        '   ├─ 1 blocker',
        `   └─ ${TALLIED_FOOTER_PREFIX}openrouter/deepseek/flash/v4.1`,
      ].join('\n'),
    },
    expect: { output: 'openrouter/deepseek/flash/v4.1' },
  },
  {
    description: 'answers null where the footer carries no slug',
    given: { content: `   └─ ${TALLIED_FOOTER_PREFIX}` },
    expect: { output: null },
  },
];

describe('getOneTalliedBrainFromContent', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(getOneTalliedBrainFromContent(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
