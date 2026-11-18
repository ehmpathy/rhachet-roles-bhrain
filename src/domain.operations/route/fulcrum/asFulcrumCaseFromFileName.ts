const FULCRUM_ENTRY_PATTERN = /^inventory\.of=fulcrums\.case=([^.]+)\.md$/;

/**
 * .what = the case id and title a fulcrum file name declares, or null for a name that is no entry
 * .why = the gate, the linter, and the dispute-time check each name an entry by its file name,
 *        even one whose frontmatter cannot be read; one parse, so no two surfaces name it apart
 *
 * .note = `inventory.of=fulcrums.case=F44-rename-table.md` → `{ slug: 'F44', title: 'rename-table' }`.
 *         a segment with no title reads its slug as the title
 */
export const asFulcrumCaseFromFileName = (input: {
  name: string;
}): { slug: string; title: string } | null => {
  const segment = input.name.match(FULCRUM_ENTRY_PATTERN)?.[1];
  if (!segment) return null;
  const [slug = segment, ...titleParts] = segment.split('-');
  return { slug, title: titleParts.join('-') || segment };
};
