import { asTokenCountHuman } from '@src/infra/cli/asTokenCountHuman';
import { asTreeBranchMarkers } from '@src/infra/cli/asTreeBranchMarkers';

import type { TokenBreakdownEntry } from './genTokenBreakdownReport';

/**
 * .what = generates a markdown tree view of token breakdown
 * .why = enables easy visual comprehension of token distribution
 */
export const genTokenBreakdownMarkdown = (input: {
  all: { entries: TokenBreakdownEntry[]; total: number };
  rules: { entries: TokenBreakdownEntry[]; total: number };
  targets: { entries: TokenBreakdownEntry[]; total: number };
}): string => {
  const lines: string[] = [];

  lines.push('# token breakdown');
  lines.push('');
  lines.push(`total: ${asTokenCountHuman({ tokens: input.all.total })} tokens`);
  lines.push('');

  // render blended all section
  lines.push('## all');
  lines.push('');
  lines.push('```');
  lines.push(...renderTree(input.all.entries, input.all.total));
  lines.push('```');
  lines.push('');

  // render rules section
  lines.push('## rules');
  lines.push('');
  lines.push(
    `total: ${asTokenCountHuman({ tokens: input.rules.total })} tokens`,
  );
  lines.push('');
  lines.push('```');
  lines.push(...renderTree(input.rules.entries, input.all.total));
  lines.push('```');
  lines.push('');

  // render targets section
  lines.push('## targets');
  lines.push('');
  lines.push(
    `total: ${asTokenCountHuman({ tokens: input.targets.total })} tokens`,
  );
  lines.push('');
  lines.push('```');
  lines.push(...renderTree(input.targets.entries, input.all.total));
  lines.push('```');

  return lines.join('\n');
};

/**
 * .what = tree node for building hierarchy
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
const renderTree = (
  entries: TokenBreakdownEntry[],
  grandTotal: number,
): string[] => {
  // build tree structure
  const root: TreeNode = {
    name: '',
    tokens: 0,
    children: new Map(),
    isFile: false,
  };

  for (const entry of entries) {
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
  const lines: string[] = [];
  renderNode(root, '', true, grandTotal, lines);
  return lines;
};

/**
 * .what = recursively renders a tree node
 * .why = builds visual tree output
 */
const renderNode = (
  node: TreeNode,
  prefix: string,
  isRoot: boolean,
  grandTotal: number,
  lines: string[],
): void => {
  // sort children by tokens desc
  const children = Array.from(node.children.values()).sort(
    (a, b) => b.tokens - a.tokens,
  );

  for (let i = 0; i < children.length; i++) {
    const child = children[i]!;
    const isLast = i === children.length - 1;
    const { elbow, stem } = asTreeBranchMarkers({ isLast });
    const pct = ((child.tokens / grandTotal) * 100).toFixed(1);
    const suffix = child.isFile ? '' : '/';

    lines.push(
      `${prefix}${elbow} ${child.name}${suffix} (${asTokenCountHuman({ tokens: child.tokens })}, ${pct}%)`,
    );

    if (!child.isFile && child.children.size > 0) {
      renderNode(child, prefix + stem, false, grandTotal, lines);
    }
  }
};
