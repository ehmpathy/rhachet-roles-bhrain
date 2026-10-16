import { UnexpectedCodePathError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { asPartitionRunsOfSettled } from './asPartitionRunsOfSettled';

const asPartition = (input: { name: string }) => ({
  name: input.name,
  globs: [],
  common: [],
  narrow: [`${input.name}.ts`],
  commonGraded: [],
});

describe('asPartitionRunsOfSettled', () => {
  given('[case1] two partitions, one fulfilled and one rejected', () => {
    const partitions = [asPartition({ name: 'a' }), asPartition({ name: 'b' })];
    const settled: PromiseSettledResult<string>[] = [
      { status: 'fulfilled', value: 'verdict-a' },
      { status: 'rejected', reason: new Error('fault-b') },
    ];

    when('[t0] the outcomes are paired', () => {
      const runs = asPartitionRunsOfSettled({ partitions, settled });

      then('each partition carries the outcome at its own position', () => {
        expect(runs.map((run) => run.partition.name)).toEqual(['a', 'b']);
        expect(runs[0]?.outcome).toEqual({
          status: 'fulfilled',
          value: 'verdict-a',
        });
        expect(runs[1]?.outcome.status).toEqual('rejected');
      });
    });
  });

  given('[case2] a count of outcomes unlike the count of partitions', () => {
    const partitions = [asPartition({ name: 'a' }), asPartition({ name: 'b' })];
    const settled: PromiseSettledResult<string>[] = [
      { status: 'fulfilled', value: 'verdict-a' },
    ];

    when('[t0] the outcomes are paired', () => {
      then(
        'it fails loud rather than pair a partition with a hole',
        async () => {
          const error = await getError(async () =>
            asPartitionRunsOfSettled({ partitions, settled }),
          );
          expect(error).toBeInstanceOf(UnexpectedCodePathError);
          expect(error.message).toContain('count of outcomes');
        },
      );
    });
  });
});
