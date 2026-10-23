import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionDeclaredLines } from './asRouteGuardPartitionDeclaredLines';

const ROUTE = '.behavior/v2026_01_01.demo';

describe('asRouteGuardPartitionDeclaredLines', () => {
  given('[case1] the @all scope holds two partitions', () => {
    const lines = asRouteGuardPartitionDeclaredLines({
      route: ROUTE,
      scope: { kind: 'all' },
      declared: ['a=src/a/**', 'b=src/b/**'],
    });

    when('[t0] the scope is shown', () => {
      then('the last partition closes the branch', () => {
        expect(lines).toContain('      ├─ a=src/a/**');
        expect(lines).toContain('      └─ b=src/b/**');
      });

      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] one reviewer scope holds none', () => {
    const lines = asRouteGuardPartitionDeclaredLines({
      route: ROUTE,
      scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
      declared: null,
    });

    when('[t0] the scope is shown', () => {
      then('it names the reviewer and says it holds none', () => {
        expect(lines).toContain('   ├─ peer = r2 on 3.blueprint');
        expect(lines).toContain('   └─ declared: none');
      });

      then('the lines match the snapshot', () => {
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });
});
