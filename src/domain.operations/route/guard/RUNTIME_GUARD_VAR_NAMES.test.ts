import { given, then, when } from 'test-fns';

import { RUNTIME_GUARD_VAR_NAMES } from './RUNTIME_GUARD_VAR_NAMES';

describe('RUNTIME_GUARD_VAR_NAMES', () => {
  given('[case1] the shared runtime-var-names const', () => {
    when('[t0] read', () => {
      then('it lists exactly the 7 runtime vars the runners substitute', () => {
        // this locks the shared source to the full runtime set: the 6 judge-side vars
        // ($route, $stone, $hash, $output, $rhx, $rhachet — runStoneGuardJudges) plus the
        // review-only $conversation (runStoneGuardReviews). a change to any side without
        // the const flips this test red.
        expect([...RUNTIME_GUARD_VAR_NAMES].sort()).toEqual(
          [
            '$conversation',
            '$hash',
            '$output',
            '$rhachet',
            '$rhx',
            '$route',
            '$stone',
          ].sort(),
        );
      });

      then('every name is a `$`-prefixed token (no bare names)', () => {
        for (const name of RUNTIME_GUARD_VAR_NAMES)
          expect(name.startsWith('$')).toBe(true);
      });

      then('the list has no duplicate names', () => {
        expect(new Set(RUNTIME_GUARD_VAR_NAMES).size).toEqual(
          RUNTIME_GUARD_VAR_NAMES.length,
        );
      });
    });
  });
});
