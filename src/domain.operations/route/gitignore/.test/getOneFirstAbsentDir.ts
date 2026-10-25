import * as fs from 'fs/promises';

/**
 * .what = the shallowest ancestor of a path (or the path itself) absent from disk
 * .why = a recursive mkdir is denied at exactly this dir, so a test can pin the denied path
 *        exactly on any host — some hosts carry `/nonexistent` (the home of `nobody`), some do not
 */
export const getOneFirstAbsentDir = async (input: {
  path: string;
}): Promise<string | null> => {
  const segments = input.path.split('/').filter(Boolean);
  const ancestors = segments.map(
    (_, index) => `/${segments.slice(0, index + 1).join('/')}`,
  );
  const presences = await Promise.all(
    ancestors.map((ancestor) =>
      fs.access(ancestor).then(
        () => true,
        (error: NodeJS.ErrnoException) => {
          // only an absence answers "not there"; any other fault is real
          if (error.code === 'ENOENT') return false;
          throw error;
        },
      ),
    ),
  );
  return ancestors[presences.indexOf(false)] ?? null;
};
