import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { given, then, when } from 'test-fns';

import { asTargetSection } from '@src/domain.operations/review/asTargetSection';
import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { getOneSharedPrefixByteCount } from '@src/domain.operations/review/meter/getOneSharedPrefixByteCount';
import { getOneSharedPrefixOverlap } from '@src/domain.operations/review/meter/getOneSharedPrefixOverlap';

/**
 * .what = a cost spec fixture; the anatomy claims are about BYTES, never price
 * .why = compileReviewPrompt demands one, and no assertion here reads it
 */
const costSpecFixture: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('$0.0000001'),
  output: asIsoPrice('$0.0000003'),
  cache: {
    set: asIsoPrice('$0.00000025'),
    get: asIsoPrice('$0.000000025'),
  },
};

/** a rubric large enough to be worth a cache — the static head of every round */
const rulesFixture = [
  {
    path: '.agent/rule.forbid.failhide.md',
    content: `# rule.forbid.failhide\n${'a try/catch that swallows an error hides a defect. '.repeat(80)}`,
  },
  {
    path: '.agent/rule.require.failfast.md',
    content: `# rule.require.failfast\n${'guard clauses exit early and name the fix. '.repeat(80)}`,
  },
];

/** the target corpus — the variable tail, which changes as the driver repairs */
const targetsAtRound = (input: { revision: string }) => [
  {
    path: 'src/domain.operations/setRecord.ts',
    content: `export const setRecord = () => { /* ${input.revision} */ };\n${'// context line\n'.repeat(60)}`,
    diff: `@@ -1 +1 @@\n+export const setRecord = () => { /* ${input.revision} */ };`,
    changeKind: 'edited' as const,
  },
];

/**
 * .what = the prior peer-review dialogue, as it stands at the head of round N
 * .why = the conversation grows by one exchange per round, and must be
 *        modelled that way — a fixture that held it constant would let the
 *        prefix run on into the target and report a share no real round can
 *        reach. it grows by append, oldest-first: `enumFilesForReviewSupplies`
 *        sorts lexicographically, the iteration index is zero-padded
 *        (`i001` < `i002`), and `given` < `taken` alphabetically — which is
 *        also their chronological order. so round N's conversation is a
 *        byte-prefix of round N+1's, and that is the whole reason the hit
 *        rate climbs round over round.
 */
const conversationAtRound = (input: { round: number }) =>
  Array.from({ length: input.round - 1 }, (_, index) => {
    const iteration = String(index + 1).padStart(3, '0');
    return {
      path: `.reviews/peer/1.vision._.review.i${iteration}.abc.r${iteration}._.given.by_peer.repo-rules.md`,
      content: `## blockers\n${`round ${index + 1}: the catch at line 12 swallows the error. `.repeat(40)}`,
    };
  });

/**
 * .what = compiles a review prompt the way `stepReview` does
 * .why = keeps each case to what varies — the conversation and the target
 */
const compileForRound = (input: {
  conversation: Array<{ path: string; content: string }>;
  revision: string;
  rules?: Array<{ path: string; content: string }>;
}) =>
  compileReviewPrompt({
    rules: input.rules ?? rulesFixture,
    refs: [],
    conversation: input.conversation,
    targets: targetsAtRound({ revision: input.revision }),
    focus: 'push',
    goal: 'exhaustive',
    contextWindowSize: 1_000_000,
    costSpec: costSpecFixture,
    diffRange: 'since-main',
  });

/** the whole wire prefix — head then tail, the order the request sends them */
const genPromptForRound = (input: {
  conversation: Array<{ path: string; content: string }>;
  revision: string;
}): string => compileForRound(input).prompt;

/**
 * .what = measures where a review prompt's cacheable prefix ends, round over round
 * .why = the durable evidence behind the cache diagnosis. the prefix claims
 *        in the findings doc are produced here, by a named instrument, over
 *        prompts built by the real compiler — never a hand estimate. every
 *        assertion below is a regression clamp on one of three layout repairs
 *        (rule.require.clamp-edge-cases), each red against the prior layout
 *        and green against this one:
 *          - a conditional item above the rubric parted round 1 from round 2 at
 *            byte 534 of ~16k. case1 [t0] now demands the whole head survive
 *          - `## output format` sat below `## target`, so ~1.7kb of boilerplate
 *            identical on EVERY review ever run could never be cached. case3 now
 *            demands it sit inside the head
 *          - the head was not separable at all, so it could not ride as a brief
 *            and no replica pin was derivable. case4 clamps the split
 * .note = `prompt` is what the wire carries in order — the head as the system
 *         message, the tail as the user message. so a prefix measured over the
 *         concatenation is the prefix a replica actually sees.
 */
