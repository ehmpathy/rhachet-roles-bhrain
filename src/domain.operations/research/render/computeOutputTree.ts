import { compareStrings } from '@src/utils/compareStrings';

/**
 * .what = compute tree-style output for research init file actions
 * .why = vibed, scannable output that shows file actions clearly
 */
export const computeOutputTree = (input: {
  created: string[];
  kept: string[];
  updated: string[];
}): string => {
  // define symbols for each action type
  const symbolCreated = '+';
  const symbolKept = '✓';
  const symbolUpdated = '↻';

  // combine all files with their symbols
  const entries: Array<{ file: string; symbol: string }> = [
    ...input.created.map((file) => ({ file, symbol: symbolCreated })),
    ...input.kept.map((file) => ({ file, symbol: symbolKept })),
    ...input.updated.map((file) => ({ file, symbol: symbolUpdated })),
  ];

  // sort alphabetically by filename
  entries.sort((a, b) => compareStrings(a.file, b.file));

  // build header
  const header = '🦉 hooda thunk?';

  // handle empty case
  if (entries.length === 0) return header;

  // build tree lines
  const lines = entries.map((entry, index) => {
    const isLast = index === entries.length - 1;
    const branch = isLast ? '└─' : '├─';
    return `   ${branch} ${entry.symbol} ${entry.file}`;
  });

  return [header, ...lines].join('\n');
};
