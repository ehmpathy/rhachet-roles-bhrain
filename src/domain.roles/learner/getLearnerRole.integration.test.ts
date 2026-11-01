import { readFileSync } from 'fs';
import { join } from 'path';
import { given, then, when } from 'test-fns';

import { ROLE_LEARNER } from './getLearnerRole';
import {
  LEARNER_MEMORY_GUARD_HOOK_BUDGET,
  LEARNER_MEMORY_GUARD_HOOK_COMMAND,
} from './getLearnerRoleHookCommand';

/**
 * .what = integration cases that hold the learner role's hook in step with the skill file
 * .why = the hook command and the skill live in two places and must agree on the
 *        budget, the fault format, and the sealed codes; each clamp reads the skill from
 *        disk, so each belongs at the integration grain, apart from the pure role unit test
 */
describe('getLearnerRole (integration)', () => {
  given(
    '[case1] the built learner role and its memory.guard skill file',
    () => {
      const onToolHooks = ROLE_LEARNER.hooks?.onBrain?.onTool ?? [];
      const readSkill = (): string =>
        readFileSync(join(__dirname, 'skills/memory.guard.sh'), 'utf-8');

      when('[t0] the hook budget is compared to the skill budget', () => {
        then(
          'the skill holds its deadlines under the hook budget it is given',
          () => {
            // the skill derives both deadlines from its own budget; the two must agree,
            // or a guard slower than its budget is killed silent by claude code
            const budgetMs = Number(
              /^MEMORY_GUARD_HOOK_BUDGET_MS=(\d+)$/m.exec(readSkill())?.[1],
            );
            expect(onToolHooks[0]?.timeout).toEqual(
              LEARNER_MEMORY_GUARD_HOOK_BUDGET,
            );
            expect(LEARNER_MEMORY_GUARD_HOOK_BUDGET).toEqual(
              `PT${budgetMs / 1000}S`,
            );
          },
        );
      });

      when(
        '[t1] the hook command fault lines are compared to the skill',
        () => {
          then(
            'the hook command spells each fault line in the skill format',
            () => {
              // the hook command must name a fault when the skill itself is absent, so it
              // cannot read the skill's format; this clamp keeps the copies equal
              const format = /^export MEMORY_GUARD_FAULT_FORMAT='(.+)'$/m.exec(
                readSkill(),
              )?.[1];
              const [head, middle, tail] = (format ?? '').split('%s');
              const lines = [
                ...LEARNER_MEMORY_GUARD_HOOK_COMMAND.matchAll(
                  /echo "([^"]+)"/g,
                ),
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
        },
      );

      when(
        '[t2] the hook command sealed codes are compared to the skill',
        () => {
          then(
            'the skill ends with each sealed code the hook command passes it',
            () => {
              // the hook command maps sealed codes back by `c - 20`; a name the skill
              // never reads would leave that outcome on its hook code, unsealed
              const skill = readSkill();
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
        },
      );
    },
  );
});
