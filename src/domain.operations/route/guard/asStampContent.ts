/**
 * .what = composes the stamp body from the emit streams
 * .why = stderr carries the blocker/malfunction detail; append it under a box-draw
 *        divider so the stamp shows both what happened (stdout) and why it blocks (stderr)
 * .note = pure transformer — reuses the already-formatted emit strings, never re-formats
 */
const STAMP_DIVIDER = '─'.repeat(64);

/**
 * .what = strips ansi color/style escape codes from text
 * .why = judge subprocess stderr carries raw ansi sequences; the stamp is a
 *        persisted, human-read artifact, so the codes are visual noise on disk
 * .note = build the pattern from the escape charcode (27) so no literal control
 *         character appears in source (keeps the linter happy)
 */
const ANSI_ESCAPE_PATTERN = new RegExp(
  `${String.fromCharCode(27)}\\[[0-9;]*m`,
  'g',
);
const asPlainText = (text: string): string =>
  text.replace(ANSI_ESCAPE_PATTERN, '');

export const asStampContent = (input: {
  emit: { stdout: string; stderr?: string };
}): string => {
  const stdout = asPlainText(input.emit.stdout);
  if (!input.emit.stderr) return stdout;
  const stderr = asPlainText(input.emit.stderr);
  return [stdout, '', STAMP_DIVIDER, '', stderr].join('\n');
};
