/**
 * .what = the status file's bytes: one line of compact json, keys in a fixed order, `line` last
 * .why = the bash reader parses it with one regex, `"line":"(.*)"}$`, so the writer fixes the
 *        shape: compact, `line` last, one newline at the end
 *
 * .note = no time field: the file's mtime carries "when written"
 *         (rule.forbid.timestamps-in-route-artifacts), and bash compares mtimes with `-nt`
 * .note = `JSON.stringify` escapes `"` and `\` in the line; the reader unescapes both
 */
export const asRouteStatusLineFileContent = (input: {
  route: string;
  stone: string | null;
  phase: string | null;
  line: string;
}): string =>
  `${JSON.stringify({
    route: input.route,
    stone: input.stone,
    phase: input.phase,
    line: input.line,
  })}\n`;
