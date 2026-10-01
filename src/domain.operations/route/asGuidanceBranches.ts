/**
 * .what = renders a guidance block as the last branches of a `route.stone.set` tree
 * .why = `S13`: guidance once hung under one `└─` as prose, a blank line and a final note
 *        beneath it, so the tree ended in a paragraph (`rule.require.stdout-is-treestruct`)
 *
 * .note = each blank-separated paragraph is one branch. its first line is the branch head;
 *         each later line is a child the caller already shaped as a tree line
 *         (`   ├─ …` / `   └─ …`), nested under the head's column. a `   │` spacer parts two
 *         branches, so no blank line breaks the tree
 */
export const asGuidanceBranches = (input: { guidance: string }): string[] => {
  const paragraphs = input.guidance
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.split('\n'))
    .filter((paragraph) => paragraph.some((line) => line.trim() !== ''));

  return paragraphs.flatMap((paragraph, index) => {
    const isLast = index === paragraphs.length - 1;
    const [head, ...children] = paragraph;
    const branch = [
      `   ${isLast ? '└─' : '├─'} ${head}`,
      ...children.map((child) => `   ${isLast ? ' ' : '│'}  ${child}`),
    ];
    return isLast ? branch : [...branch, '   │'];
  });
};
