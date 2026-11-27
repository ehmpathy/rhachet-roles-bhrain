/**
 * .what = the first dir of a manifest dirs field, with its build output read as source
 * .why = a manifest names `dist/`, which a build wipes; education lands in `src/`, so it
 *        ships with the next build. an empty list (`[]`) holds no dir, so it reads as null
 */
export const asSourceDir = (input: {
  dirs: string | string[] | null;
}): string | null => {
  const dir = Array.isArray(input.dirs) ? input.dirs[0] : input.dirs;
  if (!dir) return null;
  return dir.replace(/^dist\//, 'src/');
};
