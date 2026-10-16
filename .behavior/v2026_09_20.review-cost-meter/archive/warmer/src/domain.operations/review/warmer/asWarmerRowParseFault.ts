import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { NAME_OF_WARMER_ROWS } from '@src/domain.operations/review/warmer/setOneWarmerPokeRow';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = the error to throw when one row of the warmer ledger fails to parse
 * .why = only a `SyntaxError` means the row is torn, so only it becomes a
 *        `ReviewRunArtifactError` that names the file and the row. any other class — a
 *        `RangeError` from the engine — is a real fault, and surfaces as itself
 *        (rule.forbid.failhide)
 *
 * .note = pure, so the allowlist is proven with real error instances in a unit test,
 *         never by a mock of the parser in an integration test. the peer of
 *         `meter/asRunArtifactParseFault`, which names a whole artifact where this names a row
 */
export const asWarmerRowParseFault = (input: {
  error: unknown;
  dir: string;
  row: number;
}): unknown => {
  // a fault other than a torn row is not ours to rename
  if (!getAllErrorClassNames({ error: input.error }).includes('SyntaxError'))
    return input.error;

  // a helpful class, never a bare `Error`. the caller that catches this is the meter's
  // per-run isolation, which stringifies a throw into the `defect` row — so the context
  // rides as metadata a reader can filter on (rule.require.failloud)
  return new ReviewRunArtifactError(
    `warmer row is present but unparseable, in ${NAME_OF_WARMER_ROWS}`,
    {
      dir: input.dir,
      file: NAME_OF_WARMER_ROWS,
      row: input.row,
      // `parseError`, never `cause` — the error class reserves `cause` for an `Error`
      parseError: String(input.error),
    },
  );
};
