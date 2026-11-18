import { asTermsHookEntryCountText } from './asTermsHookEntryCountText';

const TEST_CASES: {
  description: string;
  count: number;
  expected: string;
}[] = [
  { description: 'one reads as an entry', count: 1, expected: 'an entry' },
  { description: 'two reads as their count', count: 2, expected: '2 entries' },
  {
    description: 'three reads as their count',
    count: 3,
    expected: '3 entries',
  },
];

describe('asTermsHookEntryCountText', () => {
  TEST_CASES.forEach((thisCase) => {
    test(thisCase.description, () => {
      expect(asTermsHookEntryCountText({ count: thisCase.count })).toEqual(
        thisCase.expected,
      );
    });
  });
});
