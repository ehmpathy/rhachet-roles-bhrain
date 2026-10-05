import { asConstraintRefusalText } from './asConstraintRefusalText';

const TEST_CASES: {
  description: string;
  given: { message: string };
  expect: { output: string };
}[] = [
  {
    description: 'a foreign ConstraintError header is kept as is',
    given: { message: '✋ ConstraintError: \n🔐 keyrack' },
    expect: { output: '✋ ConstraintError: \n🔐 keyrack' },
  },
  {
    description: 'a class-headed message gains only the glyph',
    given: { message: 'BadRequestError: role not found' },
    expect: { output: '✋ BadRequestError: role not found' },
  },
  {
    description: 'a message with no class is qualified as a ConstraintError',
    given: { message: 'key absent' },
    expect: { output: '✋ ConstraintError: key absent' },
  },
  {
    description: 'a glyph with no class is qualified, never double-prefixed',
    given: { message: '✋ key absent' },
    expect: { output: '✋ ConstraintError: key absent' },
  },
];

describe('asConstraintRefusalText', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asConstraintRefusalText(thisCase.given)).toEqual(
        thisCase.expect.output,
      );
    }),
  );
});
