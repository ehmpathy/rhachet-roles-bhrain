import { getBrainAtomsByAnthropic } from 'rhachet-brains-anthropic';
import { given, then, useThen, when } from 'test-fns';
import { z } from 'zod';

/**
 * .what = clamp: the anthropic haiku tier is haiku 5.5, and it marks its system prompt as the cache prefix
 * .why = the subconscious instinct runs on the haiku tier every turn. two defects, one per half:
 *        - a tier still bound to haiku 4.5 bills 10x the input rate and caches no prefix under 4096 tokens
 *        - a system prompt sent as a bare string carries no cache marker, so every turn pays its briefs in full
 *
 * .note = the patch is `patches/rhachet-brains-anthropic@0.4.3.patch`. an injected client stands in for
 *         the api (dependency injection, no network): the clamp reads the request the atom builds
 */
describe('anthropicHaikuIsTheCachedInstinctBrain', () => {
  given('[case1] the haiku tier the anthropic sdk registers', () => {
    const haiku = getBrainAtomsByAnthropic().find(
      (atom) => atom.slug === 'claude/haiku',
    );

    when('[t0] its spec is read', () => {
      then('the tier is registered, versionless', () => {
        expect(haiku).toBeDefined();
      });

      then('it holds the 1M context haiku 5.5 brings', () => {
        expect(haiku!.spec.gain.size.context.tokens).toEqual(1000000);
      });
    });

    when('[t1] it is asked with briefs, through an injected client', () => {
      const result = useThen('the request is captured', async () => {
        const requests: Array<Record<string, unknown>> = [];
        const anthropic = {
          beta: {
            messages: {
              create: async (request: Record<string, unknown>) => {
                requests.push(request);
                return {
                  id: 'msg_fake',
                  content: [{ type: 'text', text: '{"flag":false}' }],
                  usage: {
                    input_tokens: 10,
                    output_tokens: 5,
                    cache_read_input_tokens: 0,
                    cache_creation_input_tokens: 0,
                  },
                };
              },
            },
          },
        };
        await haiku!.ask(
          {
            role: {
              briefs: [
                { get: async () => ({ content: 'the briefs of the role' }) },
              ],
            },
            prompt: 'what here should have been skepticized?',
            schema: { output: z.object({ flag: z.boolean() }) },
          } as never, // .note = a fake brief artifact; only its .get() is read
          { anthropic } as never, // .note = an injected client in place of the sdk
        );
        return { request: requests[0]! };
      });

      then('it names the haiku 5.5 model', () => {
        expect(result.request.model).toEqual('claude-haiku-5-5');
      });

      then('the system prompt carries the cache marker', () => {
        expect(result.request.system).toEqual([
          {
            type: 'text',
            text: 'the briefs of the role',
            cache_control: { type: 'ephemeral' },
          },
        ]);
      });

      then('it sends no field haiku 5.5 rejects', () => {
        expect(result.request).not.toHaveProperty('temperature');
        expect(result.request).not.toHaveProperty('top_p');
        expect(result.request).not.toHaveProperty('top_k');
        expect(result.request).not.toHaveProperty('thinking');
      });
    });
  });
});
