import { getOneAdmittedSetCompletion } from 'rhachet-brains-openrouter/dist/domain.operations/supply/getOneAdmittedSetCompletion';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = clamps the local patch of rhachet-brains-openrouter's admitted-set path
 * .why = a no-floor ask must stay sticky, so a repeated prefix reads its warm host's cache;
 *        yet with fallbacks off, a 429 from that one host failed every attempt of a publish
 *        run while every peer in `only` sat idle. the patch keeps the first send sticky and
 *        hops once WITHIN `only` on a 429 or a 404. this goes red the moment a version bump
 *        or a dropped patch reverts it (ehmpathy/rhachet-brains-openrouter#21)
 * .note = fallbacks on EVERY send were measured to void the cache (2026-10-17), so the
 *         sticky first send is clamped as hard as the hop
 */
type AdmittedSetInput = Parameters<typeof getOneAdmittedSetCompletion>[0];
type AdmittedSetContext = Parameters<typeof getOneAdmittedSetCompletion>[1];

/**
 * .what = runs the admitted-set path against a fake client that answers each send in turn
 * .why = records every request it saw, so a test reads what was sent, never a network call
 */
const runAdmittedSet = async (input: {
  replies: Array<{ fault: { status: number } } | { ok: true }>;
}): Promise<{
  requests: Array<Record<string, unknown>>;
  error: Error | null;
}> => {
  const requests: Array<Record<string, unknown>> = [];
  const openai = {
    chat: {
      completions: {
        create: async (request: Record<string, unknown>) => {
          const reply = input.replies[requests.length];
          requests.push(request);
          if (reply && 'fault' in reply)
            throw Object.assign(new Error('provider fault'), reply.fault);
          return { id: 'gen-stub' };
        },
      },
    },
  };
  // capture the fault, if any; a served ask yields null
  const error = await getOneAdmittedSetCompletion(
      {
        request: { model: 'deepseek/deepseek-v4-flash', messages: [] },
        filters: {
          floor: false,
          speedMinTps: 100,
          region: null,
          precision: null,
          privacy: 'full',
          priceMaxUsdPerMillion: null,
        },
        qualified: [{ tag: 'host-a' }, { tag: 'host-b' }],
      } as unknown as AdmittedSetInput, // .note = a stub of the third-party contract; only the fields the path reads
    { openai } as unknown as AdmittedSetContext, // .note = a fake client, never a network call
  ).then(
    () => null,
    (fault: Error) => fault,
  );
  return { requests, error };
};

describe('openrouterAdmittedSetFallback', () => {
  given('[case1] the sticky host serves the ask', () => {
    when('[t0] the admitted-set path sends', () => {
      const result = useThen('it sends once', async () =>
        runAdmittedSet({ replies: [{ ok: true }] }),
      );

      then('exactly one request is sent', () => {
        expect(result.requests).toHaveLength(1);
      });

      then('fallbacks are off, so the ask stays on its warm host', () => {
        expect(result.requests[0]!.provider).toMatchObject({
          allow_fallbacks: false,
          only: ['host-a', 'host-b'],
        });
      });

      then('the privacy promise rides the request', () => {
        expect(result.requests[0]!.provider).toMatchObject({
          zdr: true,
          data_collection: 'deny',
        });
      });
    });
  });

  given('[case2] the sticky host is throttled', () => {
    when('[t0] the first send returns a 429', () => {
      const result = useThen('it hops once', async () =>
        runAdmittedSet({ replies: [{ fault: { status: 429 } }, { ok: true }] }),
      );

      then('a second request is sent, and the ask is served', () => {
        expect(result.requests).toHaveLength(2);
        expect(result.error).toBeNull();
      });

      then('the hop enables fallbacks, bounded to the qualified set', () => {
        expect(result.requests[1]!.provider).toMatchObject({
          allow_fallbacks: true,
          only: ['host-a', 'host-b'],
        });
      });
    });
  });

  given('[case3] the first send fails for a reason a hop cannot cure', () => {
    when('[t0] the first send returns a 400', () => {
      const result = useThen('it rethrows', async () =>
        runAdmittedSet({ replies: [{ fault: { status: 400 } }, { ok: true }] }),
      );

      then('no second request is sent, and the fault surfaces', () => {
        expect(result.requests).toHaveLength(1);
        expect(result.error).toMatchObject({ status: 400 });
      });
    });
  });
});
