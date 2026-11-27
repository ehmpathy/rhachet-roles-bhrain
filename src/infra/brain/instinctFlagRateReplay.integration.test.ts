import { readFileSync } from 'fs';
import { getBrainReplsByAnthropic } from 'rhachet-brains-anthropic';
import { given, then, useThen, when } from 'test-fns';
import { z } from 'zod';

import {
  INSTINCT_REPLY_LABELS,
  type LabeledClaim,
} from './.test/instinctReplyLabels.fixture';

/**
 * .what = the labeled replay that measures the instinct's flag rate and cost on real replies
 * .why = the vision holds the instinct silent below about 9 in 10 flags right; this run is the measure
 *        (research item 5 of `1.vision`)
 *
 * .note = the instinct is haiku 5.5 on the ambient claude code oauth, never a keyrack key.
 *         it sees only the reply text and the booted skeptic briefs, as the vision's instinct does.
 *         no brief and no prompt is tuned to the numbers
 */
const BRIEF_DIR = 'src/domain.roles/skeptic/briefs';
const BRIEF_SLUGS = [
  // at say, from boot.yml
  'im_a.skeptic',
  'rule.always.trust-no-one-especially-not-yourself',
  'rule.always.trust-but-verify',
  'rule.always.predict-before-you-look',
  'rule.always.send-no-claim-before-its-read',
  'rule.always.weigh-a-read-by-what-it-rules-out',
  'rule.always.reach-less-wrong-via-questions',
  'rule.always.skeptic-questions-all-questions',
  'rule.always.question-the-need-behind-an-ask',
  'rule.always.test-a-claim-against-the-whole-it-speaks-for',
  'rule.always.ask-why-then-ask-can-we-delete',
  'rule.always.pushback-what-you-refute',
  // at ref, asked for by the route
  'rule.forbid.i-dont-know-answers',
];

/**
 * .what = the two prompts of the replay
 * .note = v1 is the first draft, run before any number was seen; its figures are the honest first ones.
 *         v2 is the one revision, made after v1's figures showed a flag on nearly every claim,
 *         and on claims whose basis the reply itself states
 */
const PROMPTS = {
  v1: (reply: string) =>
    [
      'the reply to judge sits between the markers. it was the final reply of an ai agent to its human.',
      '<<<REPLY',
      reply,
      'REPLY>>>',
      'list each claim in it that should have been skepticized, with its concern in under 12 words.',
      'for each, put a short verbatim quote of the claim in `claim`. none → an empty list.',
    ].join('\n'),
  v2: (reply: string) =>
    [
      'the reply to judge sits between the markers. it was the final reply of an ai agent to its human.',
      'you cannot see the agent turn that made it; you see only its words. a claim that names its own basis',
      '(a `read: <source>` line, a command and what it showed, a `guess:` or `unverified:` mark, a quote of a file and line) is backed: never list it.',
      'list only a claim that moves work or reaches the human AND states no basis, or states a basis that cannot show it',
      '(a forecast, a figure from memory, a peer or agent report relayed as fact, "never" from one run).',
      'list at most 4, the weakest first, each with its concern in under 12 words. a short verbatim quote of the claim goes in `claim`.',
      'none → an empty list.',
      '<<<REPLY',
      reply,
      'REPLY>>>',
    ].join('\n'),
};

interface ReplyFixture {
  id: string;
  reply: string;
  turnReads: string[];
  turnToolCount: number;
}

/**
 * .what = a price of the brain metrics, as a number of dollars
 * .note = iso-price is a union; the raw value is logged too, so a misread shows
 */
const asDollars = (price: unknown): number => {
  if (typeof price === 'number') return price;
  if (typeof price === 'string') {
    const n = Number(price.replace(/[^0-9.\-eE]/g, ''));
    return Number.isFinite(n) ? n : NaN;
  }
  if (price && typeof price === 'object') {
    const p = price as Record<string, unknown>;
    if (typeof p.amount === 'number') return p.amount;
    if (typeof p.amount === 'string') return Number(p.amount);
  }
  return NaN;
};

const mean = (xs: number[]): number =>
  xs.reduce((a, c) => a + c, 0) / (xs.length || 1);

// the reply shape; also parses each output, since the fake-brief request erases its type
const CONCERNS = z.object({
  concerns: z.array(z.object({ claim: z.string(), concern: z.string() })),
});

