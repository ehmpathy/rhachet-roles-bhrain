import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';
import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = the error to throw when a run artifact's body fails to parse
 * .why = only a `SyntaxError` means the body is torn, so only it becomes a
 *        `ReviewRunArtifactError` that names the file. any other class — a `RangeError`
 *        from the engine — is a real fault, and surfaces as itself, never as a corrupt
 *        artifact a caller would meter as a defect row and carry past (rule.forbid.failhide)
 *
 * .note = pure, so the allowlist is proven with real error instances in a unit test,
 *         never by a mock of the parser in an integration test
 */
export const asRunArtifactParseFault = (input: {
  error: unknown;
  dir: string;
  file: string;
}): unknown => {
  // a fault other than a torn body is not ours to rename
  if (!getAllErrorClassNames({ error: input.error }).includes('SyntaxError'))
    return input.error;

  // a torn body names its file
  return new ReviewRunArtifactError(
    `review log artifact is present but unparseable: ${input.file}`,
    { dir: input.dir, file: input.file, error: String(input.error) },
  );
};
