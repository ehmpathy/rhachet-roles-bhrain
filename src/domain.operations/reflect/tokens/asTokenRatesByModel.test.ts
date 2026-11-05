import type { BrainAtom } from 'rhachet';
import { given, then, when } from 'test-fns';

import { asTokenRatesByModel } from './asTokenRatesByModel';

/**
 * .what = an atom stub with a given slug and cash rates
 */
const genAtom = (input: {
  slug: string;
  input: number;
}): Pick<BrainAtom, 'repo' | 'slug' | 'spec'> =>
  ({
    repo: 'anthropic',
    slug: input.slug,
    spec: {
      cost: {
        cash: {
          per: 'token',
          input: input.input,
          output: 0.000025,
          cache: { get: 0.0000005, set: 0.00000625 },
        },
      },
    },
  }) as unknown as Pick<BrainAtom, 'repo' | 'slug' | 'spec'>; // .note = stub; only spec.cost.cash is read

describe('asTokenRatesByModel', () => {
  given('[case1] a versioned atom for the transcript model', () => {
    when('[t0] the rates are mapped', () => {
      then('the model is priced from that exact atom', () => {
        const rates = asTokenRatesByModel({
          models: ['claude-opus-4-5-20251101'],
          atoms: [
            genAtom({ slug: 'claude/opus', input: 0.000099 }),
            genAtom({ slug: 'claude/opus/v4.5', input: 0.000005 }),
          ],
        });
        const opus = rates.get('claude-opus-4-5-20251101');
        expect(opus?.input).toEqual(0.000005);
        expect(opus?.cacheRead).toEqual(0.0000005);
        expect(opus?.cacheWrite5m).toEqual(0.00000625);
      });
    });
  });

  given('[case2] only a version-less alias for the transcript model', () => {
    when('[t0] the rates are mapped', () => {
      then(
        'the model stays unpriced; an alias never stands in for a version',
        () => {
          const rates = asTokenRatesByModel({
            models: ['claude-opus-5-5'],
            atoms: [genAtom({ slug: 'claude/opus', input: 0.000005 })],
          });
          const opus = rates.get('claude-opus-5-5');
          expect(opus?.input).toBeNull();
          expect(opus?.output).toBeNull();
          expect(opus?.cacheRead).toBeNull();
        },
      );
    });
  });

  given('[case3] a model no anthropic slug names', () => {
    when('[t0] the rates are mapped', () => {
      then('it is unpriced', () => {
        const rates = asTokenRatesByModel({
          models: ['<synthetic>'],
          atoms: [genAtom({ slug: 'claude/opus/v4.5', input: 0.000005 })],
        });
        expect(rates.get('<synthetic>')?.input).toBeNull();
      });
    });
  });
});
