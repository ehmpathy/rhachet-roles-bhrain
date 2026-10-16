import { getOneFileTextOrNull } from '@src/utils/fs/getOneFileTextOrNull';

/**
 * .what = reads a guard template's raw content, or null when it vanished before the read
 * .why = the template was found a moment earlier; an absence now is a race delete, which the
 *        upgrade plan reads as `absent-source`. any other fault is server-side and propagates
 */
export const getOneGuardTemplateContentOrNull = async (input: {
  path: string;
}): Promise<string | null> => getOneFileTextOrNull({ path: input.path });
