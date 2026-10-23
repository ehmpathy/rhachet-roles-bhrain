import type { BrainAtom } from 'rhachet';
import { getAvailableBrains } from 'rhachet/brains';

import type { TokenRates } from '@src/domain.objects/Reflector/TokenRates';

import { asTokenRatesByModel } from './asTokenRatesByModel';
import { isModuleAbsent } from './isModuleAbsent';

/**
 * .what = the per-token rates for each model a transcript names, from the brain atom specs
 * .why = price is the only unit that knows a cache read from a write from a raw input, and
 *        the specs are the one source of truth for it. this repo holds no rate table; it
 *        reads whatever rhachet-brains-* packages the caller has installed
 */
export const getAllTokenRatesByModel = async (input: {
  models: string[];
}): Promise<Map<string, TokenRates>> => {
  // discover the installed atoms, plus the versioned anthropic atoms discovery omits
  const { atoms } = await getAvailableBrains();
  const atomsVersioned = await getAnthropicAtomsVersioned();

  // price each model by an exact versioned slug match
  return asTokenRatesByModel({
    models: input.models,
    atoms: [...atoms, ...atomsVersioned],
  });
};

/**
 * .what = one atom stub per versioned anthropic slug (e.g. `claude/opus/v4.5`)
 * .why = discovery lists only the version-less aliases (`claude/opus`), and an alias
 *        points at whichever version the package last pinned. a transcript names an
 *        exact model, so only an exact versioned spec may price it
 *
 * .note = absent package → no stubs; its models render `unpriced`
 */
const getAnthropicAtomsVersioned = async (): Promise<
  Pick<BrainAtom, 'repo' | 'slug' | 'spec'>[]
> => {
  // load the package config; an absent package is a legitimate empty answer
  const module = await import(
    'rhachet-brains-anthropic/dist/domain.operations/atoms/BrainAtom.config'
  ).catch((error: unknown) => {
    if (isModuleAbsent({ error })) return null;
    throw error;
  });
  if (!module) return [];

  // keep only the versioned slugs; an alias must never stand in for a version
  return Object.entries(module.CONFIG_BY_ATOM_SLUG)
    .filter(([slug]) => /\/v\d/.test(slug))
    .map(([slug, config]) => ({ repo: 'anthropic', slug, spec: config.spec }));
};