describe('reviewPromptCacheAnatomy', () => {
  given(
    '[case1] the same reviewer, across consecutive rounds of one stone',
    () => {
      const roundOne = genPromptForRound({
        conversation: conversationAtRound({ round: 1 }),
        revision: 'v1',
      });
      const roundTwo = genPromptForRound({
        conversation: conversationAtRound({ round: 2 }),
        revision: 'v2',
      });
      const roundThree = genPromptForRound({
        conversation: conversationAtRound({ round: 3 }),
        revision: 'v3',
      });

      when('[t0] round 1 is compared to round 2', () => {
        const overlap = getOneSharedPrefixOverlap({
          earlier: roundOne,
          later: roundTwo,
        });

        then(
          'the prefix survives the whole rubric, not merely the head',
          () => {
            // the round a conversation first appears is the round that used to
            // break earliest: an instruction item was appended only when a
            // conversation existed, and that item sat ABOVE `## rules`. so the
            // prompt diverged before the largest static block the cache had to
            // offer. every instruction item is unconditional now, so the rubric
            // is reached whether or not a conversation is present.
            const headOfRulesSection = roundTwo.indexOf('## rules');
            expect(headOfRulesSection).toBeGreaterThan(0);
            expect(overlap.sharedBytes).toBeGreaterThan(headOfRulesSection);
          },
        );

        then('so a majority of round 2 could be served from round 1', () => {
          // was under 10% against the prior layout; the conversation is the first
          // byte that may differ, and it sits below every static block
          expect(overlap.sharedShare!).toBeGreaterThan(0.5);
        });
      });

      when('[t1] round 2 is compared to round 3', () => {
        const overlap = getOneSharedPrefixOverlap({
          earlier: roundTwo,
          later: roundThree,
        });

        then(
          'the prefix reaches into the target, ahead of the exchange',
          () => {
            // the target now LEADS the tail, so the prefix runs through it and
            // parts only where the target itself was revised. this fixture
            // holds ONE target and revises it every round, the worst case for
            // any order — case5 measures the realistic shape, where a lane
            // holds many targets and the driver repairs a few. what matters
            // here is the DIRECTION: the prefix now stops inside the target
            // rather than inside the conversation, so the bytes the
            // conversation used to gate are reachable at all.
            const headOfTarget = roundThree.indexOf('## target');
            const headOfConversation = roundThree.indexOf(
              '## prior conversation',
            );
            expect(headOfTarget).toBeGreaterThan(0);
            expect(headOfConversation).toBeGreaterThan(headOfTarget);
            expect(overlap.sharedBytes).toBeGreaterThan(headOfTarget);
          },
        );

        then(
          'a majority of the prompt is cacheable between adjacent rounds',
          () => {
            expect(overlap.sharedShare!).toBeGreaterThan(0.5);
          },
        );
      });

      when('[t2] the anatomy is tabulated', () => {
        then(
          'the measured offsets are snapped, so a claim can cite them',
          () => {
            // the findings doc quotes THESE figures. snapped so the numbers in prose
            // and the numbers the compiler produces cannot drift apart, and so a
            // layout change that moves them shows up in a diff a human reviews.
            const asShare = (share: number | null) =>
              share === null ? 'absent' : `${(share * 100).toFixed(1)}%`;
            const oneToTwo = getOneSharedPrefixOverlap({
              earlier: roundOne,
              later: roundTwo,
            });
            const twoToThree = getOneSharedPrefixOverlap({
              earlier: roundTwo,
              later: roundThree,
            });
            const sectionOffsets = {
              outputFormat: roundTwo.indexOf('## output format'),
              rules: roundTwo.indexOf('## rules'),
              conversation: roundTwo.indexOf('## prior conversation'),
              target: roundTwo.indexOf('## target'),
              totalBytes: Buffer.byteLength(roundTwo, 'utf-8'),
            };

            // the layout the figures describe: static blocks first, then the
            // target, then the conversation, and the prefix past the rubric
            expect(sectionOffsets.outputFormat).toBeGreaterThan(0);
            expect(sectionOffsets.rules).toBeGreaterThan(
              sectionOffsets.outputFormat,
            );
            expect(sectionOffsets.target).toBeGreaterThan(sectionOffsets.rules);
            expect(sectionOffsets.conversation).toBeGreaterThan(
              sectionOffsets.target,
            );
            expect(sectionOffsets.totalBytes).toBeGreaterThan(
              sectionOffsets.conversation,
            );
            expect(oneToTwo.sharedBytes).toBeGreaterThan(sectionOffsets.rules);
            expect(twoToThree.sharedBytes).toBeGreaterThan(
              sectionOffsets.rules,
            );

            expect({
              sectionOffsets,
              prefixSurvival: {
                'round1 -> round2': {
                  sharedBytes: oneToTwo.sharedBytes,
                  sharedShare: asShare(oneToTwo.sharedShare),
                },
                'round2 -> round3': {
                  sharedBytes: twoToThree.sharedBytes,
                  sharedShare: asShare(twoToThree.sharedShare),
                },
              },
            }).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case2] two different reviewers on the same stone and round', () => {
    const laneA = compileForRound({
      conversation: [],
      revision: 'v1',
      rules: [rulesFixture[0]!],
    }).prompt;
    const laneB = compileForRound({
      conversation: [],
      revision: 'v1',
      rules: [rulesFixture[1]!],
    }).prompt;

    when('[t0] the two lanes are compared', () => {
      const shared = getOneSharedPrefixByteCount({ a: laneA, b: laneB });

      then('they share every block that precedes the rubric', () => {
        // the nine L1 lanes read the SAME target corpus but carry DIFFERENT
        // rubrics, and the rubric sits ABOVE the target. so no lane can reuse
        // another lane's prefix past its own rules — the divergence lands at the
        // rubric, never before it and never after it.
        const headOfRulesSection = laneA.indexOf('## rules');
        expect(shared).toBeGreaterThan(0);
        expect(shared).toBeGreaterThanOrEqual(headOfRulesSection);
        expect(shared).toBeLessThan(laneA.indexOf('## target'));
      });

      then('so the grove-wide boilerplate is inside every lane prefix', () => {
        // the cross-lane payoff of the `## output format` move. this block is
        // byte-identical on EVERY review the grove ever runs, so its whole
        // value depends on it staying ahead of the first per-lane byte.
        const headOfOutputFormat = laneA.indexOf('## output format');
        expect(headOfOutputFormat).toBeGreaterThan(0);
        expect(shared).toBeGreaterThan(headOfOutputFormat);
      });
    });
  });

  given('[case3] the grove-static boilerplate the layout must hoist', () => {
    const compiled = compileForRound({ conversation: [], revision: 'v1' });
    const prompt = compiled.prompt;

    when('[t0] the output-format block is located', () => {
      then('it sits ABOVE <target>, where a prefix can still reach it', () => {
        // it used to trail the variable target section, so a prefix cache could
        // never reach it and it was re-paid at full input rate on every single
        // review the grove ran.
        const headOfTarget = prompt.indexOf('## target');
        const headOfOutputFormat = prompt.indexOf('## output format');
        expect(headOfOutputFormat).toBeGreaterThan(0);
        expect(headOfOutputFormat).toBeLessThan(headOfTarget);
      });

      then('and it rides in the static head, never the variable tail', () => {
        expect(compiled.promptHeadStatic).toContain('## output format');
        expect(compiled.promptTailVariable).not.toContain('## output format');
      });

      then('and it is not trivial in size', () => {
        // ~1.5kb of unconditionally static boilerplate — the size is what makes
        // its position worth a rule rather than a preference
        const headOfOutputFormat = prompt.indexOf('## output format');
        const headOfRules = prompt.indexOf('## rules');
        const blockBytes = Buffer.byteLength(
          prompt.slice(headOfOutputFormat, headOfRules),
          'utf-8',
        );
        expect(blockBytes).toBeGreaterThan(1_000);
      });
    });
  });

  given(
    '[case5] a realistic corpus, where few of many targets change per round',
    () => {
      /**
       * .what = a corpus of many targets, of which ONE changes between rounds
       * .why = case1's fixture holds a single target that changes every round —
       *        the worst case for any order, since the target's first byte
       *        always differs. a real lane reviews dozens of files and the
       *        driver repairs a handful, and `getAllTargetsByCacheStability`
       *        sorts the ones that moved to the end. that shape is what the
       *        order question turns on.
       */
      const corpusAtRound = (input: { revision: string }) =>
        Array.from({ length: 12 }, (_, index) => {
          // the LAST file is the one the driver repaired; the rest are untouched,
          // which is the order `getAllTargetsByCacheStability` produces
          const isRepaired = index === 11;
          const body = isRepaired ? input.revision : 'stable';
          return {
            path: `src/domain.operations/file${String(index).padStart(2, '0')}.ts`,
            content: `export const op${index} = () => { /* ${body} */ };\n${'// context line\n'.repeat(50)}`,
            diff: `@@ -1 +1 @@\n+export const op${index} = () => { /* ${body} */ };`,
            changeKind: 'edited' as const,
          };
        });

      const compileCorpusRound = (input: { round: number; revision: string }) =>
        compileReviewPrompt({
          rules: rulesFixture,
          refs: [],
          conversation: conversationAtRound({ round: input.round }),
          targets: corpusAtRound({ revision: input.revision }),
          focus: 'push',
          goal: 'exhaustive',
          contextWindowSize: 1_000_000,
          costSpec: costSpecFixture,
          diffRange: 'since-main',
        });

      /**
       * .what = the same prompt with its two tail blocks swapped back
       * .why = the counterfactual. the tail now ships as `target ++
       *        conversation`, so this reassembles the conversation-first
       *        layout the compiler used to emit — the loser of the
       *        measurement, kept so the margin stays checkable rather than a
       *        figure quoted in a comment.
       *
       * .note = a MEASUREMENT of a layout, never a proposal of one. the real
       *         compiler is untouched; this reassembles its own output.
       */
      const asTailConversationFirst = (input: { tail: string }): string => {
        const headOfConversation = input.tail.indexOf('## prior conversation');
        const targetPart = input.tail.slice(0, headOfConversation);
        const conversationPart = input.tail.slice(headOfConversation);
        return `${conversationPart}${targetPart}`;
      };

      const roundTwo = compileCorpusRound({ round: 2, revision: 'v2' });
      const roundThree = compileCorpusRound({ round: 3, revision: 'v3' });

      when(
        '[t0] the shipped order is measured — target, then conversation',
        () => {
          const overlap = getOneSharedPrefixOverlap({
            earlier: roundTwo.prompt,
            later: roundThree.prompt,
          });

          then('🔴 the prefix reaches deep into the stable corpus', () => {
            // the claim this layout was taken for. the 11 untouched files are
            // byte-identical across rounds and sit ahead of the first divergent
            // byte, so the prefix runs through all of them before it parts at
            // the one file the driver repaired.
            const headOfConversation = roundThree.prompt.indexOf(
              '## prior conversation',
            );
            expect(headOfConversation).toBeGreaterThan(0);
            expect(overlap.sharedBytes).toBeGreaterThan(
              roundThree.prompt.indexOf('## target'),
            );
          });
        },
      );

      when(
        '[t1] the prior order is measured — conversation, then target',
        () => {
          const priorTwo = `${roundTwo.promptHeadStatic}${asTailConversationFirst({ tail: roundTwo.promptTailVariable })}`;
          const priorThree = `${roundThree.promptHeadStatic}${asTailConversationFirst({ tail: roundThree.promptTailVariable })}`;
          const overlap = getOneSharedPrefixOverlap({
            earlier: priorTwo,
            later: priorThree,
          });

          then('the swap reorders bytes, and rewrites none of them', () => {
            // the counterfactual is only honest if it carries identical content
            expect(Buffer.byteLength(priorThree, 'utf-8')).toEqual(
              Buffer.byteLength(roundThree.prompt, 'utf-8'),
            );
          });

          then(
            '🔴 the prefix stops inside the conversation, short of the target',
            () => {
              // why the prior layout lost: the whole corpus sat behind a block
              // that grows every round, so not one byte of it was ever
              // cacheable, however stable it was.
              expect(overlap.sharedBytes).toBeLessThan(
                priorThree.indexOf('## target'),
              );
            },
          );
        },
      );

      when('[t2] the two orders are tabulated side by side', () => {
        then(
          'the measured difference is snapped, so a claim can cite it',
          () => {
            // the evidence the reorder was settled on, kept so the margin is
            // checkable rather than quoted. a measurement of two layouts, not
            // a change to either.
            const asShare = (share: number | null) =>
              share === null ? 'absent' : `${(share * 100).toFixed(1)}%`;
            const shipped = getOneSharedPrefixOverlap({
              earlier: roundTwo.prompt,
              later: roundThree.prompt,
            });
            const prior = getOneSharedPrefixOverlap({
              earlier: `${roundTwo.promptHeadStatic}${asTailConversationFirst({ tail: roundTwo.promptTailVariable })}`,
              later: `${roundThree.promptHeadStatic}${asTailConversationFirst({ tail: roundThree.promptTailVariable })}`,
            });
            // the margin the reorder was taken for: the shipped order keeps more
            expect(shipped.sharedBytes).toBeGreaterThan(prior.sharedBytes);
            expect(shipped.sharedShare!).toBeGreaterThan(prior.sharedShare!);

            expect({
              corpus: {
                targets: 12,
                repairedPerRound: 1,
                totalBytes: Buffer.byteLength(roundThree.prompt, 'utf-8'),
              },
              'shipped: target then conversation': {
                sharedBytes: shipped.sharedBytes,
                sharedShare: asShare(shipped.sharedShare),
              },
              'prior: conversation then target': {
                sharedBytes: prior.sharedBytes,
                sharedShare: asShare(prior.sharedShare),
              },
            }).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case4] the head/tail split the replica pin depends on', () => {
    const compiled = compileForRound({
      conversation: conversationAtRound({ round: 2 }),
      revision: 'v1',
    });

    when('[t0] the two halves are inspected', () => {
      then('they concatenate back to the whole prompt, in order', () => {
        // the contract the caller leans on: the head may ride as the system
        // message and the tail as the user message only because the wire
        // bytes are unchanged by the split. break this and the split
        // silently drops or duplicates content.
        expect(compiled.promptHeadStatic + compiled.promptTailVariable).toEqual(
          compiled.prompt,
        );
      });

      then('the head is substantial enough to be worth a pin', () => {
        // a replica pin is derived from the system prompt alone, so a head of a
        // few bytes would pin correctly and cache naught
        expect(compiled.promptHeadStatic.length).toBeGreaterThan(
          compiled.promptTailVariable.length,
        );
      });

      then(
        'every round-variable block sits in the tail, never the head',
        () => {
          // the target and the conversation are what the driver moves between
          // rounds; a byte of either in the head would void the pin's whole value
          expect(compiled.promptTailVariable).toContain('## target');
          expect(compiled.promptTailVariable).toContain(
            '## prior conversation',
          );
          expect(compiled.promptHeadStatic).not.toContain('## target');
          expect(compiled.promptHeadStatic).not.toContain(
            '## prior conversation',
          );
        },
      );

      then('every static block sits in the head, never the tail', () => {
        expect(compiled.promptHeadStatic).toContain('## rules');
        expect(compiled.promptHeadStatic).toContain('CRITICAL INSTRUCTIONS');
        expect(compiled.promptTailVariable).not.toContain('## rules');
        expect(compiled.promptTailVariable).not.toContain(
          'CRITICAL INSTRUCTIONS',
        );
      });
    });
  });

  given(
    '[case6] the WITHIN-target layout — every body first, or one body per diff',
    () => {
      /**
       * .what = the second order question, measured. `[case5]` settles the
       *         SECTION order (target before conversation); this settles the
       *         layout INSIDE the target block.
       * .why = `asTargetSection` ships every file body first and every diff
       *        last, and it states a measured reason for it. that reason was
       *        unclamped: no test went red if a future edit restored the prior
       *        per-target `{diff, file}` pair, so the claim rested on prose
       *        (rule.require.clamp-edge-cases).
       *
       * 🔴 .note = the margin here is NOT unconditional, and that is the whole
       *     finding. with a perfect stability sort and stable diffs the
       *     interleave caches MORE, because it carries each stable diff ahead
       *     of the parting point too. the de-interleave earns its keep only
       *     where a diff moves without its file — so both scenarios are
       *     measured, and the snapshot carries both signs.
       */
      const corpusAtRound = (input: { revision: string; base: string }) =>
        Array.from({ length: 12 }, (_, index) => {
          // the LAST file is the one the driver repaired, which is where
          // `getAllTargetsByCacheStability` puts it
          const isRepaired = index === 11;
          const body = isRepaired ? input.revision : 'stable';
          return {
            path: `src/domain.operations/file${String(index).padStart(2, '0')}.ts`,
            content: `export const op${index} = () => { /* ${body} */ };\n${'// context line\n'.repeat(50)}`,
            // `base` rides every diff, so a moved range base perturbs all 12
            // even where the file bodies did not change — the real shape of a
            // `since-main` range after main advances
            diff: `@@ -1 +1 @@ ${input.base}\n+export const op${index} = () => { /* ${body} */ };`,
            changeKind: 'edited' as const,
          };
        });

      /**
       * .what = the prior layout: one diff immediately ahead of its own file
       * .why = the counterfactual, rendered from the same targets the compiler
       *        was handed. a MEASUREMENT of a layout, never a proposal of one
       *
       * .note = it reproduces the pre-de-interleave bytes exactly: a
       *         `diff\n\nfile` pair per target, pairs joined by the block
       *         separator.
       */
      const asTargetSectionInterleaved = (input: {
        targets: ReturnType<typeof corpusAtRound>;
      }): string =>
        input.targets
          .map((target) => {
            const fileBody = target.content.replace(/\n$/, '');
            const diffBody = target.diff.replace(/\n$/, '');
            return [
              `<target.diff path="${target.path}" kind="~">\n${diffBody}\n</target.diff>`,
              `<target.file path="${target.path}">\n${fileBody}\n</target.file>`,
            ].join('\n\n');
          })
          .join('\n\n---\n\n');

      /**
       * .what = the real prompt, with its target payload swapped for the prior
       *         layout and every other byte untouched
       * .why = the margin must be read off a whole prompt, since a cache serves
       *        from token 0 — a measurement of the section alone would answer a
       *        question no bill is computed from
       *
       * .note = a function replacement, never a string one: `String.replace`
       *         reads `$` in a string replacement as a capture reference, so a
       *         `$&` in any file body would corrupt the swap silently.
       */
      const asPromptInterleaved = (input: {
        prompt: string;
        targets: ReturnType<typeof corpusAtRound>;
      }): string => {
        const shipped = asTargetSection({
          targets: input.targets,
          focus: 'push',
        });
        const interleaved = asTargetSectionInterleaved({
          targets: input.targets,
        });
        return input.prompt.replace(shipped, () => interleaved);
      };

      const compileCorpusRound = (input: {
        round: number;
        revision: string;
        base: string;
      }) => {
        const targets = corpusAtRound({
          revision: input.revision,
          base: input.base,
        });
        const compiled = compileReviewPrompt({
          rules: rulesFixture,
          refs: [],
          conversation: conversationAtRound({ round: input.round }),
          targets,
          focus: 'push',
          goal: 'exhaustive',
          contextWindowSize: 1_000_000,
          costSpec: costSpecFixture,
          diffRange: 'since-main',
        });
        return { targets, compiled };
      };

      when('[t0] the swap carries identical content, rearranged', () => {
        const { targets, compiled } = compileCorpusRound({
          round: 3,
          revision: 'v3',
          base: 'sha-aaa',
        });
        const interleaved = asPromptInterleaved({
          prompt: compiled.prompt,
          targets,
        });

        then(
          '🔴 every file block and every diff block survives the swap',
          () => {
            // the counterfactual is only honest if it drops and invents no byte
            // of content. the two layouts differ in separator accounting — 24
            // blocks with 23 separators, against 12 pairs with 11 — so a byte
            // count cannot be the check, and block presence is.
            for (const target of targets) {
              const fileBody = target.content.replace(/\n$/, '');
              const fileBlock = `<target.file path="${target.path}">\n${fileBody}\n</target.file>`;
              const diffBody = target.diff.replace(/\n$/, '');
              const diffBlock = `<target.diff path="${target.path}" kind="~">\n${diffBody}\n</target.diff>`;
              expect(compiled.prompt).toContain(fileBlock);
              expect(compiled.prompt).toContain(diffBlock);
              expect(interleaved).toContain(fileBlock);
              expect(interleaved).toContain(diffBlock);
            }
          },
        );

        then('the swap actually moved bytes — else it measures naught', () => {
          expect(interleaved).not.toEqual(compiled.prompt);
        });
      });

      when(
        '[t1] only the repaired file moves, and every diff base holds',
        () => {
          const two = compileCorpusRound({
            round: 2,
            revision: 'v2',
            base: 'sha-aaa',
          });
          const three = compileCorpusRound({
            round: 3,
            revision: 'v3',
            base: 'sha-aaa',
          });
          const shipped = getOneSharedPrefixOverlap({
            earlier: two.compiled.prompt,
            later: three.compiled.prompt,
          });
          const interleaved = getOneSharedPrefixOverlap({
            earlier: asPromptInterleaved({
              prompt: two.compiled.prompt,
              targets: two.targets,
            }),
            later: asPromptInterleaved({
              prompt: three.compiled.prompt,
              targets: three.targets,
            }),
          });

          then(
            '🔴 the interleave wins here — it caches the stable diffs too',
            () => {
              // the finding that bounds the shipped claim. the repaired file
              // sorts last, so BOTH layouts part at the same target; the
              // interleave simply has 11 stable diffs ahead of that point and
              // the shipped layout has none. a reader who expects the shipped
              // order to win every scenario is wrong, and this says so.
              expect(interleaved.sharedBytes).toBeGreaterThan(
                shipped.sharedBytes,
              );
            },
          );
        },
      );

      when('[t2] the diff range base moves, as `since-main` does', () => {
        const two = compileCorpusRound({
          round: 2,
          revision: 'v2',
          base: 'sha-aaa',
        });
        const three = compileCorpusRound({
          round: 3,
          revision: 'v3',
          base: 'sha-bbb',
        });
        const shipped = getOneSharedPrefixOverlap({
          earlier: two.compiled.prompt,
          later: three.compiled.prompt,
        });
        const interleaved = getOneSharedPrefixOverlap({
          earlier: asPromptInterleaved({
            prompt: two.compiled.prompt,
            targets: two.targets,
          }),
          later: asPromptInterleaved({
            prompt: three.compiled.prompt,
            targets: three.targets,
          }),
        });

        then('🔴 the shipped order wins here — one diff voids no body', () => {
          // the scenario the de-interleave was taken for. every diff moved
          // while 11 of 12 bodies held, so the interleave parts at the FIRST
          // pair and caches not one body, while the shipped layout keeps all
          // 11 stable bodies ahead of the first diff.
          expect(shipped.sharedBytes).toBeGreaterThan(interleaved.sharedBytes);
        });

        then('the margin is snapped, so a claim can cite it', () => {
          const asShare = (share: number | null) =>
            share === null ? 'absent' : `${(share * 100).toFixed(1)}%`;
          const twoHeld = compileCorpusRound({
            round: 2,
            revision: 'v2',
            base: 'sha-aaa',
          });
          const threeHeld = compileCorpusRound({
            round: 3,
            revision: 'v3',
            base: 'sha-aaa',
          });
          const heldShipped = getOneSharedPrefixOverlap({
            earlier: twoHeld.compiled.prompt,
            later: threeHeld.compiled.prompt,
          });
          const heldInterleaved = getOneSharedPrefixOverlap({
            earlier: asPromptInterleaved({
              prompt: twoHeld.compiled.prompt,
              targets: twoHeld.targets,
            }),
            later: asPromptInterleaved({
              prompt: threeHeld.compiled.prompt,
              targets: threeHeld.targets,
            }),
          });

          // the hedge, asserted rather than only snapped: the interleave wins
          // while the base holds, and the shipped prefix is INVARIANT to the
          // base — the same bytes in both states, which is the whole case for it
          expect(heldInterleaved.sharedBytes).toBeGreaterThan(
            heldShipped.sharedBytes,
          );
          expect(heldShipped.sharedBytes).toEqual(shipped.sharedBytes);

          expect({
            corpus: { targets: 12, repairedPerRound: 1 },
            'scenario A — diff base HELD (the interleave wins)': {
              'shipped: bodies then diffs': {
                sharedBytes: heldShipped.sharedBytes,
                sharedShare: asShare(heldShipped.sharedShare),
              },
              'prior: one diff per body': {
                sharedBytes: heldInterleaved.sharedBytes,
                sharedShare: asShare(heldInterleaved.sharedShare),
              },
            },
            'scenario B — diff base MOVED (the shipped order wins)': {
              'shipped: bodies then diffs': {
                sharedBytes: shipped.sharedBytes,
                sharedShare: asShare(shipped.sharedShare),
              },
              'prior: one diff per body': {
                sharedBytes: interleaved.sharedBytes,
                sharedShare: asShare(interleaved.sharedShare),
              },
            },
          }).toMatchSnapshot();
        });
      });
    },
  );
});
