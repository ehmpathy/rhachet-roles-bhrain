import { estimateTokenCount } from './estimateTokenCount';

/**
 * .what = content entry for token breakdown
 * .why = enables analysis of which files consume most tokens
 */
export interface TokenBreakdownEntry {
  path: string;
  type: 'FILE' | 'DIRECTORY';
  tokens: number;
  tokensHuman: string;
  tokensScale: string;
}

/**
 * .what = formats token count for human readability
 * .why = makes large numbers easier to scan
 */
const formatTokens = (tokens: number): string => {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return `${tokens}`;
};

/**
 * .what = rounds to hundredths for percentage display
 * .why = consistent precision in scale values
 */
const roundToHundredths = (num: number): number => Math.round(num * 100) / 100;

/**
 * .what = generates token breakdown report grouped by directory
 * .why = helps identify which files/dirs consume most context window
 */
export const genTokenBreakdownReport = (input: {
  files: Array<{ path: string; content: string }>;
}): { entries: TokenBreakdownEntry[]; total: number } => {
  // calculate tokens per file
  const fileEntries = input.files.map((file) => {
    const tokens = estimateTokenCount({ content: file.content });
    return {
      path: file.path,
      type: 'FILE' as const,
      tokens,
    };
  });

  // build directory token sums
  const dirTokens = new Map<string, number>();
  for (const file of fileEntries) {
    const parts = file.path.split('/');
    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i]!;
      dirTokens.set(current, (dirTokens.get(current) ?? 0) + file.tokens);
    }
  }

  // create directory entries
  const dirEntries = Array.from(dirTokens.entries()).map(([path, tokens]) => ({
    path,
    type: 'DIRECTORY' as const,
    tokens,
  }));

  // combine and sort by tokens descending
  const allEntries = [...fileEntries, ...dirEntries].sort(
    (a, b) => b.tokens - a.tokens,
  );

  // calculate total
  const total = fileEntries.reduce((sum, f) => sum + f.tokens, 0);

  // add human-readable fields
  const entries: TokenBreakdownEntry[] = allEntries.map((entry) => ({
    ...entry,
    tokensHuman: formatTokens(entry.tokens),
    tokensScale: `${roundToHundredths((entry.tokens / total) * 100)}%`,
  }));

  return { entries, total };
};
