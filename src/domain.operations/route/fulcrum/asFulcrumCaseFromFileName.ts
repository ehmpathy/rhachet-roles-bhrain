const FULCRUM_ENTRY_PATTERN = /^inventory\.of=fulcrums\.case=([^.]+)\.md$/;

/**
 * .what = the malformed-field line for a file whose name declares no case
 * .why = the linter and the dispute-time check name one defect the same way: the file name
 */
export const FULCRUM_FILE_NAME_MALFORMED =
  'file name (inventory.of=fulcrums.case=<id>-<slug>.md)';

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
