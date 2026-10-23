/**
 * .what = the fixed sub-brain used to tally a review whose verdict is not numeric
 * .why = deepseek flash: cheap, fast, and effective on the tiny extraction task. VERSIONLESS
 *        (rule.require.versionless-brain-defaults) — an openrouter tier slug names no
 *        version; `reviewDefaultBrains.test.ts` holds it registered. it is NOT configurable
 *        per route/guard — one default, kept simple.
 *        declared once here so the cli builder, the render, and the persisted footer all
 *        reference the same slug (rule.forbid.magic-values).
 *
 * .note = its own file, a peer of `BRAIN_DEFAULT_OF_REVIEW` and `CREDS_OF_REVIEW_BRAIN`,
 *         never a second export of the supply that builds it: the two slugs move apart
 *         freely, and a reader of the slug should not have to load an operation module
 */
export const FIXED_FALLBACK_BRAIN = 'openrouter/deepseek/flash';
