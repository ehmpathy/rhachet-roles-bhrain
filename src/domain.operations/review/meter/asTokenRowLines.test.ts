import { given, then, when } from 'test-fns';

import { asTokenRowLines } from './asTokenRowLines';

describe('asTokenRowLines', () => {
  given('[case1] four rendered figures under a prefix', () => {
    when('[t0] the rows are built', () => {
      then(
        'it renders the four rows in order, aligned, the last closed',
        () => {
          expect(
            asTokenRowLines({
              prefix: '   │  ',
              figures: {
                input: '1,000',
                cacheSet: '0',
                cacheGet: '500',
                output: '42',
              },
            }),
          ).toEqual([
            '   │  ├─ input:     1,000',
            '   │  ├─ cache.set: 0',
            '   │  ├─ cache.get: 500',
            '   │  └─ output:    42',
          ]);
        },
      );
    });
  });
});
