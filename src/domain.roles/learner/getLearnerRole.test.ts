import { given, then, when } from 'test-fns';

import { ROLE_LEARNER } from './getLearnerRole';

/**
 * .what = unit cases proving the learner role registers the memory guard hook
 * .why = the integration suite proves the guard command works, but no other test
 *        asserts the role actually wires it as an onTool hook. without this, the
 *        onTool entry could be deleted and every other test would still pass while
 *        the hook silently stops firing in consuming repos (the wish requires the
 *        hook be "registered via the learner role boot/init")
 */
describe('getLearnerRole', () => {
  given('[case1] the built learner role', () => {
    when('[t0] its onTool hooks are inspected', () => {
      const onToolHooks = ROLE_LEARNER.hooks?.onBrain?.onTool ?? [];

      then('it registers exactly one onTool hook', () => {
        expect(onToolHooks).toHaveLength(1);
      });

      then(
        'the hook invokes the memory guard skill via rhx --mode hook',
        () => {
          // conformant registration: a skill invoked via `rhx <skill> --mode hook`
          // (same pattern as the driver role's route.bounce), not a raw node -e eval
          expect(onToolHooks[0]?.command).toContain('rhx memory.guard');
          expect(onToolHooks[0]?.command).toContain('--mode hook');
        },
      );

      then('the hook fires before Write, Edit, and Bash tools', () => {
        expect(onToolHooks[0]?.filter?.when).toEqual('before');
        expect(onToolHooks[0]?.filter?.what).toEqual('Write|Edit|Bash');
      });
    });
  });
});
