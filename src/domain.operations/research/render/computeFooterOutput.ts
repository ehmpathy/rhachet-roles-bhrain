import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';

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

  // with an opener, the tree closes on where the wish opened
  if (input.opener)
    return [
      `🔭 reach for the stars,`,
      `   ├─ ${input.wishPathRel}`,
      `   └─ ${dim}opened in ${input.opener}${reset}`,
    ].join('\n');

  // without one, the tree closes on the wish, and the --open move rides its own block
  // (rule.require.coconut-hints)
  return [
    `🔭 reach for the stars,`,
    `   └─ ${input.wishPathRel}`,
    ...asDidYouKnowLines({
      rows: ['add --open <opener> to open the wish automatically'],
    }),
  ].join('\n');
};
