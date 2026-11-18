import { asSettingsText } from './asSettingsText';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';

const SETTINGS: ClaudeSettingsOfRepo = {
  permissions: { allow: ['Bash(echo:*)'] },
};

const TEST_CASES: {
  description: string;
  textFound: string | null;
  expected: string;
}[] = [
  {
    description: 'a new file takes two spaces and a trailer newline',
    textFound: null,
    expected: `${JSON.stringify(SETTINGS, null, 2)}\n`,
  },
  {
    description: 'a two-space file with a trailer keeps both',
    textFound: `${JSON.stringify(SETTINGS, null, 2)}\n`,
    expected: `${JSON.stringify(SETTINGS, null, 2)}\n`,
  },
  {
    description: 'a four-space file keeps four spaces',
    textFound: `${JSON.stringify(SETTINGS, null, 4)}\n`,
    expected: `${JSON.stringify(SETTINGS, null, 4)}\n`,
  },
  {
    description: 'a tab-indented file keeps tabs',
    textFound: `${JSON.stringify(SETTINGS, null, '\t')}\n`,
    expected: `${JSON.stringify(SETTINGS, null, '\t')}\n`,
  },
  {
    description: 'a file saved with no trailer newline stays without one',
    textFound: JSON.stringify(SETTINGS, null, 2),
    expected: JSON.stringify(SETTINGS, null, 2),
  },
  {
    description: 'a one-line file falls back to two spaces',
    textFound: '{}\n',
    expected: `${JSON.stringify(SETTINGS, null, 2)}\n`,
  },
];

describe('asSettingsText', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(
        asSettingsText({ settings: SETTINGS, textFound: thisCase.textFound }),
      ).toEqual(thisCase.expected);
    });
  });
});
