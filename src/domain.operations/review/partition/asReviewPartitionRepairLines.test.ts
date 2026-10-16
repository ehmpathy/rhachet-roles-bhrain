import { given, then, when } from 'test-fns';

import {
  asReviewPartitionRepairLines,
  asReviewPartitionRepairTipLines,
} from './asReviewPartitionRepairLines';

describe('asReviewPartitionRepairLines', () => {
  given('[case1] the shared repair tip', () => {
    when('[t0] its block is rendered', () => {
      const lines = asReviewPartitionRepairTipLines();

      then('it is its own did-you-know block, behind a blank line', () => {
        expect(lines.slice(0, 2)).toEqual(['', '✨ did you know?']);
        expect(lines).toMatchSnapshot();
      });

      then('no row wears a `tip:` label, and no row holds a ⚠', () => {
        expect(lines.join('\n')).not.toContain('tip:');
        expect(lines.join('\n')).not.toContain('⚠');
      });

      // 🔴 a refusal's `--partition '<value>'` flags are read back as the partitions its lever
      //    proposes (asPeerGivenConstraint), so the example must never take that form
      then('🔴 the example names globs, never a --partition flag', () => {
        expect(lines.join('\n')).not.toContain("--partition '");
      });
    });
  });

  given('[case2] a repair with one placed file', () => {
    when('[t0] its lines are rendered', () => {
      const lines = asReviewPartitionRepairLines({
        repair: {
          placed: [{ path: 'src/a.ts', slug: 'src', glob: 'src/**' }],
          command: "rhx route.guard.partition \\\n  --partition 'src=src/**'",
        },
        indent: '   ',
        caption: 'repair — run this, then re-arrive',
      });

      then('the command closes the branch on its caption, with no tip', () => {
        expect(lines.command).toEqual([
          '   └─ repair — run this, then re-arrive',
          '         rhx route.guard.partition \\',
          "           --partition 'src=src/**'",
        ]);
      });
    });
  });
});
