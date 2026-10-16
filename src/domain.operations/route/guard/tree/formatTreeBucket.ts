import { asTreeBranchMarkers } from './asTreeBranchMarkers';

/**
 * .what = formats content into a tree bucket structure
 * .why = provides visual containment for stdout/stderr in artifacts
 *
 * format (default, a middle child):
 * ├─ {label}
 * │  ├─
 * │  │  {line1}
 * │  │  {line2}
 * │  └─
 *
 * format (isLast — the parent's final child, so no peer bar beneath):
 * └─ {label}
 *    ├─
 *    │  {line1}
 *    │  {line2}
 *    └─
 */
export const formatTreeBucket = (input: {
  label: string;
  content: string;
  isLast?: boolean;
}): string => {
  const lines: string[] = [];

  // the elbow marks this bucket's branch; the stem is the column beneath it
  const { elbow, stem: cont } = asTreeBranchMarkers({
    isLast: input.isLast ?? false,
  });

  // label line
  lines.push(`${elbow} ${input.label}`);

  // bucket open
  lines.push(`${cont}├─`);

  // content lines (prefixed, trimmed of consecutive newlines)
  const trimmedContent = input.content
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/^\n+/, '') // trim start newlines
    .replace(/\n+$/, ''); // trim end newlines

  // if content is empty, just one blank line; otherwise borders + content
  if (trimmedContent === '') {
    lines.push(`${cont}│`);
  } else {
    // border: blank line before content
    lines.push(`${cont}│`);

    // content lines — a blank one is a bare rail, with no pad behind it, so every blank
    // row of the bucket renders at one width (rule.forbid.snapshot-visual-blemishes)
    for (const line of trimmedContent.split('\n')) {
      lines.push(line === '' ? `${cont}│` : `${cont}│  ${line}`);
    }

    // border: blank line after content
    lines.push(`${cont}│`);
  }

  // bucket close
  lines.push(`${cont}└─`);

  return lines.join('\n');
};
