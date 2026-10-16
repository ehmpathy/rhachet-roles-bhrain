import { asErrorMessage } from './asErrorMessage';

const TEST_CASES = [
  {
    description: 'an Error renders its message',
    given: { error: new Error('spawn nvim ENOENT') },
    expect: { output: 'spawn nvim ENOENT' },
  },
  {
    description:
      'an error-shaped object from another realm renders its message',
    given: { error: { message: 'Command failed: codium' } },
    expect: { output: 'Command failed: codium' },
  },
  {
    description: 'a thrown string renders as itself',
    given: { error: 'opener gone' },
    expect: { output: 'opener gone' },
  },
];

describe('asErrorMessage', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asErrorMessage({ error: thisCase.given.error })).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
