import { isTranscriptRecord } from './isTranscriptRecord';

const TEST_CASES = [
  {
    description: 'a plain object is a record',
    value: { type: 'user' },
    output: true,
  },
  { description: 'an empty object is a record', value: {}, output: true },
  { description: 'null is not a record', value: null, output: false },
  {
    description: 'an array is not a record',
    value: [{ type: 'user' }],
    output: false,
  },
  {
    description: 'a bare string is not a record',
    value: 'user',
    output: false,
  },
  { description: 'a bare number is not a record', value: 7, output: false },
];

describe('isTranscriptRecord', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isTranscriptRecord(thisCase.value)).toEqual(thisCase.output);
    }),
  );
});
