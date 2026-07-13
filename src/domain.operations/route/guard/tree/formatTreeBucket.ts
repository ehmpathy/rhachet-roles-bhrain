/**
 * .what = formats content into a tree bucket structure
 * .why = provides visual containment for stdout/stderr in artifacts
 *
 * format:
 * ├─ {label}
 * │  ├─
 * │  │  {line1}
 * │  │  {line2}
 * │  └─
 */
export const formatTreeBucket = (input: {
  label: string;
  content: string;
}): string => {
  const lines: string[] = [];

  // label line
  lines.push(`├─ ${input.label}`);

  // bucket open
  lines.push('│  ├─');

  // content lines (prefixed, trimmed of consecutive newlines)
  const trimmedContent = input.content
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/^\n+/, '') // trim start newlines
    .replace(/\n+$/, ''); // trim end newlines

  // if content is empty, just one blank line; otherwise borders + content
  if (trimmedContent === '') {
    lines.push('│  │');
  } else {
    // border: blank line before content
    lines.push('│  │');

    // content lines
    for (const line of trimmedContent.split('\n')) {
      lines.push(`│  │  ${line}`);
    }

    // border: blank line after content
    lines.push('│  │');
  }

  // bucket close
  lines.push('│  └─');

  return lines.join('\n');
};
