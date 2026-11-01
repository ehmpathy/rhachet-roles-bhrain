import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { ROLE_LEARNER } from './getLearnerRole';
import {
  LEARNER_MEMORY_GUARD_HOOK_BUDGET,
  LEARNER_MEMORY_GUARD_HOOK_COMMAND,
} from './getLearnerRoleHookCommand';

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

      then(
        'the skill holds its deadlines under the hook budget it is given',
        () => {
          // the skill derives both deadlines from its own budget; the two must agree,
          // or a guard slower than its budget is killed silent by claude code
          const budgetMs = Number(
            /^MEMORY_GUARD_HOOK_BUDGET_MS=(\d+)$/m.exec(
              readFileSync(join(__dirname, 'skills/memory.guard.sh'), 'utf-8'),
            )?.[1],
          );
          expect(onToolHooks[0]?.timeout).toEqual(
            LEARNER_MEMORY_GUARD_HOOK_BUDGET,
          );
          expect(LEARNER_MEMORY_GUARD_HOOK_BUDGET).toEqual(
            `PT${budgetMs / 1000}S`,
          );
        },
      );

      then(
        'the hook command spells each fault line in the skill format',
        () => {
          // the hook command must name a fault when the skill itself is absent, so it
          // cannot read the skill's format; this clamp keeps the copies equal
          const format = /^export MEMORY_GUARD_FAULT_FORMAT='(.+)'$/m.exec(
            readFileSync(join(__dirname, 'skills/memory.guard.sh'), 'utf-8'),
          )?.[1];
          const [head, middle, tail] = (format ?? '').split('%s');
          const lines = [
            ...LEARNER_MEMORY_GUARD_HOOK_COMMAND.matchAll(/echo "([^"]+)"/g),
          ].map((match) => match[1]);
          expect(format).toBeDefined();
          expect(lines).toHaveLength(3);
          lines.forEach((line) => {
            expect(line?.startsWith(head ?? '')).toEqual(true);
            expect(line).toContain(middle);
            expect(tail).toEqual('');
          });
        },
      );

      then(
        'the skill ends with each sealed code the hook command passes it',
        () => {
          // the hook command maps sealed codes back by `c - 20`; a name the skill
          // never reads would leave that outcome on its hook code, unsealed
          const skill = readFileSync(
            join(__dirname, 'skills/memory.guard.sh'),
            'utf-8',
          );
          const sealed = [
            ...LEARNER_MEMORY_GUARD_HOOK_COMMAND.matchAll(
              /(MEMORY_GUARD_HOOK_EXIT_\w+)=(\d+)/g,
            ),
          ].map((match) => ({ name: match[1], code: Number(match[2]) }));
          expect(sealed).toEqual([
            { name: 'MEMORY_GUARD_HOOK_EXIT_ALLOW', code: 20 },
            { name: 'MEMORY_GUARD_HOOK_EXIT_FAULT', code: 21 },
            { name: 'MEMORY_GUARD_HOOK_EXIT_BLOCK', code: 22 },
          ]);
          sealed.forEach(({ name }) =>
            expect(skill).toContain(`"\${${name}:-`),
          );
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
