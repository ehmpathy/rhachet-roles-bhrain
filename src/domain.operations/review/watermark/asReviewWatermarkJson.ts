import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

import { asReviewWatermarkDir } from './asReviewWatermarkDir';
import { ReviewWatermarkParseError } from './ReviewWatermarkParseError';

/**
 * .what = parses one watermark's raw bytes into its declared shape, or throws a
 *         `ReviewWatermarkParseError` that names the key and the dir it lives in
 * .why = every watermark reader parses the same way, so the fault a torn or hand-edited
 *        watermark raises has one home and always names what to repair
 *        (rule.require.failloud). a valid-json edit of the wrong shape still reads as absent
 *        fields; a broken one now fails loud with its address, never as a bare `SyntaxError`
 *
 * .note = the `as` binds field NAMES only, at a cache-file boundary: each watermark is
 *         written by this repo's own setter alone, so its shape is ours
 */
export const asReviewWatermarkJson = <TShape>(input: {
  raw: string;
  key: string;
  cwd: string;
}): TShape => {
  try {
    return JSON.parse(input.raw) as TShape;
  } catch (error) {
    // only a parse fault is wrapped; any other throw surfaces as itself
    if (!getAllErrorClassNames({ error }).includes('SyntaxError')) throw error;
    // the headline itself names the key and dir, since a one-line render keeps only it
    const dir = asReviewWatermarkDir({ cwd: input.cwd });
    throw new ReviewWatermarkParseError(
      `the watermark is not valid json: key '${input.key}' under ${dir}; delete it and the next round rewrites it`,
      {
        key: input.key,
        dir,
        fault: String(error),
      },
    );
  }
};
