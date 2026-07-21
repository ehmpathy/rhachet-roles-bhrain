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

  // the label marker is `└─` when this bucket is its parent's last child, else `├─`
  const labelMarker = input.isLast ? '└─' : '├─';
  // the continuation column beneath the label: a space when last (no peer bar), else `│`
  const cont = input.isLast ? '   ' : '│  ';

  // label line
  lines.push(`${labelMarker} ${input.label}`);

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

    // content lines
    for (const line of trimmedContent.split('\n')) {
      lines.push(`${cont}│  ${line}`);
    }

    // border: blank line after content
    lines.push(`${cont}│`);
  }

  // bucket close
  lines.push(`${cont}└─`);

  return lines.join('\n');
};
