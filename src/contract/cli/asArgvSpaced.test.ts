import { asArgvSpaced } from './asArgvSpaced';

/**
 * .what = data-driven cases for asArgvSpaced across argv token shapes
 * .why = the `--flag=value` split is shared by three commands; a split on the wrong `=`,
 *        or a split of a token that is no flag, would misread a human's input in all three
 */
const CASES: {
  description: string;
  args: string[];
  expected: string[];
}[] = [
  {
    description: 'the space form passes through',
    args: ['--of', 'tree'],
    expected: ['--of', 'tree'],
  },
  {
    description: 'the equals form splits into the space form',
    args: ['--of=tree'],
    expected: ['--of', 'tree'],
  },
  {
    description: 'a value that holds an equals splits on the first one only',
    args: ['--paths=a=b'],
    expected: ['--paths', 'a=b'],
  },
  {
    description: 'an empty value after the equals yields an empty value',
    args: ['--of='],
    expected: ['--of', ''],
  },
  {
    description: 'a bare double dash passes through',
    args: ['--'],
    expected: ['--'],
  },
  {
    description: 'a short flag passes through',
    args: ['-h'],
    expected: ['-h'],
  },
  {
    description:
      'a positional with an equals passes through, since it leads with no --',
    args: ['positional=x'],
    expected: ['positional=x'],
  },
];

describe('asArgvSpaced', () => {
  CASES.forEach((thisCase) =>
    test(thisCase.description, () => {
      expect(asArgvSpaced({ args: thisCase.args })).toEqual(thisCase.expected);
    }),
  );
});
