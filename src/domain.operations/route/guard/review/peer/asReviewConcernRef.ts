import { BadRequestError } from 'helpful-errors';

/**
 * .what = one concern's address within ONE reviewer's given — a kind and a 1-based ordinal
 * .why = a stance targets one concern, never a whole lane (S07), so it needs a way to name one
 */
export interface ReviewConcernRef {
  kind: 'blocker' | 'nitpick';
  ordinal: number;
}

/**
 * .what = parses the `--about <concern>` argument into a kind and an ordinal
 * .why = `--as disputed|conceded --about blocker.3` names ONE concern. a lane-grained stance
 *        sheds every concern that lane raised, even ones the driver never read
 *        (rule.forbid.suppression-of-undeclared-concerns), so the grain must be the concern.
 *
 * 🔴 the ordinal is scoped to ONE given, and renumbers with it (F020 fork A). the wisher ruled
 *    *"absorptions do not survive rounds; only live in latest round"* (S08) — so `nitpick.4` in r3
 *    and `nitpick.4` in r4 are DIFFERENT concerns, and a stance answers the given it was
 *    declared against. that is why no durable id is needed, and why no reviewer is asked to
 *    mint one.
 *
 * .note = KIND, never severity. `contract.reviewer-output` splits two axes — KIND
 *         (blocker|nitpick) and SEVERITY (urgent|better) — and this ref names the KIND. the
 *         word `severity` is the declared term for the harm axis (F028/S14), so it is kept off
 *         this field to hold the term map single-valued (rule.forbid.domain-term-synonyms).
 *         the kind is fixed at exactly two, so this parse needs no third case.
 *
 * .note = 1-BASED, because the driver reads the ordinal off a rendered review where the first
 *         item is "1". a 0-based parse would silently address the driver's neighbour.
 */
export const asReviewConcernRef = (input: {
  about: string;
}): ReviewConcernRef => {
  const matched = input.about.match(/^(blocker|nitpick)\.(\d+)$/);
  if (!matched)
    throw new BadRequestError(
      `invalid --about: "${input.about}". expected <kind>.<ordinal>, where kind is blocker or nitpick — e.g. "blocker.1", "nitpick.4"`,
      { about: input.about },
    );

  // the regex fixed kind to exactly these two, so narrow by value rather than an as-cast
  const kind = matched[1] === 'blocker' ? 'blocker' : 'nitpick';
  const ordinal = parseInt(matched[2]!, 10);

  // an ordinal is 1-based, so 0 addresses no concern the driver can see
  if (ordinal < 1)
    throw new BadRequestError(
      `invalid --about: "${input.about}". the ordinal is 1-based, so it starts at 1`,
      { about: input.about, ordinal },
    );

  return { kind, ordinal };
};

/**
 * .what = renders a concern ref back to its `--about` form
 * .why = the ledger stores the string the driver passed, and the emits print it back. one
 *        renderer keeps the parse and the render from a drift the type system cannot see.
 */
export const asReviewConcernRefLabel = (input: {
  ref: ReviewConcernRef;
}): string => `${input.ref.kind}.${input.ref.ordinal}`;
