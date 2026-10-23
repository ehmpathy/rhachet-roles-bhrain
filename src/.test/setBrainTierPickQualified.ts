import { ConstraintError } from 'helpful-errors';

import { getAllTierModelIdsNewestFirst } from './getAllTierModelIdsNewestFirst';
import { BRAIN_TIER, type sdkBrainTierPick } from './sdkBrainTierPick';

/**
 * .what = the model line of the tier, as the brains package reads it
 * .note = the package keeps this regex private. the probe after the write fails loud if the
 *         two ever part, so a drift never hides
 */
const TIER_LINE = /^deepseek\/deepseek-v\d+(?:\.\d+)*-flash(?:-\d{4})?$/;

/**
 * .what = the supply promises every test brain keeps (see DEFAULT_TEST_BRAIN)
 */
const PROMISES = 'speed=min100tps&privacy=full';

/**
 * .what = the refusal the brains package raises before it sends a call, when no host of the
 *         model keeps every promise
 */
const REFUSAL_NEEDLE = 'keeps every promise';

/**
 * .what = makes the tier reach a model whose hosts keep the test promises
 * .why = the tier takes the newest model on its line. a newest model can ship with no host that
 *        is fast and zero-retention (a model with no throughput record yet counts as slow), and
 *        every live-brain test then fails at once. a machine that picked a week ago never
 *        meets it; a fresh ci machine meets it on its first ask
 *
 * .how = probe the real test brain. when it answers, the pick stands. when the package refuses
 *        for the promises, probe the line newest first on unlisted slugs, hold the first model
 *        that answers, and probe the real test brain again. a second refusal fails loud, once
 */
export const setBrainTierPickQualified = async (
  input: { slugTest: string },
  context: { sdk: typeof sdkBrainTierPick },
): Promise<{
  status: 'held' | 'primed' | 'skipped';
  model: string | null;
}> => {
  // probe the real test brain; a model that answers is the pick already
  const verdictOfTier = await context.sdk.getOneProbeVerdict({
    slug: input.slugTest,
  });
  if (verdictOfTier.qualified) return { status: 'held', model: null };

  // a fault that is not a refusal for the promises is for the tests to report
  if (!verdictOfTier.error.includes(REFUSAL_NEEDLE))
    return { status: 'skipped', model: null };

  // walk the line newest first, and keep the first model that keeps the promises
  const candidates = getAllTierModelIdsNewestFirst({
    catalog: await context.sdk.getAllCatalogModels(),
    line: TIER_LINE,
  });
  const modelQualified = await candidates.reduce<Promise<string | null>>(
    async (found, id) => {
      const foundAlready = await found;
      if (foundAlready) return foundAlready;
      const verdict = await context.sdk.getOneProbeVerdict({
        slug: `openrouter/${id}/${PROMISES}`,
      });
      return verdict.qualified ? id : null;
    },
    Promise.resolve(null),
  );
  if (!modelQualified)
    throw new ConstraintError(
      'no model on the tier line has a host that keeps the test promises',
      { tier: BRAIN_TIER, promises: PROMISES, candidates },
    );

  // hold it, then prove the package reads the held pick
  await context.sdk.setTierPickHeld({ model: modelQualified });
  const verdictAfter = await context.sdk.getOneProbeVerdict({
    slug: input.slugTest,
  });
  if (!verdictAfter.qualified)
    throw new ConstraintError(
      'the tier still fails after its pick was held; the held entry no longer matches the package',
      { tier: BRAIN_TIER, model: modelQualified, error: verdictAfter.error },
    );
  return { status: 'primed', model: modelQualified };
};
