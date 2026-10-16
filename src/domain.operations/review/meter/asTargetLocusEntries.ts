/**
 * .what = casts target contents into locus entries — one path, and the chars it sends
 * .why = a refused run never renders its prompt, so the locus a meter reads off the
 *        rendered prompt does not exist for it. the contents are already folded to
 *        what the renderer sends (`asTargetContentsByInput`), so they address the
 *        same mass in the same unit the meter's locus uses
 */
export const asTargetLocusEntries = (input: {
  targets: { path: string; content: string }[];
}): { path: string; chars: number }[] =>
  input.targets.map((target) => ({
    path: target.path,
    chars: target.content.length,
  }));
