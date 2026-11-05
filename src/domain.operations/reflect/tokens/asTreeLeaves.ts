import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

/**
 * .what = renders leaves beneath one tree head; a leaf may hang its own children
 * .why = the report tree and the error tree draw the same leaf shape, so one owner
 *        keeps their elbows and stems from drift
 *
 * .note = lines come back unindented; each caller prefixes its own depth
 */
export const asTreeLeaves = (input: {
  leaves: (string | { line: string; children: string[] })[];
}): string[] =>
  input.leaves.flatMap((leaf, index) => {
    const { elbow, stem } = asTreeBranchMarkers({
      isLast: index === input.leaves.length - 1,
    });
    const line = typeof leaf === 'string' ? leaf : leaf.line;
    const children = typeof leaf === 'string' ? [] : leaf.children;
    return [
      `${elbow} ${line}`,
      ...children.map((child, childIndex) => {
        const { elbow: childElbow } = asTreeBranchMarkers({
          isLast: childIndex === children.length - 1,
        });
        return `${stem}${childElbow} ${child}`;
      }),
    ];
  });
