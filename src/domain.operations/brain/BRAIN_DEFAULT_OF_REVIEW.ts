/**
 * .what = the brain that reviews a lane when no `--brain` is given
 * .why = deepseek flash: cheap, fast, and effective for code review. served via
 *        openrouter, whose `floor` filter routes each ask to the cheapest host that
 *        keeps every promise.
 *        VERSIONLESS (rule.require.versionless-brain-defaults): an openrouter TIER
 *        slug names no version, and the package picks the newest live model on the
 *        tier's line at ask time, so a retired version never strands a lane.
 *        `reviewDefaultBrains.test.ts` holds the slug registered
 *
 * .note = a separate decision from `FIXED_FALLBACK_BRAIN`, the sub-brain that
 *         tallies an unreadable verdict. the two hold the same slug today and must
 *         move apart freely: an alias between them meant a cheaper tally extractor
 *         would silently change every lane's review model — and with it each
 *         lane's prompt-cache prefix and its spend
 *
 * .note = an atom brain with no tool use: `--focus pull` is refused on it, so a
 *         lane on the default brain runs `--focus push`
 */
export const BRAIN_DEFAULT_OF_REVIEW = 'openrouter/deepseek/flash';
