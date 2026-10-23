import { asTokenCountHuman } from '@src/infra/cli/asTokenCountHuman';
import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import { asRateHuman } from './asRateHuman';
import {
  NAMES_OF_TARGET_INPUT,
  type TargetInputName,
} from './asTargetContentsByInput';
import type { TokenBreakdownEntry } from './genTokenBreakdownReport';
import { MARK_OF_ABSENT } from './meter/asFigureHuman';

/**
 * .what = generates a markdown tree view of token breakdown
 * .why = enables easy visual comprehension of token distribution
 */
export const genTokenBreakdownMarkdown = (
  input: {
    all: { entries: TokenBreakdownEntry[]; total: number };
    rules: { entries: TokenBreakdownEntry[]; total: number };
    targets: { entries: TokenBreakdownEntry[]; total: number };
  } & Record<
    TargetInputName,
    { entries: TokenBreakdownEntry[]; total: number }
  >,
): string =>
  [
    '# token breakdown',
    '',
    `total: ${asTokenCountHuman({ tokens: input.all.total })} tokens`,
    '',

    // render blended all section
    '## all',
    '',
    '```',
    ...renderTree({ entries: input.all.entries, grandTotal: input.all.total }),
    '```',
    '',

    // render rules and targets sections
    ...asSectionLines({
      title: 'rules',
      breakdown: input.rules,
      grandTotal: input.all.total,
    }),
    '',
    ...asSectionLines({
      title: 'targets',
      breakdown: input.targets,
      grandTotal: input.all.total,
    }),

    // the targets again, split by named input — what an overflowed review cuts turns
    // on whether a directory's mass is edited bodies, additions, or mutations, never
    // on the sum alone
    ...NAMES_OF_TARGET_INPUT.flatMap((name) => [
      '',
      ...asSectionLines({
        title: name,
        breakdown: input[name],
        grandTotal: input.all.total,
      }),
    ]),
  ].join('\n');

/**
 * .what = one titled section: its total, then its tree in a fenced block
 * .why = the rules, the targets, and each named input render one shape
 */
const asSectionLines = (input: {
  title: string;
  breakdown: { entries: TokenBreakdownEntry[]; total: number };
  grandTotal: number;
}): string[] => [
  `## ${input.title}`,
  '',
  `total: ${asTokenCountHuman({ tokens: input.breakdown.total })} tokens`,
  '',
  '```',
  ...renderTree({
    entries: input.breakdown.entries,
    grandTotal: input.grandTotal,
  }),
  '```',
];

/**
 * .what = one node of the path hierarchy
 * .why = enables nested directory structure
 */
interface TreeNode {
  name: string;
  tokens: number;
  children: Map<string, TreeNode>;
  isFile: boolean;
}

/**
 * .what = renders entries as a tree structure
 * .why = visual hierarchy of token consumption
 */
const renderTree = (input: {
  entries: TokenBreakdownEntry[];
  grandTotal: number;
}): string[] => {
  // fold the entries into a tree of summed nodes
  // .note = deliberate mutation, in a scoped zone — `root` and every node beneath it are
  //         born here, and only the rendered lines escape, so no caller can observe a
  //         half-summed tree (rule.require.immutable-vars)
  const root: TreeNode = {
    name: '',
    tokens: 0,
    children: new Map(),
    isFile: false,
  };

  for (const entry of input.entries) {
    if (entry.type !== 'FILE') continue;
    const parts = entry.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isLast = i === parts.length - 1;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          tokens: 0,
          children: new Map(),
          isFile: isLast,
        });
      }

      const child = current.children.get(part)!;
      child.tokens += entry.tokens;
      current = child;
    }
  }

  // render tree recursively
  return renderNode({ node: root, prefix: '', grandTotal: input.grandTotal });
};

/**
 * .what = recursively renders a tree node into its lines
 * .why = the visual tree output
 */
const renderNode = (input: {
  node: TreeNode;
  prefix: string;
  grandTotal: number;
}): string[] =>
  // sort children by tokens desc; `Array.from` is the clone the sort reorders
  Array.from(input.node.children.values())
    .sort((a, b) => asTokensOrder({ a, b }))
    .flatMap((child, index, children) => {
      const isLast = index === children.length - 1;
      const { elbow, stem } = asTreeBranchMarkers({ isLast });
      // the one percent render (rule.require.single-source-of-truth-for-render); a
      // share over a zero total is undefined, so it renders absent, never `NaN%`
      const pct = asRateHuman({
        of: input.grandTotal === 0 ? null : child.tokens / input.grandTotal,
        absent: MARK_OF_ABSENT,
      });
      const suffix = child.isFile ? '' : '/';
      return [
        `${input.prefix}${elbow} ${child.name}${suffix} (${asTokenCountHuman({ tokens: child.tokens })}, ${pct})`,
        ...(!child.isFile && child.children.size > 0
          ? renderNode({
              node: child,
              prefix: input.prefix + stem,
              grandTotal: input.grandTotal,
            })
          : []),
      ];
    });

/**
 * .what = the order of tree nodes by tokens, heaviest first
 * .why = names the sort, so the render states its order by name rather than by a
 *        closure a reader must decode (rule.require.named-transformers)
 */
const asTokensOrder = (input: { a: TreeNode; b: TreeNode }): number =>
  input.b.tokens - input.a.tokens;
