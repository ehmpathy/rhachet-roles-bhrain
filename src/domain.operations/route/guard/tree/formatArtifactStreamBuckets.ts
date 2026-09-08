import { formatTreeBucket } from './formatTreeBucket';

/**
 * .what = formats the stdout/stderr buckets of one artifact, with empty streams omitted
 * .why = an empty stream renders as a bordered box that wraps no text — pure noise on a
 *        driver-facing surface, and a violation of `rule.forbid.snapshot-visual-blemishes`
 *
 * .note = omission and last-child shape are ONE decision, so they live in ONE operation.
 *         to omit an empty `stderr` at a call site, without a re-read of the shape, would
 *         leave `stdout` marked `├─` with no peer beneath it — a new blemish traded for
 *         the old one. so the caller declares whether a footer follows, and this computes
 *         the marker for whichever bucket lands last.
 *
 * .note = a floor of one bucket. where BOTH streams are empty the artifact would otherwise
 *         print a bare label with no body at all, so `stdout` is kept as the empty case.
 */
export const formatArtifactStreamBuckets = (input: {
  stdout: string;
  stderr: string;
  hasFooter: boolean;
}): string[] => {
  // decide which streams earn a bucket; keep stdout as the floor when both are empty
  const labels: string[] = [];
  if (input.stdout.trim() !== '' || input.stderr.trim() === '')
    labels.push('stdout');
  if (input.stderr.trim() !== '') labels.push('stderr');

  const contentByLabel: Record<string, string> = {
    stdout: input.stdout,
    stderr: input.stderr,
  };

  // the final bucket closes the artifact only when no footer follows it
  return labels.map((label, index) =>
    formatTreeBucket({
      label,
      content: contentByLabel[label] ?? '',
      isLast: !input.hasFooter && index === labels.length - 1,
    }),
  );
};
