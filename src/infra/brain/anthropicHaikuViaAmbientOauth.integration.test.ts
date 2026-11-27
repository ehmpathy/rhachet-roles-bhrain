import { getBrainReplsByAnthropic } from 'rhachet-brains-anthropic';
import { given, then, useThen, when } from 'test-fns';
import { z } from 'zod';

/**
 * .what = live proof: haiku 5.5 answers the instinct's structured ask on the ambient claude code oauth, and its second ask reads the briefs from cache
 * .why = the instinct must run on the logged-in subscription, never a keyrack key. the repl drives claude code itself
 *        (`@anthropic-ai/claude-agent-sdk` query), which is the client that ambient credential is for
 *
 * .note = `claude/code/haiku` resolves to `claude-haiku-5-5` via `patches/rhachet-brains-anthropic@0.4.3.patch`
 */
const BRIEFS = Array.from(
  { length: 40 },
  (_, index) =>
    `rule ${index + 1}: a claim that moves work or reaches a peer states its basis — the read that backs it, and the source it read. a claim with no basis is flagged; a claim marked guess is an honest limit, never flagged.`,
)
  .concat(
    'the form `read: <source> · <claim>` states its basis: the claim is backed, never flagged.',
  )
  .join('\n');

// the reply shape; also parses each output, since the fake-brief request erases its type
const CONCERNS = z.object({
  concerns: z.array(z.object({ claim: z.string(), concern: z.string() })),
});

describe('anthropicHaikuViaAmbientOauth', () => {
  given('[case1] the haiku repl, on the ambient claude code oauth', () => {
    const haiku = getBrainReplsByAnthropic().find(
      (repl) => repl.slug === 'claude/code/haiku',
    )!;

    when('[t0] it is asked twice with the same briefs', () => {
      const result = useThen('both asks answer', async () => {
        const ask = (prompt: string) =>
          haiku.ask(
            {
              role: { briefs: [{ get: async () => ({ content: BRIEFS }) }] },
              prompt,
              plugs: { tools: [] }, // no tools: no tool definitions ride the prompt
              schema: { output: CONCERNS },
            } as never, // .note = a fake brief artifact; only its .get() is read
          );
        const first = await ask(
          'the reply to judge: "the deploy target is unknown yet". list each claim that should have been skepticized, with its concern in under 12 words. none → an empty list.',
        );
        const second = await ask(
          'the reply to judge: "read: serverless.yml · deploys to prep". list each claim that should have been skepticized, with its concern in under 12 words. none → an empty list.',
        );
        console.log(
          JSON.stringify(
            {
              first: { output: first.output, metrics: first.metrics },
              second: { output: second.output, metrics: second.metrics },
            },
            null,
            2,
          ),
        );
        return { first, second };
      });

      then('the unbacked claim is listed', () => {
        expect(
          CONCERNS.parse(result.first.output).concerns.length,
        ).toBeGreaterThan(0);
      });

      then('the backed claim is not listed', () => {
        expect(CONCERNS.parse(result.second.output).concerns).toEqual([]);
      });

      then('the second ask reads the briefs from cache', () => {
        expect(result.second.metrics.size.tokens.cache.get).toBeGreaterThan(0);
      });
    });
  });
});
