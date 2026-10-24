import OpenAI from 'openai';
import { getOneAdmittedSetCompletion } from 'rhachet-brains-openrouter/dist/domain.operations/supply/getOneAdmittedSetCompletion';
import { given, then, useThen, when } from 'test-fns';

/**
 * .what = clamps rhachet-brains-openrouter's admitted-set path: sticky first, hop on a host fault
 * .why = a no-floor ask must stay sticky, so a repeated prefix reads its warm host's cache;
 *        yet with fallbacks off, a 429 from that one host once failed every attempt of a
 *        publish run while every peer in `only` sat idle. the package now drops the host a
 *        fault names and re-sends to the rest of `only` (ehmpathy/rhachet-brains-openrouter#21,
 *        native since 0.1.4). this goes red the moment a version bump reverts it
 * .note = fallbacks on EVERY send were measured to void the cache (2026-10-17), so the
 *         sticky first send is clamped as hard as the hop
 * .note = an unmarked 429 is openrouter's own account limit; no other host can cure it, so it
 *         surfaces in one send
 */
type AdmittedSetInput = Parameters<typeof getOneAdmittedSetCompletion>[0];
type AdmittedSetContext = Parameters<typeof getOneAdmittedSetCompletion>[1];

/**
 * .what = an openai sdk APIError, shaped as openrouter returns it
 * .why = the admitted-set path classifies a fault by `instanceof APIError` plus the body's
 *        `metadata.provider_name`; a named host is the one proof of which host to drop
 */
const asOpenRouterFault = (input: {
  status: number;
  providerName: string | null;
}): Error =>
  new OpenAI.APIError(
    input.status,
    input.providerName
      ? { message: 'rate limited', metadata: { provider_name: input.providerName } }
      : { message: 'Rate limit exceeded' },
    'provider fault',
    new Headers(),
  );

/**
 * .what = runs the admitted-set path against a fake client that answers each send in turn
 * .why = records every request it saw, so a test reads what was sent, never a network call
 */
const runAdmittedSet = async (input: {
  replies: Array<
    | { fault: { status: number; providerName?: string | null } }
    | { ok: true }
  >;
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
            throw asOpenRouterFault({
              status: reply.fault.status,
              providerName: reply.fault.providerName ?? null,
            });
          return { id: 'gen-stub' };
        },
      },
    },
  };
  // the endpoint cache a 404 drops; a 429 never reaches it
  const sdkOpenRouterEndpoints = { delForModel: async () => undefined };
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
        qualified: [
          { tag: 'host-a', providerName: 'HostA' },
          { tag: 'host-b', providerName: 'HostB' },
        ],
        attempts: [],
        retryAfter: null,
        faultLast: null,
      } as unknown as AdmittedSetInput, // .note = a stub of the third-party contract; only the fields the path reads. the package exports no input factory; drop the cast once it does
    {
      openai,
      sdkOpenRouterEndpoints,
    } as unknown as AdmittedSetContext, // .note = a fake client, never a network call. the context type names the full openai client; drop the cast once the package narrows it to the method it calls
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

  given('[case2] the sticky host is throttled, and openrouter names it', () => {
    when('[t0] the first send returns a 429 that names host-a', () => {
      const result = useThen('it hops once', async () =>
        runAdmittedSet({
          replies: [
            { fault: { status: 429, providerName: 'HostA' } },
            { ok: true },
          ],
        }),
      );

      then('a second request is sent, and the ask is served', () => {
        expect(result.requests).toHaveLength(2);
        expect(result.error).toBeNull();
      });

      then('the hop drops the throttled host, bounded to the qualified set', () => {
        expect(result.requests[1]!.provider).toMatchObject({
          allow_fallbacks: false,
          only: ['host-b'],
        });
      });
    });
  });

  given('[case4] openrouter throttles the account itself (no host named)', () => {
    when('[t0] the first send returns an unmarked 429', () => {
      const result = useThen('it rethrows', async () =>
        runAdmittedSet({
          replies: [{ fault: { status: 429, providerName: null } }, { ok: true }],
        }),
      );

      then('no second request is sent, and the limit surfaces', () => {
        expect(result.requests).toHaveLength(1);
        expect(result.error).toMatchObject({ status: 429 });
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
