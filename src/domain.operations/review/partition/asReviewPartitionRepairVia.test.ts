import { given, then, when } from 'test-fns';

import { asReviewPartitionRepairVia } from './asReviewPartitionRepairVia';

const COMMAND = {
  head: 'rhx route.guard.partition --route .behavior/demo --for review --peer @all',
  tail: '  --mode apply',
};
const ROUTE_SET = ['a={src/a/**,.behavior/demo/**}'];

describe('asReviewPartitionRepairVia', () => {
  given('[case1] the caller passed its own --partition flags', () => {
    when('[t0] a route set is also declared', () => {
      then(
        '🔴 the caller set wins, and is repaired as flags with no command',
        () => {
          expect(
            asReviewPartitionRepairVia({
              partitions: ['mine=src/**'],
              partitionsOfRoute: { partition: ROUTE_SET, command: COMMAND },
            }),
          ).toEqual({ partition: ['mine=src/**'], command: null });
        },
      );
    });
  });

  given('[case2] only the route declares a set', () => {
    when('[t0] the via is read', () => {
      then('🔴 the whole route set is repaired via its command', () => {
        expect(
          asReviewPartitionRepairVia({
            partitions: [],
            partitionsOfRoute: { partition: ROUTE_SET, command: COMMAND },
          }),
        ).toEqual({ partition: ROUTE_SET, command: COMMAND });
      });
    });
  });

  given('[case3] no set is declared', () => {
    when('[t0] the via is read', () => {
      then('there is no repair', () => {
        expect(
          asReviewPartitionRepairVia({
            partitions: [],
            partitionsOfRoute: null,
          }),
        ).toEqual(null);
        expect(
          asReviewPartitionRepairVia({
            partitions: [],
            partitionsOfRoute: { partition: [], command: null },
          }),
        ).toEqual(null);
      });
    });
  });
});
