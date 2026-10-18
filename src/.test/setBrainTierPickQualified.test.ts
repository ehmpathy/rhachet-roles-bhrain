import { getError, given, then, useThen, when } from 'test-fns';

import { type sdkBrainTierPick } from './sdkBrainTierPick';
import { setBrainTierPickQualified } from './setBrainTierPickQualified';

const SLUG_TEST = 'openrouter/deepseek/flash/floor&speed=min100tps&privacy=full';
const REFUSAL =
  'no endpoint of deepseek/deepseek-v4.1-flash-1017 keeps every promise. no call was sent.';

/**
 * .what = a fake sdk, whose probe answers per slug and whose writes are recorded
 * .why = the orchestrator is decided by what the probe says, never by a live host
 */
const genSdkFake = (input: {
  verdictBySlug: Record<string, 'ok' | 'refused' | 'fault'>;
  catalog: { id: string; created: number }[];
  heldSlugsAnswer?: 'ok' | 'refused';
}): { sdk: typeof sdkBrainTierPick; held: string[] } => {
  const held: string[] = [];
  const sdk: typeof sdkBrainTierPick = {
    getOneProbeVerdict: async ({ slug }) => {
      // the real test slug answers per whether a pick was held
      const verdict =
        slug === SLUG_TEST && held.length > 0
          ? (input.heldSlugsAnswer ?? 'ok')
          : (input.verdictBySlug[slug] ?? 'refused');
      if (verdict === 'ok') return { qualified: true };
      if (verdict === 'fault')
        return { qualified: false, error: 'connect ETIMEDOUT' };
      return { qualified: false, error: REFUSAL };
    },
    getAllCatalogModels: async () =>
      input.catalog.map((model) => ({ ...model, expiration_date: null })),
    setTierPickHeld: async ({ model }) => {
      held.push(model);
    },
  };
  return { sdk, held };
};

const PROMISES = 'speed=min100tps&privacy=full';

describe('setBrainTierPickQualified', () => {
  given('[case1] the tier already answers', () => {
    when('[t0] the pick is set', () => {
      const fake = genSdkFake({
        verdictBySlug: { [SLUG_TEST]: 'ok' },
        catalog: [],
      });
      const result = useThen('it returns', async () =>
        setBrainTierPickQualified({ slugTest: SLUG_TEST }, { sdk: fake.sdk }),
      );

      then('the pick stands and no pick is written', () => {
        expect(result).toEqual({ status: 'held', model: null });
        expect(fake.held).toEqual([]);
      });
    });
  });

  given('[case2] the tier fails for a reason that is not the promises', () => {
    when('[t0] the pick is set', () => {
      const fake = genSdkFake({
        verdictBySlug: { [SLUG_TEST]: 'fault' },
        catalog: [],
      });
      const result = useThen('it returns', async () =>
        setBrainTierPickQualified({ slugTest: SLUG_TEST }, { sdk: fake.sdk }),
      );

      then('it skips, and leaves the fault to the tests', () => {
        expect(result).toEqual({ status: 'skipped', model: null });
        expect(fake.held).toEqual([]);
      });
    });
  });

  given('[case3] the newest model has no qualified host, the next does', () => {
    when('[t0] the pick is set', () => {
      const fake = genSdkFake({
        verdictBySlug: {
          [SLUG_TEST]: 'refused',
          [`openrouter/deepseek/deepseek-v4.1-flash/${PROMISES}`]: 'ok',
        },
        catalog: [
          { id: 'deepseek/deepseek-v4-flash', created: 100 },
          { id: 'deepseek/deepseek-v4.1-flash-1017', created: 300 },
          { id: 'deepseek/deepseek-v4.1-flash', created: 200 },
        ],
      });
      const result = useThen('it returns', async () =>
        setBrainTierPickQualified({ slugTest: SLUG_TEST }, { sdk: fake.sdk }),
      );

      then('it holds the newest model that answers', () => {
        expect(result).toEqual({
          status: 'primed',
          model: 'deepseek/deepseek-v4.1-flash',
        });
        expect(fake.held).toEqual(['deepseek/deepseek-v4.1-flash']);
      });
    });
  });

  given('[case4] no model on the line has a qualified host', () => {
    when('[t0] the pick is set', () => {
      const fake = genSdkFake({
        verdictBySlug: { [SLUG_TEST]: 'refused' },
        catalog: [{ id: 'deepseek/deepseek-v4-flash', created: 100 }],
      });

      then('it fails loud and holds no pick', async () => {
        const error = await getError(
          setBrainTierPickQualified({ slugTest: SLUG_TEST }, { sdk: fake.sdk }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('no model on the tier line');
        expect(fake.held).toEqual([]);
      });
    });
  });

  given('[case5] a model answers, yet the tier still fails once it is held', () => {
    when('[t0] the pick is set', () => {
      const fake = genSdkFake({
        verdictBySlug: {
          [SLUG_TEST]: 'refused',
          [`openrouter/deepseek/deepseek-v4-flash/${PROMISES}`]: 'ok',
        },
        catalog: [{ id: 'deepseek/deepseek-v4-flash', created: 100 }],
        heldSlugsAnswer: 'refused',
      });

      then('it fails loud, so a held entry that the package ignores shows at once', async () => {
        const error = await getError(
          setBrainTierPickQualified({ slugTest: SLUG_TEST }, { sdk: fake.sdk }),
        );
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain('still fails after its pick was held');
      });
    });
  });
});
