import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { promisify } from 'util';

import type { EducationRole } from './getOneEducationRole';
import { getOneRhachetBinPath } from './getOneRhachetBinPath';

const execFileAsync = promisify(execFile);

/**
 * .what = the stderr line rhachet prints when a boot exceeds its declared budget
 */
const MARK_OF_BUDGET_BREACH = 'boot payload exceeds its declared budget';

/**
 * .what = the boot spec rhachet boots for this role, repo-relative
 * .why = a linked role boots its rendered view (`.agent/repo=$repo/role=$slug`), which holds
 *        the mod once a render lands; an own or native role boots its own spec
 */
const asBootSpecBooted = (input: { role: EducationRole }): string =>
  input.role.kind === 'linked'
    ? path.join(
        '.agent',
        `repo=${input.role.repo}`,
        `role=${input.role.slug}`,
        'boot.yml',
      )
    : input.role.bootPath;

/**
 * .what = the `budget = …` line of a boot's stats block, or null when it states none
 */
const asBudgetLine = (input: { text: string }): string | null =>
  /budget = [^\n]+/.exec(input.text)?.[0] ?? null;

/**
 * .what = whether the role still boots within its declared budget
 * .why = rhachet halts a boot whose payload exceeds the budget its spec declares, so a
 *        graduation that pushes a role past it breaks every session of that role. the
 *        cheapest moment to see it is the graduate stone, before the driver passes it
 * .note = it asks rhachet itself (`roles boot --what`), the one count that is the gate's own,
 *         via the peer this package resolves, never via npx from the cwd (`getOneRhachetBinPath`)
 * .note = a role with no boot spec declares no budget, so it holds
 */
export const getOneBootBudgetVerdict = async (input: {
  repoRoot: string;
  role: EducationRole;
}): Promise<{ passed: boolean; reason: string }> => {
  const spec = asBootSpecBooted({ role: input.role });
  if (!existsSync(path.join(input.repoRoot, spec)))
    return { passed: true, reason: 'the role has no boot spec, so no budget' };

  // boot the role as rhachet does; its exit and stderr carry the gate's verdict
  const run = await execFileAsync(
    getOneRhachetBinPath(),
    ['roles', 'boot', '--what', spec],
    { cwd: input.repoRoot, maxBuffer: 256 * 1024 * 1024 },
  ).then(
    (out) => ({ code: 0, stdout: out.stdout, stderr: out.stderr }),
    (error: { code?: number; stdout?: string; stderr?: string }) => ({
      code: typeof error.code === 'number' ? error.code : 1,
      stdout: error.stdout ?? '',
      stderr: error.stderr ?? '',
    }),
  );

  // a breach: the role would no longer boot
  if (run.stderr.includes(MARK_OF_BUDGET_BREACH))
    return {
      passed: false,
      reason: `the role's boot exceeds its declared budget (${spec}${asBudgetLine({ text: run.stderr }) ? `, ${asBudgetLine({ text: run.stderr })}` : ''}); move a say entry to ref, or raise budget.tokens deliberately, then re-stamp: rhx education.pedigree set`,
    };

  // any other fault is the probe's, never a verdict on the role
  if (run.code !== 0)
    throw new MalfunctionError('the boot budget probe failed', {
      spec,
      code: run.code,
      stderr: run.stderr.slice(-2000),
      bin: getOneRhachetBinPath(),
      hint: 'run it by hand to see why: npx rhachet roles boot --what <spec>',
    });
  const budget = asBudgetLine({ text: run.stdout });
  return {
    passed: true,
    reason: budget
      ? `the role boots within its budget (${budget})`
      : 'the role declares no budget',
  };
};
