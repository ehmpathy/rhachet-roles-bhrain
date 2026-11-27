import { mkdirSync, writeFileSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { getOneBootBudgetVerdict } from './getOneBootBudgetVerdict';
import type { EducationRole } from './getOneEducationRole';

const ROLE_NATIVE: EducationRole = {
  slug: 'mechanic',
  kind: 'native',
  repo: '.this',
  briefsDir: '.agent/repo=.this/role=mechanic/briefs',
  skillsDir: '.agent/repo=.this/role=mechanic/skills',
  bootPath: '.agent/repo=.this/role=mechanic/boot.yml',
};

/**
 * .what = a temp repo with a native role whose boot spec declares a budget of `tokens`
 */
const genSceneOfBudget = (input: { slug: string; tokens: number }) => {
  const repoRoot = genTempDir({ slug: input.slug });
  mkdirSync(path.join(repoRoot, ROLE_NATIVE.briefsDir), { recursive: true });
  writeFileSync(
    path.join(repoRoot, ROLE_NATIVE.briefsDir, 'rule.require.x.md'),
    `# rule.require.x\n\n${'upsert on the natural key, every time. '.repeat(40)}\n`,
  );
  writeFileSync(
    path.join(repoRoot, ROLE_NATIVE.bootPath),
    `budget:\n  tokens: ${input.tokens}\nbriefs:\n  say:\n    - briefs/rule.require.x.md\n`,
  );
  return { repoRoot };
};

describe('getOneBootBudgetVerdict', () => {
  given('[case1] a role whose boot fits its budget', () => {
    const scene = useBeforeAll(async () =>
      genSceneOfBudget({ slug: 'test-budget-fits', tokens: 100_000 }),
    );

    when('[t0] the probe runs', () => {
      then('it passes, and names the budget line', async () => {
        const verdict = await getOneBootBudgetVerdict({
          repoRoot: scene.repoRoot,
          role: ROLE_NATIVE,
        });
        expect(verdict.passed).toEqual(true);
        expect(verdict.reason).toContain('100,000 tokens');
      });
    });
  });

  given('[case2] a role whose boot exceeds its budget', () => {
    const scene = useBeforeAll(async () =>
      genSceneOfBudget({ slug: 'test-budget-breach', tokens: 50 }),
    );

    when('[t0] the probe runs', () => {
      then('it holds, and names the move to ref and the re-stamp', async () => {
        const verdict = await getOneBootBudgetVerdict({
          repoRoot: scene.repoRoot,
          role: ROLE_NATIVE,
        });
        expect(verdict.passed).toEqual(false);
        expect(verdict.reason).toContain(
          "the role's boot exceeds its declared budget",
        );
        expect(verdict.reason).toContain('rhx education.pedigree set');
      });
    });
  });

  given('[case3] a role with no boot spec', () => {
    const scene = useBeforeAll(async () => ({
      repoRoot: genTempDir({ slug: 'test-budget-nospec' }),
    }));

    when('[t0] the probe runs', () => {
      then('it passes, since no budget is declared', async () => {
        const verdict = await getOneBootBudgetVerdict({
          repoRoot: scene.repoRoot,
          role: ROLE_NATIVE,
        });
        expect(verdict).toEqual({
          passed: true,
          reason: 'the role has no boot spec, so no budget',
        });
      });
    });
  });

  given('[case4] a role whose boot spec rhachet cannot read', () => {
    const scene = useBeforeAll(async () => {
      const repoRoot = genTempDir({ slug: 'test-budget-unreadable' });
      mkdirSync(path.join(repoRoot, ROLE_NATIVE.briefsDir), {
        recursive: true,
      });
      writeFileSync(
        path.join(repoRoot, ROLE_NATIVE.bootPath),
        'say: [unclosed\n',
      );
      return { repoRoot };
    });

    when('[t0] the probe runs', () => {
      then(
        'it throws a MalfunctionError, never a verdict on the role',
        async () => {
          const error = await getError(
            getOneBootBudgetVerdict({
              repoRoot: scene.repoRoot,
              role: ROLE_NATIVE,
            }),
          );
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain('the boot budget probe failed');
          expect(error.message).toContain(
            'npx rhachet roles boot --what <spec>',
          );
        },
      );
    });
  });
});
