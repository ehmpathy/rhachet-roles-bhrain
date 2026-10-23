import type { BrainAtom } from 'rhachet';

import { TokenRates } from '@src/domain.objects/Reflector/TokenRates';

import { asBrainAtomSlugFromTranscriptModel } from './asBrainAtomSlugFromTranscriptModel';

/**
 * .what = maps each model to the rates of the anthropic atom its slug names
 * .why = the lookup is pure once the atoms are discovered, so it is tested without discovery
 *
 * .note = a model with no atom gets all-null rates; its tokens render `unpriced`
 * .note = `spec.cost.cash.cache.set` is the 5-minute write; no spec carries the 1-hour
 *         write, so `cacheWrite1h` is null until the specs grow one
 */
export const asTokenRatesByModel = (input: {
  models: string[];
  atoms: Pick<BrainAtom, 'repo' | 'slug' | 'spec'>[];
}): Map<string, TokenRates> => {
  const atomBySlug = new Map(
    input.atoms
      .filter((atom) => atom.repo === 'anthropic')
      .map((atom) => [atom.slug, atom]),
  );
  return new Map(
    [...new Set(input.models)].map((model) => {
      const slug = asBrainAtomSlugFromTranscriptModel({ model });
      const cash = slug ? (atomBySlug.get(slug)?.spec.cost.cash ?? null) : null;
      return [
        model,
        new TokenRates({
          model,
          input: cash?.input ?? null,
          output: cash?.output ?? null,
          cacheRead: cash?.cache.get ?? null,
          cacheWrite5m: cash?.cache.set ?? null,
          cacheWrite1h: null,
        }),
      ];
    }),
  );
};
