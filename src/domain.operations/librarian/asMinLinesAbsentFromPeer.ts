/**
 * .what = the lines of a text that count for the min-to-peer census, trimmed
 * .why = a fence mark and a table separator row carry no claim, and a blank line carries none
 *        either, so a line absent from the peer is one that makes a claim
 */
const asCountedLines = (input: { text: string }): string[] =>
  input.text
    .split('\n')
    .map((line) => line.trim())
    .filter(
      (line) =>
        line !== '' && !/^```/.test(line) && !/^\|[-|\s:]+\|$/.test(line),
    );

/**
 * .what = which lines of a min its peer `.md` lacks, verbatim after trim
 * .why = a min is the say tier and its `.md` is the ref tier. a line may leave a min only if
 *        its `.md` still carries it, and a cue kept in a min drifts silently if its `.md`
 *        changes and the min does not. both checks reduce to one question per line, a set
 *        membership, so the answer is computed rather than guessed
 *
 * .note = `total` counts the min's counted lines; `absent` lists those the peer lacks, in order
 */
export const asMinLinesAbsentFromPeer = (input: {
  minText: string;
  peerText: string;
}): { total: number; absent: string[] } => {
  const peerLines = new Set(asCountedLines({ text: input.peerText }));
  const minLines = asCountedLines({ text: input.minText });
  return {
    total: minLines.length,
    absent: minLines.filter((line) => !peerLines.has(line)),
  };
};
