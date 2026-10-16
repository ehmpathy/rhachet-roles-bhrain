import { given, then, when } from 'test-fns';

import { asRouteGuardPartitionPruneRefusal } from './asRouteGuardPartitionPruneRefusal';

const HELD = ['alpha=src/alpha/**,.behavior/demo/**', 'beta=src/beta/**'];

describe('asRouteGuardPartitionPruneRefusal', () => {
  given('[case1] a prune of a typo, with no --from', () => {
    when('[t0] the refusal is rendered', () => {
      const refusal = asRouteGuardPartitionPruneRefusal({
        unheld: ['src/alpa/**'],
        held: HELD,
        isFromNamed: false,
      });

      then('the headline names the glob, and that naught would drop', () => {
        expect(refusal.headline).toEqual(
          '--prune src/alpa/**: no targeted partition holds that glob, so naught would drop',
        );
      });

      then('every held partition is listed with its globs', () => {
        expect(refusal.lines).toContain('   │  ├─ alpha');
        expect(refusal.lines).toContain('   │  │  ├─ src/alpha/**');
        expect(refusal.lines).toContain('   │  └─ beta');
        expect(refusal.lines).toContain('   │     └─ src/beta/**');
      });

      then('the fix offers no --from to drop, since none was given', () => {
        expect(refusal.lines.join('\n')).not.toContain('--from');
      });

      then('the refusal matches the snapshot', () => {
        expect(
          [refusal.headline, ...refusal.lines].join('\n'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] a prune from a partition that does not hold the glob', () => {
    when('[t0] the refusal is rendered', () => {
      const refusal = asRouteGuardPartitionPruneRefusal({
        unheld: ['src/beta/** (from alpha)'],
        held: HELD,
        isFromNamed: true,
      });

      then('the fix offers to drop --from', () => {
        expect(refusal.lines[refusal.lines.length - 1]).toContain(
          'or drop --from to prune it wherever it sits',
        );
      });
    });
  });
});
