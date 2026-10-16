import { getAllNamesOfUnmeasuredFields } from '@src/domain.operations/review/meter/getAllNamesOfUnmeasuredFields';
import { isRealizedTokenRecordComplete } from '@src/domain.operations/review/meter/isRealizedTokenRecordComplete';

const TEST_CASES: {
  description: string;
  given: {
    tokens: {
      input: unknown;
      inputCacheCreation: unknown;
      inputCacheRead: unknown;
      output: unknown;
    };
  };
  expect: { complete: boolean; absent: string[] };
}[] = [
  {
    description: 'a record with every token figure is complete',
    given: {
      tokens: {
        input: 10,
        inputCacheCreation: 0,
        inputCacheRead: 5,
        output: 3,
      },
    },
    expect: { complete: true, absent: [] },
  },
  {
    description: 'a zero figure is a measured figure, never an absent one',
    given: {
      tokens: {
        input: 0,
        inputCacheCreation: 0,
        inputCacheRead: 0,
        output: 0,
      },
    },
    expect: { complete: true, absent: [] },
  },
  {
    description: 'a record torn of its output and cache read names both',
    given: {
      tokens: {
        input: 10,
        inputCacheCreation: 0,
        inputCacheRead: undefined,
        output: undefined,
      },
    },
    expect: { complete: false, absent: ['inputCacheRead', 'output'] },
  },
  {
    description:
      '🔴 a null figure — a write-side NaN as json stores it — is unmeasured, never a 0',
    given: {
      tokens: {
        input: 10,
        inputCacheCreation: 0,
        inputCacheRead: null,
        output: 3,
      },
    },
    expect: { complete: false, absent: ['inputCacheRead'] },
  },
  {
    description:
      '🔴 a figure written as a string is unmeasured, never concatenated into a sum',
    given: {
      tokens: {
        input: '12',
        inputCacheCreation: 0,
        inputCacheRead: 5,
        output: 3,
      },
    },
    expect: { complete: false, absent: ['input'] },
  },
  {
    description: '🔴 a non-finite figure is unmeasured',
    given: {
      tokens: {
        input: 10,
        inputCacheCreation: Number.NaN,
        inputCacheRead: 5,
        output: Number.POSITIVE_INFINITY,
      },
    },
    expect: { complete: false, absent: ['inputCacheCreation', 'output'] },
  },
];

describe('isRealizedTokenRecordComplete', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(isRealizedTokenRecordComplete(thisCase.given)).toEqual(
        thisCase.expect.complete,
      );
      expect(
        getAllNamesOfUnmeasuredFields({ fields: thisCase.given.tokens }),
      ).toEqual(thisCase.expect.absent);
    }),
  );
});
