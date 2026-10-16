import { MalfunctionError } from 'helpful-errors';

/**
 * .what = the metadata shape every helpful error accepts, read off the parent class
 * .why = `helpful-errors` declares it generic and does not export the type from its
 *        root, so it is derived here rather than reached for by a deep import path
 */
type MetadataOfHelpfulError = NonNullable<MalfunctionError['metadata']>;

/**
 * .what = a watermark whose bytes on disk are not valid json — torn by a crashed write,
 *         or broken by a hand edit
 * .why = a bare `SyntaxError` names neither the file nor the key, so a human who meets it
 *        cannot find what to repair (rule.require.failloud). this class carries both
 *
 * .note = a fault of the STORE, never of the code that asked: `isErrorOfWatermarkFault`
 *         allowlists it by name, so a prime that meets a torn watermark pours
 *         cold and names it on stderr, as for any other store fault, rather than fail a
 *         review whose verdict stands
 */
export class ReviewWatermarkParseError<
  TMetadata extends MetadataOfHelpfulError = MetadataOfHelpfulError,
> extends MalfunctionError<TMetadata> {}
