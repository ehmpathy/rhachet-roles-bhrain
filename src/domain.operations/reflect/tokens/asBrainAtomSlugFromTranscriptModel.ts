/**
 * .what = the rhachet brain atom slug a transcript's model id names, or null
 * .why = a transcript records the provider's model id (`claude-opus-4-5-20251101`); the
 *        brain atom that carries its price spec is keyed by slug (`claude/opus/v4.5`)
 *
 * .note = both provider id orders are read: family-first (`claude-opus-4-5`) and
 *         version-first (`claude-3-5-haiku`); a date suffix or a `[1m]` tag is dropped
 */
export const asBrainAtomSlugFromTranscriptModel = (input: {
  model: string;
}): string | null => {
  const model = input.model.replace(/\[.*\]$/, '');

  // family-first: claude-opus-4-5-20251101, claude-sonnet-4-20250514, claude-opus-5-5
  const familyFirst = model.match(
    /^claude-(opus|sonnet|haiku)-(\d{1,2})(?:-(\d{1,2}))?(?:-\d{8})?$/,
  );
  if (familyFirst)
    return asSlug({
      family: familyFirst[1]!,
      major: familyFirst[2]!,
      minor: familyFirst[3] ?? null,
    });

  // version-first: claude-3-5-haiku-20241022
  const versionFirst = model.match(
    /^claude-(\d{1,2})(?:-(\d{1,2}))?-(opus|sonnet|haiku)(?:-\d{8})?$/,
  );
  if (versionFirst)
    return asSlug({
      family: versionFirst[3]!,
      major: versionFirst[1]!,
      minor: versionFirst[2] ?? null,
    });

  return null;
};

/**
 * .what = composes a slug from its parts
 * .why = one shape for both id orders
 */
const asSlug = (input: {
  family: string;
  major: string;
  minor: string | null;
}): string =>
  `claude/${input.family}/v${input.major}${input.minor === null ? '' : `.${input.minor}`}`;
