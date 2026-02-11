/**
 * .what = compute footer output with relative wish path
 * .why = easy-to-copy path for open of the wish file
 */
export const computeFooterOutput = (input: {
  wishPathRel: string;
  opener?: string;
}): string => {
  const dim = '\x1b[2m';
  const reset = '\x1b[0m';

  // build output lines
  const lines = [`🔭 reach for the stars,`, `   ├─ ${input.wishPathRel}`];

  // add opener line or tip based on whether opener was used
  if (input.opener) {
    lines.push(`   └─ ${dim}opened in ${input.opener}${reset}`);
  } else {
    lines.push(
      `   └─ ${dim}tip: use --open to open the wish automatically${reset}`,
    );
  }

  return lines.join('\n');
};
