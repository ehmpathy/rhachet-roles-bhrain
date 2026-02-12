import { given, then, when } from 'test-fns';

import { computeFooterOutput } from './computeFooterOutput';

describe('computeFooterOutput', () => {
  given('[case1] no opener provided', () => {
    when('[t0] wishPathRel is provided', () => {
      then('renders path with tip about --open', () => {
        const result = computeFooterOutput({
          wishPathRel: '.research/v2026_02_10.consensus/0.wish.md',
        });

        expect(result).toContain('🔭 reach for the stars,');
        expect(result).toContain('.research/v2026_02_10.consensus/0.wish.md');
        expect(result).toContain(
          'tip: use --open to open the wish automatically',
        );
      });
    });
  });

  given('[case2] opener provided', () => {
    when('[t0] opener is codium', () => {
      then('renders path with opener confirmation', () => {
        const result = computeFooterOutput({
          wishPathRel: '.research/v2026_02_10.consensus/0.wish.md',
          opener: 'codium',
        });

        expect(result).toContain('🔭 reach for the stars,');
        expect(result).toContain('.research/v2026_02_10.consensus/0.wish.md');
        expect(result).toContain('opened in codium');
        expect(result).not.toContain('tip:');
      });
    });

    when('[t1] opener is vim', () => {
      then('renders with vim opener', () => {
        const result = computeFooterOutput({
          wishPathRel: '.research/v2026_02_10.vim-mode/0.wish.md',
          opener: 'vim',
        });

        expect(result).toContain('opened in vim');
      });
    });
  });

  given('[case3] tree structure', () => {
    when('[t0] output is generated', () => {
      then('uses correct tree branches', () => {
        const result = computeFooterOutput({
          wishPathRel: '.research/v2026_02_10.test/0.wish.md',
        });

        const lines = result.split('\n');
        expect(lines[0]).toContain('🔭');
        expect(lines[1]).toContain('├─');
        expect(lines[2]).toContain('└─');
      });
    });
  });
});
