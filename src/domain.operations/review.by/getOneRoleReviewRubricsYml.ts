import * as fs from 'fs/promises';
import globby from 'globby';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = locates + reads a role's rubrics.yml
 * .why = the i/o boundary for review.by config load. finds the role dir under
 *        .agent/repo=*​/role=$role (across repos), then reads briefs/reviews/rubrics.yml.
 *        pairs with asReviewRubricsConfig (the pure parse). fails loud with a fix-naming
 *        message when the role or its rubrics.yml is absent. see rule.require.failloud.
 * .note = cwd stays the repo root (rule.forbid.cwd-outside-gitroot); the glob is scoped
 *         to .agent so it never walks node_modules.
 */
export const getOneRoleReviewRubricsYml = async (input: {
  role: string;
  cwd: string;
}): Promise<{ path: string; raw: string }> => {
  // find the role dir across repos; role dirs live at .agent/repo=*/role=$role
  const roleDirs = await globby(`.agent/repo=*/role=${input.role}`, {
    cwd: input.cwd,
    dot: true,
    onlyDirectories: true,
    absolute: true,
  });

  // fail loud when no role dir fits — name the glob the human can inspect
  const roleDir = roleDirs[0];
  if (roleDir === undefined)
    throw new BadRequestError(
      `role not found at .agent/repo=*/role=${input.role}`,
      { role: input.role, cwd: input.cwd },
    );

  // the rubrics.yml lives at briefs/reviews/rubrics.yml within the role dir
  const rubricsPath = path.join(roleDir, 'briefs', 'reviews', 'rubrics.yml');

  // read it, mapping an absent file to a fix-naming error
  const raw = await readRubricsYml({ path: rubricsPath, role: input.role });

  return { path: rubricsPath, raw };
};

/**
 * .what = reads the rubrics.yml file, or fails loud when absent
 * .why = an absent rubrics.yml is a caller-fixable config gap, not a crash — name the role.
 */
const readRubricsYml = async (input: {
  path: string;
  role: string;
}): Promise<string> => {
  try {
    return await fs.readFile(input.path, 'utf-8');
  } catch (error) {
    // .note = detect ENOENT via code/message, NOT `instanceof Error` — a node fs error can
    //         cross module realms so `instanceof` is unreliable in test transpile setups.
    const code = (error as { code?: string } | null)?.code;
    const message = (error as { message?: string } | null)?.message ?? '';
    const isAbsent = code === 'ENOENT' || message.includes('ENOENT');
    if (isAbsent)
      throw new BadRequestError(
        `rubrics.yml not found for role ${input.role}`,
        { path: input.path, role: input.role },
      );
    throw error;
  }
};
