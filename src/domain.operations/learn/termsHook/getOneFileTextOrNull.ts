import { promises as fs } from 'fs';

/**
 * .what = a file's text, or null when it is absent
 * .why = the read and the write both need the text found: the read to parse it, the write to
 *        keep its form. a target gone since the stat is absent, the same as one never made;
 *        any other read fault is no absence and stays loud
 */
export const getOneFileTextOrNull = async (input: {
  path: string;
}): Promise<string | null> => {
  try {
    return await fs.readFile(input.path, 'utf-8');
  } catch (error) {
    const isAbsent =
      error instanceof Error && 'code' in error && error.code === 'ENOENT';
    if (!isAbsent) throw error;
    return null;
  }
};
