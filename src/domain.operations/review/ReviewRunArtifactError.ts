import { UnexpectedCodePathError } from 'helpful-errors';

/**
 * .what = the metadata shape every helpful error accepts, read off the parent class
 * .why = `helpful-errors` declares it generic and does not export the type from its
 *        root, so it is derived here rather than reached for by a deep import path
 */
type MetadataOfHelpfulError = NonNullable<UnexpectedCodePathError['metadata']>;

/**
 * .what = a defect in a review run's ARTIFACTS on disk — unreadable, unparseable, or torn
 * .why = the meter isolates each run, so one corrupt log dir cannot deny a report its
 *        other rows. that isolation must key on a class only artifact reads raise; the
 *        generic `UnexpectedCodePathError` also marks code bugs (an unhandled `never`
 *        branch), and a code bug must surface as itself, never as one `unknown` row
 *        (rule.forbid.failhide).
 *
 * .note = extends `UnexpectedCodePathError`, so a caller that allowlists the parent
 *         still sees an artifact defect as a malfunction, never a constraint.
 *
 * .note = generic over its metadata, as its parent is, so the static `.throw` keeps
 *         its `this` contract
 */
export class ReviewRunArtifactError<
  TMetadata extends MetadataOfHelpfulError = MetadataOfHelpfulError,
> extends UnexpectedCodePathError<TMetadata> {}
