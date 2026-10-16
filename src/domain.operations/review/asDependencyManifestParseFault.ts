import { MalfunctionError } from 'helpful-errors';

import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = the error to throw when a dependency's package.json fails to parse
 * .why = only a `SyntaxError` means the manifest is torn, so only it becomes a
 *        `MalfunctionError` that names the file. any other class — a `RangeError` from the
 *        engine — is a real fault, and surfaces as itself (rule.forbid.failhide)
 *
 * .note = pure, so the allowlist is proven with real error instances in a unit test,
 *         never by a mock of the parser in an integration test
 */
export const asDependencyManifestParseFault = (input: {
  error: unknown;
  path: string;
}): unknown => {
  // a fault other than a torn manifest is not ours to rename
  if (!getAllErrorClassNames({ error: input.error }).includes('SyntaxError'))
    return input.error;

  // a torn manifest names its file and class (rule.require.failloud)
  return new MalfunctionError(
    `a dependency manifest is present but unparseable: ${input.path}`,
    { path: input.path, error: String(input.error) },
  );
};
