import { asFlagListForDisplay } from './asFlagListForDisplay';

const TEST_CASES = [
  {
    description: 'prefixes a bare flag name with its dashes',
    given: { flags: ['diffs'] },
    expect: { output: '--diffs' },
  },
  {
    description: 'leaves a flag that already carries its dashes as is',
    given: { flags: ['--bogus-flag'] },
    expect: { output: '--bogus-flag' },
  },
  {
    description: 'leaves a short flag with its one dash as typed',
    given: { flags: ['-j'] },
    expect: { output: '-j' },
  },
  {
    description: 'joins several flags with a comma',
    given: { flags: ['focus', '--goal'] },
    expect: { output: '--focus, --goal' },
  },
  {
    description: 'renders an empty list as an empty line',
    given: { flags: [] },
    expect: { output: '' },
  },
];

describe('asFlagListForDisplay', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asFlagListForDisplay({ flags: thisCase.given.flags })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
