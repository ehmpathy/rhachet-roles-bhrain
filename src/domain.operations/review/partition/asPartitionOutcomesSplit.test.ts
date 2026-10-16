import { asPartitionOutcomesSplit } from './asPartitionOutcomesSplit';

const asPartition = (name: string) => ({
  name,
  globs: [],
  common: [],
  narrow: [],
  commonGraded: [],
});

describe('asPartitionOutcomesSplit', () => {
  test('a fulfilled outcome keeps its verdict; a rejected one keeps its partition and error', () => {
    const error = new Error('terminated');
    const split = asPartitionOutcomesSplit({
      runs: [
        {
          partition: asPartition('src'),
          outcome: { status: 'fulfilled', value: 'verdict of src' },
        },
        {
          partition: asPartition('docs'),
          outcome: { status: 'rejected', reason: error },
        },
      ],
    });
    expect(split.results).toEqual(['verdict of src']);
    expect(split.faults).toEqual([{ partition: asPartition('docs'), error }]);
  });

  test('no runs → no verdicts, no faults', () => {
    expect(asPartitionOutcomesSplit({ runs: [] })).toEqual({
      results: [],
      faults: [],
    });
  });
});
