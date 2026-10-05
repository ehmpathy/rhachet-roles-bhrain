/**
 * .what = the brain a review runs on when no --brain is given — the one declaration of the slug
 * .why = `review`, `review.by`, and the tally fallback all default to it. three literals once
 *        declared it, and a vendor swap that missed one would ship a split brain with no compiler
 *        signal (rule.forbid.magic-values). one constant, every default reads it
 * .note = the slug names a TIER, not a pinned model. rhachet-brains-openrouter matches
 *         `deepseek/flash` against openrouter's live catalog (`deepseek-v{n}-flash`), so a new
 *         deepseek flash release — or a package bump — can change the model behind it, with no
 *         diff in this repo. to pin one model, name its full slug (fulcrum F4)
 */
export const DEFAULT_REVIEW_BRAIN = 'openrouter/deepseek/flash';
