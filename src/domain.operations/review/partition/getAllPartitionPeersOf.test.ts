import { given, then, when } from 'test-fns';

import { getAllPartitionPeersOf } from './getAllPartitionPeersOf';

describe('getAllPartitionPeersOf', () => {
  given('[case1] a split of three partitions', () => {
    const partitions = [
      { name: 'git', globs: ['src/git/**'] },
      { name: 'route', globs: ['src/route/**'] },
      { name: 'review', globs: ['src/review/**', 'blackbox/review*'] },
    ];

    when('[t0] the peers of the middle partition are read', () => {
      const peers = getAllPartitionPeersOf({
        partition: { name: 'route' },
        partitions,
      });

      then(
        'every other partition is a peer, in declared order, globs intact',
        () => {
          expect(peers).toEqual([
            { name: 'git', globs: ['src/git/**'] },
            { name: 'review', globs: ['src/review/**', 'blackbox/review*'] },
          ]);
        },
      );
    });
  });

  given('[case2] a split of one partition', () => {
    when('[t0] its peers are read', () => {
      const peers = getAllPartitionPeersOf({
        partition: { name: 'solo' },
        partitions: [{ name: 'solo', globs: ['src/**'] }],
      });

      then('it has none', () => {
        expect(peers).toEqual([]);
      });
    });
  });
});
