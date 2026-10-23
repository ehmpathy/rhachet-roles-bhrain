import { asTreeBranchMarkers } from './asTreeBranchMarkers';

const TEST_CASES = [
  {
    description: 'a child with a peer after it gets a tee and a peer bar',
    isLast: false,
    output: { elbow: '├─', stem: '│  ' },
  },
  {
    description: 'the last child gets an elbow and a blank stem',
    isLast: true,
    output: { elbow: '└─', stem: '   ' },
  },
];

describe('asTreeBranchMarkers', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(asTreeBranchMarkers({ isLast: thisCase.isLast })).toEqual(
        thisCase.output,
      );
    }),
  );
});
