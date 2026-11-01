import { given, then, when } from 'test-fns';

import { ROLE_LEARNER } from './getLearnerRole';

/**
 * .what = unit cases proving the learner role registers the memory guard hook
 * .why = the integration suite proves the guard command works, but no other test
 *        asserts the role actually wires it as an onTool hook. without this, the
 *        onTool entry could be deleted and every other test would still pass while
 *        the hook silently stops firing in consuming repos (the wish requires the
 *        hook be "registered via the learner role boot/init")
 * .note = the clamps that read the skill file from disk live in
 *         getLearnerRole.integration.test.ts
 */
describe('getLearnerRole', () => {
  given('[case1] the built learner role', () => {
    when('[t0] its onTool hooks are inspected', () => {
      const onToolHooks = ROLE_LEARNER.hooks?.onBrain?.onTool ?? [];

      then('it registers exactly one onTool hook', () => {
        expect(onToolHooks).toHaveLength(1);
      });

      then(
        'the hook runs the linked skill file directly, anchored on the project dir',
        () => {
          // never via `rhx`: its own lookup fault (an unlinked skill) exits 2, which
          // claude code reads as block, and every Write/Edit/Bash call halts
          const command = onToolHooks[0]?.command ?? '';
          expect(command).not.toContain('rhx');
          expect(command).toContain('d="${CLAUDE_PROJECT_DIR:-.}"');
          expect(command).toContain(
            'r="$d/.agent/repo=bhrain"; s="$r/role=learner/skills"; f="$s/memory.guard.sh"',
          );
          expect(command).toContain('--mode hook');

          // the absent-skill branch exits 1 (a visible, non-block notice), never 2
          expect(command).toContain('exit 1');
          expect(command).not.toContain('exit 2');
          expect(command).toMatchSnapshot();
        },
      );

      then('the hook fires before Write, Edit, and Bash tools', () => {
        expect(onToolHooks[0]?.filter?.when).toEqual('before');
        expect(onToolHooks[0]?.filter?.what).toEqual('Write|Edit|Bash');
      });
    });

    when('[t1] its onStop hooks are inspected', () => {
      const onStopHooks = ROLE_LEARNER.hooks?.onBrain?.onStop ?? [];

      then('it registers no onStop hook at all', () => {
        // the domain-term sweephook was withdrawn: a staleness nudge that holds
        // the stop charges every session for a distillation most sessions do not
        // owe. the learner's obligation lives in its briefs, never in a gate.
        expect(onStopHooks).toHaveLength(0);
      });
    });
  });
});
