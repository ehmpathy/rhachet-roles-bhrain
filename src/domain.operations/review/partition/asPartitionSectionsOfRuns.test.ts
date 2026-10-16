import { given, then, when } from 'test-fns';

import { asPartitionFaultSection } from './asPartitionFaultSection';
import { asPartitionSectionsOfRuns } from './asPartitionSectionsOfRuns';

const CWD = '/repo';

const asPartition = (input: { name: string }) => ({
  name: input.name,
  narrow: ['a.ts', 'b.ts'],
  common: ['shared.ts'],
  commonGraded: [],
});

describe('asPartitionSectionsOfRuns', () => {
  given('[case1] a pour where one partition answered and one faulted', () => {
    const error = new Error('socket hang up');
    const runs = [
      {
        partition: asPartition({ name: 'src/a' }),
        outcome: {
          status: 'fulfilled' as const,
          value: {
            output: { path: '/repo/.reviews/.partition=1.src-a/report.md' },
            review: { formatted: '# blocker.1 — a real concern' },
          },
        },
      },
      {
        partition: asPartition({ name: 'src/b' }),
        outcome: { status: 'rejected' as const, reason: error },
      },
    ];
    const faults = [{ error }];

    when('[t0] the sections are built', () => {
      const sections = asPartitionSectionsOfRuns({
        runs,
        faults,
        cwd: CWD,
        route: null,
      });

      then('the answered partition keeps its review path and body', () => {
        expect(sections[0]).toEqual({
          name: 'src/a',
          targetsCount: 2,
          commonCount: 1,
          commonGradedCount: 0,
          reviewRelative: '.reviews/.partition=1.src-a/report.md',
          formatted: '# blocker.1 — a real concern',
        });
      });

      then(
        '🔴 the faulted partition reads the faults it was handed, never a list it rebuilt',
        () => {
          expect(sections[1]).toEqual({
            name: 'src/b',
            targetsCount: 2,
            commonCount: 1,
            commonGradedCount: 0,
            reviewRelative: null,
            formatted: asPartitionFaultSection({
              error,
              faults,
              partitionsTotal: 2,
              route: null,
            }),
          });
        },
      );
    });
  });
});
