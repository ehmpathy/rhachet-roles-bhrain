import { formatGuardMalfunctionLeverLines } from './formatGuardMalfunctionLeverLines';

/**
 * .what = the whole malfunction-clear block — the `still yours to clear` lead line, then one
 *         row per broken part beneath it — at a caller's indent and branch
 * .why = three surfaces show a malfunction: the guard tree, the synchronous `route.stone.set`
 *        emit, and the `route.drive` replay. the lead and the rows render from this one
 *        operation, and only the tree position differs per caller
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = `reason` is the FULL persisted malfunction reason — its header and its lane lines.
 *         the rows read the lanes from it, so every surface names the same broken parts
 * .note = `branch` is the lead's own connector. a `├─` lead keeps its trunk open, so its
 *         rows sit under `│  `; a `└─` lead closes the trunk, so its rows sit under `   `
 */
export const formatGuardMalfunctionClearLines = (input: {
  stone: string;
  reason: string | null;
  indent: string;
  branch: '├─' | '└─';
}): string[] => [
  `${input.indent}${input.branch} still yours to clear`,
  ...formatGuardMalfunctionLeverLines({
    stone: input.stone,
    reason: input.reason,
    indent: `${input.indent}${input.branch === '├─' ? '│  ' : '   '}`,
  }),
];
