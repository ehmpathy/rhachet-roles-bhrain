/**
 * .what = reads a guard's `provenance.uri` via a minimal, dependency-free line-scan
 * .why = the upgrade decide-phase needs only the guard's LINEAGE (where it came from).
 *   it must NOT route through `parseStoneGuard` (a 420-line state machine that expands
 *   `@path` refs via disk i/o, validates iso timeouts, and asserts global slug
 *   uniqueness — all of which throw). a broken-in-some-unrelated-way guard must still be
 *   readable for lineage so it can be diffed and healed (the plan-never-fails invariant).
 *
 * .note = position-independent: it finds `provenance:` wherever it sits, then its first
 *   indented `uri:` child. malformed (key present but no/empty uri child) yields null,
 *   which the decision layer reads as 'skipped, no provenance'.
 */
export const getGuardProvenance = (input: {
  content: string;
}): { uri: string } | null => {
  const lines = input.content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (line.trim() !== 'provenance:') continue;

    // the provenance block owns lines indented deeper than the `provenance:` key
    const keyIndent = (line.match(/^(\s*)/)?.[1] ?? '').length;

    for (let j = i + 1; j < lines.length; j++) {
      const child = lines[j] ?? '';
      const childTrim = child.trim();

      // skip blanks and comments inside the block
      if (childTrim === '' || childTrim.startsWith('#')) continue;

      // a dedent to the key's level (or shallower) ends the provenance block
      const childIndent = (child.match(/^(\s*)/)?.[1] ?? '').length;
      if (childIndent <= keyIndent) break;

      // the uri child: `uri: <path>` (quotes stripped)
      const uriMatch = childTrim.match(/^uri:\s*(.+)$/);
      if (uriMatch) {
        const raw = uriMatch[1]?.trim() ?? '';
        const uri = raw.replace(/^["'](.*)["']$/, '$1');
        if (uri === '') return null; // malformed: empty uri
        return { uri };
      }
    }

    // provenance key present but no uri child found
    return null;
  }

  // no provenance key at all
  return null;
};
