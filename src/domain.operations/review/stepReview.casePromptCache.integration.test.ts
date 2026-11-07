import { execSync } from 'child_process';
import * as fs from 'fs';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';
import { getUuid } from 'uuid-fns';

import {
  DEFAULT_TEST_BRAIN_OF_LIVE_CACHE,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { REPEATABLY_CONFIG } from '@src/.test/infra/repeatably';

import { stepReview } from './stepReview';

/**
 * .what = this suite's repeat config: three attempts, graded SOME everywhere (CI and local)
 * .why = the one quantity that varies between attempts is the host's replica choice; our
 *        prompt bytes are clamped at EVERY by the byte suites (`reviewPromptCacheAnatomy`).
 *        a warm round 2 is best-effort at the host (8 of 9 warm, 2026-10-05), so EVERY fails
 *        correct runs, while a broken layout still reads 0 of 3 under SOME and goes red
 * .note = every attempt logs its billed tokens and served provider, so a miss stays visible
 * .note = SOME cannot rescue a host that never caches on every attempt; the brain choice
 *         does (DEFAULT_TEST_BRAIN_OF_LIVE_CACHE)
 */
const REPEATABLY_CONFIG_OF_LIVE_CACHE = {
  ...REPEATABLY_CONFIG,
  criteria: 'SOME',
} as const;

/**
 * .what = the LIVE proof that the cache lever moved a measured figure — two real
 *         review rounds against a real brain with real credentials, plus a cold
 *         control, graded on the tokens the provider billed
 *
 * .why = 🔴 every other clamp on this branch measures BYTES.
 *        `reviewPromptCacheAnatomy` proves two compiled prompts share a long byte
 *        prefix; `getAllTargetsByCacheStability` proves a repaired file sorts last;
 *        `isTargetDiffSent` proves a new file's body rides once. all three are true
 *        of a prompt nobody sent.
 *
 *        wish bar 5 asks for more than a layout: *the shared prefix leads the prompt
 *        and reaches the system prompt*. the byte half is clamped. the half that was
 *        NOT clamped is the one the branch's own measured defect lived in — a
 *        **flawless layout that cached 0.0%**, because `briefs: []` rendered an empty
 *        system prompt, which is falsy, so no affinity key was derived and each round
 *        met an arbitrary replica (`research.review-cost-and-cache`, cause 1).
 *
 *        ⇒ no byte count can see that defect. only a billed token can.
 *
 * 🔴 .mock = NONE. this suite calls the REAL default-test-brain provider with REAL credentials
 *            and spends real money — ~$0.04 per attempt, ~$0.11 for the default three.
 *            a mock here would measure our own imagination of a cache, which is
 *            precisely the instrument the defect above slipped past.
 *
 * .how = three real reviews per attempt, over two temp trees. the corpus leads the
 *        prompt and rides the system slot (`asPromptHead`); each lane's rubric trails it.
 *        so the reuse this proves is the one the layout was built for — two LANES over
 *        one corpus:
 *
 *          round 1  tree A, rubric a  ⇒ COLD    — its corpus was minted seconds ago
 *          round 2  tree A, rubric b  ⇒ WARM    — a peer lane: other rubric, same corpus
 *          control  tree B, rubric a  ⇒ COLD    — a DIFFERENT corpus, run last
 *
 *        🔴 the control is what makes this an experiment rather than an anecdote. a
 *        warm round 2 alone could mean the provider serves any large prompt from some
 *        shared pool. only `round 2 WARM beside control COLD` isolates the shared
 *        prefix as the cause — and the control shares round 1's RUBRIC, so a warm
 *        control would mean the rubric, not the corpus, bought the read.
 *
 * .note = the corpus carries a per-ATTEMPT marker at byte 0, so every attempt of
 *         `when.repeatably` mints a prefix the provider has never seen. a marker minted
 *         once at suite scope would leave attempt 2's "cold" round served from attempt
 *         1's cache, and the cold assertion would fail for a reason that is no defect.
 *
 * 🟡 .note = rewritten for the corpus-first layout (fulcrum F1). the prior form proved the
 *         rubric-first reuse — same rubric, new target — which the cure gives up by design,
 *         so it would read red against a correct prompt.
 *
 * 🔴 .note = UNPROVEN AS WRITTEN. these assertions have never executed against a live brain:
 *         the gate below is set by no ci job, and the route that rewrote them forbids a live
 *         call. until one run under `BHRAIN_TEST_LIVE_BRAIN_CACHE=1` lands a green, the claim
 *         rests ONLY on the meter's reads of real guard rounds (`appendix/measurement.after.md`
 *         of `v2026_11_01.fix-review-input-cacheability`), never on this suite
 */

/**
 * .what = how large the shared corpus is, in chars
 * .why = the minimum cacheable prefix is unpublished, and it is NOT small: a live
 *        probe measured a ~5.8k-token prefix serve `cache.get 0`, while 58k served at
 *        99.998%. so this suite sends 240k chars (~60k tokens), a size KNOWN to hit,
 *        rather than a guess near the unpublished floor.
 *
 * .note = it stays well under the brain's context window (200k tokens), so the
 *         `compileReviewPrompt` failfast at 75% is nowhere near.
 */
const CHARS_OF_CORPUS = 240_000;

/**
 * .what = the share of a round's prompt above which it counts as WARM
 * .why = a partial serve is real — the prefix census measured reaches of 27.8% — so
 *        the grade needs a declared line rather than a bare `> 0`. half the prompt is
 *        unambiguous.
 */
const SHARE_OF_WARM = 0.5;

/**
 * .what = the most a COLD round may be served, in tokens
 * .why = 🔴 "cold" means the CORPUS was not served, never that zero tokens were. the
 *        prompt leads with the review's static instructions, ahead of the corpus and
 *        its marker, and every review shares them — so a cold round may be served that
 *        static span, one cache block of ~1k tokens. measured 2026-09-26: 1,024 on a
 *        round 1 and 1,050 on a control, intermittent. that serve is the shared-prefix
 *        layout at work (`rule.require.name-the-shared-prefix-as-the-cache-anchor`).
 *
 * .note = two blocks is the max: a corpus serve is ~60k tokens, so a static-span serve
 *         and a corpus serve sit an order of magnitude apart, and the grade cannot
 *         confuse them
 */
const TOKENS_OF_COLD_MAX = 2_048;

/**
 * .what = mints a large chapter whose first bytes are unique to this attempt
 * .why = the marker sits at byte 0 of the corpus, so two corpora diverge right after
 *        the static instructions they share, and therefore occupy separate cache entries
 *        under separate affinity keys. that is what lets the control be genuinely cold
 *        while it runs seconds after a warm one.
 *
 * .note = real english prose, varied per block, rather than one byte repeated. a cache
 *         operates on TOKENS, and a run of identical bytes tokenizes unlike prose — so
 *         filler would measure a regime no review ever sends.
 */
const genOneLargeChapter = (input: { marker: string }): string => {
  const head = `# chapter 1 · the harbor · ${input.marker}\n\n`;
  const blocks: string[] = [head];
  let chars = head.length;
  let index = 0;
  while (chars < CHARS_OF_CORPUS) {
    index += 1;
    const block = [
      `## passage ${index}`,
      '',
      `the tide turned at dawn, and a gull settled on the mast to watch the crew`,
      `haul crate ${index} aboard. the mate counted aloud; the cook said naught.`,
      `a decision was reached by the crew, and the course was altered before noon,`,
      `while the swell was handled badly and the deck was soaked twice over.`,
      '',
    ].join('\n');
    blocks.push(block);
    chars += block.length;
  }
  return blocks.join('');
};

/**
 * .what = a small rubric, one per lane
 * .why = the lanes of a level part at their rubric, which trails the corpus; it need not
 *        be large, since the reuse under test is the corpus ahead of it
 */
const genOneRubric = (input: { lane: 'a' | 'b' }): string =>
  input.lane === 'a'
    ? '# rule.name-the-actor\n\na sentence names its actor, then the act. a hidden actor is a nitpick.\n'
    : '# rule.forbid-passive\n\nforbid the passive voice where an active one would serve. a nitpick.\n';

/**
 * .what = seeds one temp tree that `stepReview` can review end to end
 * .why = the tracked fixture under `.test/assets/` must not be written to — an
 *        integration suite that writes review logs into a tracked dir grows it without
 *        bound (`.dream/v2026_09_22.fix.integration-suites-write-unbounded-artifacts-…`).
 *        a temp tree also gives each attempt its own `.log/bhrain/review/`.
 *
 * .note = 🔴 the tree is `git init`-ed, because `enumFilesFromGlob` resolves every
 *         glob through `git ls-files --cached --others --exclude-standard` — so a
 *         plain directory refuses with `not a git repository` before any brain is
 *         reached. no commit is owed: `--others` already yields untracked files.
 */
const setOneReviewTree = (input: { at: string; marker: string }): void => {
  execSync('git init --quiet', { cwd: input.at });

  // one rubric dir per lane, so a round names its lane by its rules glob
  (['a', 'b'] as const).forEach((lane) => {
    const rules = path.join(
      input.at,
      `.agent/repo=.this/role=any/briefs/rules.${lane}`,
    );
    fs.mkdirSync(rules, { recursive: true });
    fs.writeFileSync(
      path.join(rules, `rule.lane-${lane}.md`),
      genOneRubric({ lane }),
    );
  });

  // the corpus every lane of the level reviews, unique to this attempt and tree
  const chapters = path.join(input.at, 'chapters');
  fs.mkdirSync(chapters, { recursive: true });
  fs.writeFileSync(
    path.join(chapters, 'chapter1.md'),
    genOneLargeChapter({ marker: input.marker }),
  );
};

/**
 * .what = the four token counts the provider billed for one review
 * .note = fails loud where the run's spend is unmeasured — a round with no token count
 *         measures no cache share, so the suite must not read one as 0%
 */
const asBilledTokens = (input: {
  realized: {
    /** null where the run's spend is unmeasured */
    tokens: {
      input: number;
      inputCacheCreation: number;
      inputCacheRead: number;
      output: number;
    } | null;
  };
}) => {
  const { tokens } = input.realized;
  if (tokens === null)
    throw new MalfunctionError(
      'a review round returned no token count — its spend is unmeasured',
      {
        hint: 'read its stderr: a runaway with no output count, or a fault a retry swallowed',
      },
    );
  const prompt =
    tokens.input + tokens.inputCacheCreation + tokens.inputCacheRead;
  return {
    ...tokens,
    prompt,
    share: prompt ? tokens.inputCacheRead / prompt : 0,
  };
};

/**
 * .what = the suite runs only where BHRAIN_TEST_LIVE_BRAIN_CACHE=1 targets it
 * .why = it makes live brain calls and grades the provider's cache, so the default run makes
 *        no live call from it; to run it:
 *        BHRAIN_TEST_LIVE_BRAIN_CACHE=1 rhx git.repo.test --what integration --scope 'path://stepReview.casePromptCache' --mode apply
 */
const isLiveBrainCacheTargeted =
  process.env.BHRAIN_TEST_LIVE_BRAIN_CACHE === '1';
const describeIfLiveBrainCacheTargeted = isLiveBrainCacheTargeted
  ? describe
  : describe.skip;

describeIfLiveBrainCacheTargeted('stepReview.casePromptCache', () => {
  // three real brain calls over a ~60k-token prompt, per attempt
  jest.setTimeout(600000);

  const scene = useBeforeAll(async () => ({
    brain: await genTestBrainContext({
      brain: DEFAULT_TEST_BRAIN_OF_LIVE_CACHE,
    }),
  }));

  given(
    '[case1] two lanes that share one corpus, beside a control that does not',
    () => {
      when.repeatably(REPEATABLY_CONFIG_OF_LIVE_CACHE)(
        '[t0] all three reviews run in sequence against the live brain',
        () => {
          const measured = useThen(
            'every round completes and reports billed tokens',
            async () => {
              // 🔴 the markers are minted HERE, inside the repeated block, so each
              // attempt sends a prefix the provider has never seen
              const markerShared = getUuid();
              const markerControl = getUuid();

              const treeShared = genTempDir({ slug: 'review-cache-shared' });
              const treeControl = genTempDir({ slug: 'review-cache-control' });
              setOneReviewTree({ at: treeShared, marker: markerShared });
              setOneReviewTree({ at: treeControl, marker: markerControl });

              const runOneRound = async (input: {
                tree: string;
                lane: 'a' | 'b';
                slug: string;
              }) =>
                await stepReview(
                  {
                    rules: `.agent/**/briefs/rules.${input.lane}/*.md`,
                    paths: 'chapters/chapter1.md',
                    output: path.join(input.tree, `review.${input.slug}.md`),
                    focus: 'push',
                    goal: 'representative',
                    cwd: input.tree,
                  },
                  { brain: scene.brain },
                );

              // spy, never mock: the real ask runs; the spy only keeps each reply, so
              // the served provider of every round can be read beside its billed tokens
              const askSpy = jest.spyOn(scene.brain.brain.choice, 'ask');

              const roundOne = await runOneRound({
                tree: treeShared,
                lane: 'a',
                slug: 'r1',
              });
              // a peer lane: another rubric over the same corpus
              const roundTwo = await runOneRound({
                tree: treeShared,
                lane: 'b',
                slug: 'r2',
              });
              // last, so a cold figure here cannot be an artifact of order. it shares
              // round 1's rubric, so only the corpus can part it from round 2
              const control = await runOneRound({
                tree: treeControl,
                lane: 'a',
                slug: 'control',
              });

              // the provider that served each round, in call order
              const replies = await Promise.all(
                askSpy.mock.results.map((result) => result.value),
              );
              askSpy.mockRestore();
              const [providerOne, providerTwo, providerControl] = replies.map(
                (reply: { supply?: { provider?: string | null } }) =>
                  reply.supply?.provider ?? null,
              );

              const billed = {
                roundOne: {
                  ...asBilledTokens(roundOne.metrics),
                  provider: providerOne ?? null,
                },
                roundTwo: {
                  ...asBilledTokens(roundTwo.metrics),
                  provider: providerTwo ?? null,
                },
                control: {
                  ...asBilledTokens(control.metrics),
                  provider: providerControl ?? null,
                },
              };
              console.log(
                '🔭 live prompt cache',
                JSON.stringify(billed, null, 2),
              );
              return billed;
            },
          );

          then('🔴 round 1 is COLD — its corpus was minted seconds ago', () => {
            // at most the shared static span — never the corpus (TOKENS_OF_COLD_MAX)
            expect(measured.roundOne.inputCacheRead).toBeLessThanOrEqual(
              TOKENS_OF_COLD_MAX,
            );
          });

          then('and round 1 really did send the large prefix', () => {
            // without this, a cold figure could mean the corpus never reached the
            // prompt at all, and the assertion above would pass for that reason
            expect(measured.roundOne.prompt).toBeGreaterThan(40_000);
          });

          then('round 2 reached the same provider as round 1', () => {
            // the premise of a warm round 2: a cache lives at the host that filled it.
            // a hop here names itself, so it is never read as a layout defect
            expect(measured.roundOne.provider).not.toBeNull();
            expect(measured.roundTwo.provider).toEqual(
              measured.roundOne.provider,
            );
          });

          then('🔴 round 2 READS the cache its predecessor filled', () => {
            expect(measured.roundTwo.inputCacheRead).toBeGreaterThan(0);
          });

          then('and the serve covers most of round 2’s prompt', () => {
            expect(measured.roundTwo.share).toBeGreaterThan(SHARE_OF_WARM);
          });

          then('so round 2 pays for far less uncached input', () => {
            expect(measured.roundTwo.input).toBeLessThan(
              measured.roundOne.input,
            );
          });

          then(
            '🔴 the control stays COLD — a different corpus shares no prefix',
            () => {
              // the counterfactual. a warm round 2 beside a warm control would mean
              // the provider serves any large prompt from a shared pool, and the
              // shared prefix would be proven of naught. the static span both corpora
              // follow may be served; the corpus may not (TOKENS_OF_COLD_MAX)
              expect(measured.control.inputCacheRead).toBeLessThanOrEqual(
                TOKENS_OF_COLD_MAX,
              );
            },
          );

          then('and the control sent a prefix of comparable size', () => {
            expect(measured.control.prompt).toBeGreaterThan(40_000);
          });

          then('🟡 and every round bills a cache WRITE of exactly zero', () => {
            // ⚠️ RED-WHEN-THE-PROVIDER-CHANGES, deliberately. the deepseek line, via
            // openrouter, fills its cache as a side effect of the read path and bills no write (measured 2026-10-03), so
            // `cache.set: 0` is a MEASURED zero rather than an absent field — which
            // is the claim `review._.cost --of run` states inline. the day a provider
            // bills a write, this goes red and that claim needs a re-read
            expect(measured.roundOne.inputCacheCreation).toEqual(0);
            expect(measured.roundTwo.inputCacheCreation).toEqual(0);
            expect(measured.control.inputCacheCreation).toEqual(0);
          });
        },
      );
    },
  );
});
