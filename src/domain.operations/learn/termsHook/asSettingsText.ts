import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';

/**
 * .what = the settings as text, in the form the file already had
 * .why = a toggle's diff must be its own block alone. a file a human indented with four spaces,
 *        or saved with no trailer newline, would otherwise be reformatted whole, and the block
 *        would hide inside a diff of every line
 *
 * .note = the indent is read off the first indented key; the trailer newline is kept or left
 *         off as found. a new file takes rhachet's form: two spaces, one trailer newline
 */
export const asSettingsText = (input: {
  settings: ClaudeSettingsOfRepo;
  textFound: string | null;
}): string => {
  const indent = input.textFound?.match(/\n([ \t]+)"/)?.[1] ?? '  ';
  const trailer =
    input.textFound === null || input.textFound.endsWith('\n') ? '\n' : '';
  return `${JSON.stringify(input.settings, null, indent)}${trailer}`;
};