describe('instinctFlagRateReplay', () => {
  given('[case1] real final replies from this route, hand labeled', () => {
    const haiku = getBrainReplsByAnthropic().find(
      (repl) => repl.slug === 'claude/code/haiku',
    )!;
    const replies: ReplyFixture[] = JSON.parse(
      readFileSync('src/infra/brain/.test/instinctReplies.fixture.json', 'utf8'),
    );
    const briefs = BRIEF_SLUGS.map((slug) => ({
      get: async () => ({
        content: readFileSync(`${BRIEF_DIR}/${slug}.md.min`, 'utf8'),
      }),
    }));

    const ask = (variant: keyof typeof PROMPTS, reply: string) =>
      haiku.ask(
        {
          role: { briefs },
          prompt: PROMPTS[variant](reply),
          plugs: { tools: [] }, // no tools: no tool definitions ride the prompt
          schema: { output: CONCERNS },
        } as never, // .note = fake brief artifacts; only .get() is read
      );

    when('[t0] the instinct runs over each reply', () => {
      const runVariant = async (variant: keyof typeof PROMPTS) => {
        // the first ask is cold: it writes the briefs to cache. the rest run at once, warm
        const [first, ...rest] = replies;
        const cold = await Promise.allSettled([ask(variant, first!.reply)]);
        const warm = await Promise.allSettled(
          rest.map((r) => ask(variant, r.reply)),
        );
        const settled = [...cold, ...warm];

        const rows = replies.map((r, i) => {
          const s = settled[i]!;
          const flags =
            s.status === 'fulfilled'
              ? CONCERNS.parse(s.value.output).concerns
              : null;
          const metrics = s.status === 'fulfilled' ? s.value.metrics : null;
          const labels = INSTINCT_REPLY_LABELS[r.id] ?? [];
          const landed = (flagClaim: string): LabeledClaim | null =>
            labels.find((l) =>
              l.match.some((m) => flagClaim.toLowerCase().includes(m)),
            ) ?? null;
          const scored = (flags ?? []).map((f) => {
            const hit = landed(f.claim);
            return {
              ...f,
              verdict: hit
                ? hit.label === 'backed'
                  ? ('wrong' as const)
                  : ('right' as const)
                : ('unjudged' as const),
              labeled: hit?.label ?? null,
            };
          });
          const missed = labels.filter(
            (l) =>
              l.label !== 'backed' &&
              !(flags ?? []).some((f) =>
                l.match.some((m) => f.claim.toLowerCase().includes(m)),
              ),
          );
          return {
            id: r.id,
            error: s.status === 'rejected' ? String(s.reason) : null,
            scored,
            missed: missed.map((m) => m.claim),
            metrics,
          };
        });

        const all = rows.flatMap((r) => r.scored);
        const right = all.filter((f) => f.verdict === 'right').length;
        const wrong = all.filter((f) => f.verdict === 'wrong').length;
        const unjudged = all.filter((f) => f.verdict === 'unjudged').length;
        const claimsAll = Object.values(INSTINCT_REPLY_LABELS).flat();
        const unbackedTotal = claimsAll.filter(
          (c) => c.label !== 'backed',
        ).length;
        const missedTotal = rows.reduce((n, r) => n + r.missed.length, 0);

        const warmRows = rows.slice(1);
        const summary = {
          replies: replies.length,
          failed: rows.filter((r) => r.error).length,
          claims: {
            backed: claimsAll.filter((c) => c.label === 'backed').length,
            unbacked: claimsAll.filter((c) => c.label === 'unbacked').length,
            wrongBasis: claimsAll.filter((c) => c.label === 'wrong-basis')
              .length,
          },
          flags: { total: all.length, right, wrong, unjudged },
          precisionStrict: right / (all.length || 1),
          precisionJudged: right / (right + wrong || 1),
          misses: `${missedTotal} of ${unbackedTotal} unbacked or wrong-basis claims`,
          cost: {
            coldRaw: rows[0]!.metrics?.cost.cash.total ?? null,
            coldDollars: rows[0]!.metrics
              ? asDollars(rows[0]!.metrics.cost.cash.total)
              : NaN,
            warmMeanDollars: mean(
              warmRows.map((r) =>
                r.metrics ? asDollars(r.metrics.cost.cash.total) : NaN,
              ),
            ),
            coldTokens: rows[0]!.metrics?.size.tokens ?? null,
            warmMeanTokens: {
              input: mean(
                warmRows.map((r) => r.metrics?.size.tokens.input ?? 0),
              ),
              output: mean(
                warmRows.map((r) => r.metrics?.size.tokens.output ?? 0),
              ),
              cacheGet: mean(
                warmRows.map((r) => r.metrics?.size.tokens.cache.get ?? 0),
              ),
              cacheSet: mean(
                warmRows.map((r) => r.metrics?.size.tokens.cache.set ?? 0),
              ),
            },
            timePerReply: rows.map((r) => r.metrics?.cost.time ?? null),
          },
        };
        console.log(JSON.stringify({ variant, summary, rows }, null, 2));
        return { summary, rows };
      };
      const result = useThen('every ask settles', async () => ({
        v1: await runVariant('v1'),
        v2: await runVariant('v2'),
      }));

      then('the replay settles every reply', () => {
        expect(result.v1.summary.failed).toEqual(0);
        expect(result.v2.summary.failed).toEqual(0);
      });

      then('the warm asks read the briefs from cache', () => {
        expect(result.v1.summary.cost.warmMeanTokens.cacheGet).toBeGreaterThan(
          0,
        );
      });

      // .note = the figures are logged for the vision; the replay asserts no pass bar, so the honest first numbers land
    });
  });
});
