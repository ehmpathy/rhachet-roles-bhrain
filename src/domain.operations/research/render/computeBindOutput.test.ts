import { given, then, when } from 'test-fns';

import { computeBindOutput } from './computeBindOutput';

describe('computeBindOutput', () => {
  given('[case1] branch and research provided', () => {
    when('[t0] standard feature branch', () => {
      then('renders bind confirmation', () => {
        const result = computeBindOutput({
          branchName: 'vlad/init-research',
          researchName: 'v2026_02_10.consensus-algorithms',
        });

        expect(result).toContain("✨ we'll lay the stage,");
        expect(result).toContain(
          'branch vlad/init-research <-> research v2026_02_10.consensus-algorithms',
        );
        expect(result).toContain('branch bound to research, to boot via hooks');
      });
    });

    when('[t1] simple branch name', () => {
      then('renders with simple name', () => {
        const result = computeBindOutput({
          branchName: 'feature-branch',
          researchName: 'v2026_02_10.test',
        });

        expect(result).toContain(
          'branch feature-branch <-> research v2026_02_10.test',
        );
      });
    });
  });

  given('[case2] tree structure', () => {
    when('[t0] output is generated', () => {
      then('uses correct tree branches', () => {
        const result = computeBindOutput({
          branchName: 'test',
          researchName: 'v2026_02_10.test',
        });

        const lines = result.split('\n');
        expect(lines[0]).toContain('✨');
        expect(lines[1]).toContain('├─');
        expect(lines[2]).toContain('└─');
      });

      then('has exactly 3 lines', () => {
        const result = computeBindOutput({
          branchName: 'test',
          researchName: 'v2026_02_10.test',
        });

        const lines = result.split('\n');
        expect(lines).toHaveLength(3);
      });
    });
  });
});
