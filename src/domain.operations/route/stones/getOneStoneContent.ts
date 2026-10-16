import * as fs from 'fs/promises';

/**
 * .what = reads one stone's markdown body
 * .why = the drive orchestrator composes named acts; this names its one raw read, so the
 *        transport has a name and the orchestrator reads as narrative
 *        (rule.prefer.decomposable-architecture)
 */
export const getOneStoneContent = async (input: {
  path: string;
}): Promise<string> => fs.readFile(input.path, 'utf-8');
