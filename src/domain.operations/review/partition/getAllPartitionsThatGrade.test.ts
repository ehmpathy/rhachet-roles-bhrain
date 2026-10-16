import { getAllPartitionsThatGrade } from './getAllPartitionsThatGrade';

const asPartition = (input: {
  name: string;
  narrow: string[];
  commonGraded: string[];
}) => ({ ...input, globs: [], common: input.commonGraded });

const TEST_CASES = [
  {
    description: 'a partition with a narrow target grades',
    given: [asPartition({ name: 'a', narrow: ['a.ts'], commonGraded: [] })],
    expect: ['a'],
  },
  {
    description: 'a partition that grades a common file grades',
    given: [asPartition({ name: 'b', narrow: [], commonGraded: ['v.md'] })],
    expect: ['b'],
  },
  {
    description: 'a partition whose every file is graded elsewhere is dropped',
    given: [
      asPartition({ name: 'a', narrow: ['a.ts'], commonGraded: [] }),
      asPartition({ name: 'c', narrow: [], commonGraded: [] }),
    ],
    expect: ['a'],
  },
];

describe('getAllPartitionsThatGrade', () => {
  TEST_CASES.map((thisCase) =>
    test(thisCase.description, () => {
      expect(
        getAllPartitionsThatGrade({ partitions: thisCase.given }).map(
          (partition) => partition.name,
        ),
      ).toEqual(thisCase.expect);
    }),
  );
});
