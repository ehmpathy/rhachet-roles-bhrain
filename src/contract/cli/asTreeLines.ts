import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

/**
 * .what = branch lines for a list, each under `indent`, the last one closed with `└─`
 * .why = every education face renders lists as tree branches, never as indented prose
 *        (rule.require.stdout-is-treestruct); the glyphs come from the one owner,
 *        `asTreeBranchMarkers`, so this list adds no derivation of its own
 */
export const asTreeLines = (input: {
  indent: string;
  items: string[];
}): string[] =>
  input.items.map((item, index) => {
    const { elbow } = asTreeBranchMarkers({
      isLast: index === input.items.length - 1,
    });
    return `${input.indent}${elbow} ${item}`;
  });
