/**
 * .what = the headline of the refusal when refs were asked for and none matched
 * .why = an explicit path names itself; a glob can only report what it swept
 */
export const asRefsAbsentHeadline = (input: { refGlobs: string[] }): string => {
  const explicitPath = input.refGlobs.find((glob) => !glob.includes('*'));
  if (explicitPath) return `ref not found: ${explicitPath}`;
  return `no refs matched glob: ${input.refGlobs.join(', ')}`;
};
