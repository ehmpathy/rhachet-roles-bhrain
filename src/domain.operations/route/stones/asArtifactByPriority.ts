/**
 * .what = resolves artifact priority when multiple patterns match
 * .why = ensures consistent artifact selection across driver operations
 *
 * .note = priority order:
 *   1. .yield.md — new default: markdown yield
 *   2. .yield.* — new: non-markdown yields (e.g., .yield.json)
 *   3. .yield — new: extensionless yield
 *   4. .v1.i1.md — legacy: version/iteration pattern
 *   5. .i1.md — test: abbreviated iteration pattern
 */
export const asArtifactByPriority = (input: {
  artifacts: string[];
  stoneName: string;
}): string | null => {
  // define priority patterns (order matters)
  const patterns: Array<{
    suffix: string | RegExp;
    priority: number;
  }> = [
    { suffix: '.yield.md', priority: 1 },
    { suffix: /\.yield\.[^.]+$/, priority: 2 }, // .yield.* (any extension)
    { suffix: '.yield', priority: 3 }, // extensionless
    { suffix: '.v1.i1.md', priority: 4 }, // legacy
    { suffix: '.i1.md', priority: 5 }, // test pattern
  ];

  // find highest priority match
  for (const pattern of patterns) {
    const match = input.artifacts.find((artifact) =>
      typeof pattern.suffix === 'string'
        ? artifact.endsWith(pattern.suffix)
        : pattern.suffix.test(artifact),
    );
    if (match) return match;
  }

  // fallback: return first .md match or null
  return input.artifacts.find((a) => a.endsWith('.md')) ?? null;
};
