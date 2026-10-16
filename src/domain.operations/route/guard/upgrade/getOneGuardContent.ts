import * as fs from 'fs/promises';

/**
 * .what = reads one guard file's raw content
 * .why = the upgrade plan composes named acts; this names its read of the current guard, so
 *        the transport has a name and the plan reads as narrative
 *        (rule.prefer.decomposable-architecture)
 */
export const getOneGuardContent = async (input: {
  path: string;
}): Promise<string> => fs.readFile(input.path, 'utf-8');
