/**
 * .what = the exit yield a course writes when it pops back to its pursuit
 * .why = a reader of the course route sees when it exited and where the bind went
 * .note = a record for the reader, never the proof of exit: the `exited` judge reads the
 *         `6.exit` passage, which only `course exit` appends
 */
export const asExitYieldMarkdown = (input: {
  ordinal: number;
  slug: string;
  exitedOn: string;
  pursuitRoute: string;
}): string =>
  [
    `# exit: course ${input.ordinal}, ${input.slug}`,
    '',
    `- exited = ${input.exitedOn}`,
    `- back to = ${input.pursuitRoute}`,
    '',
  ].join('\n');
