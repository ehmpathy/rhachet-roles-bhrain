import { given, then, when } from 'test-fns';

import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import { getOneAttributionGrade } from '@src/domain.operations/review/getOneAttributionGrade';
import {
  BOUND_OF_MARKUP_SHARE,
  FLOOR_OF_ATTRIBUTABLE_CHARS,
  FLOOR_OF_MEASURABLE_CHARS,
} from '@src/domain.operations/review/getOneAttributionGradeOfMarkup';
import { LABEL_OF_ABSENT_KEY } from '@src/domain.operations/review/grove/genReviewGroveReport';
import { SLUG_OF_ABSENT_IDENTITY } from '@src/domain.operations/review/SLUG_OF_ABSENT_IDENTITY';

/**
 * .what = a composition with a chosen prompt size and a chosen residual
 * .why = 🔴 the grade turns on exactly two numbers — `chars` and
 *        `inputs.markup.chars` — so a fixture that fakes the other rows would
 *        add noise to every case without a single new branch reached.
 *
 * .note = the other rows are left nil ON PURPOSE. this operation never reads
 *         them, and a fixture that pretended otherwise would imply a link the
 *         next author would then preserve.
 */
const asComposition = (input: {
  chars: number;
  markup: number;
}): Omit<PromptComposition, 'attribution'> =>
  ({
    chars: input.chars,
    inputs: { markup: { chars: input.markup, count: 0, cacheable: false } },
  }) as unknown as Omit<PromptComposition, 'attribution'>;

describe('getOneAttributionGrade', () => {
  given('[case1] a prompt whose residual is ordinary decoration', () => {
    when('[t0] the census grades its own coverage', () => {
      then('it vouches for the rows', () => {
        // 100k chars, 1% markup — the measured shape of a real prompt
        const grade = getOneAttributionGrade({
          composition: asComposition({ chars: 100_000, markup: 1_000 }),
        });
        expect(grade).toEqual('attributed');
      });
    });
  });

  given(
    '[case2] a prompt whose residual is large in BOTH mass and share',
    () => {
      /**
       * 🔴 the case wish bar 2 exists for: an input entered the prompt and no
       * row names it, so its chars land in the residual and the rows still sum.
       */
      when('[t0] the census grades its own coverage', () => {
        then('🔴 it DECLINES to vouch for the rows', () => {
          // 100k chars, 20% markup — twice the bound, far past the mass floor
          const grade = getOneAttributionGrade({
            composition: asComposition({ chars: 100_000, markup: 20_000 }),
          });
          expect(grade).toEqual('unattributed');
        });
      });
    },
  );

  given('[case3] a prompt too small for a share to carry signal', () => {
    /**
     * .why = a rate over a tiny denominator is noise. a 200-char fixture whose
     *        markup is `'head' + 'tail'` reads as a large share, which is
     *        arithmetically true and says naught about coverage.
     */
    when('[t0] the prompt is under the measurable floor', () => {
      then('it vouches, and the share is never consulted', () => {
        const chars = FLOOR_OF_MEASURABLE_CHARS - 1;
        const grade = getOneAttributionGrade({
          // 99% markup — an `unattributed` verdict if the share ruled here
          composition: asComposition({ chars, markup: chars - 1 }),
        });
        expect(grade).toEqual('attributed');
      });
    });
  });

  given(
    '[case4] a supplies-light lane — a high share over a tiny residual',
    () => {
      /**
       * 🔴 the false positive that was MEASURED, not imagined. markup scales
       * with the BLOCK COUNT (~150 chars of tag per block); an unattributed
       * input scales with the CORPUS. so a lane whose rubric is a few chars
       * reads a high share off constant decoration.
       *
       * measured 2026-09-21, `compileReviewPrompt.test.ts [case-conversation]`:
       * a genuinely compiled prompt, 5,276 chars, 789 of markup — 15.0%, over a
       * 10% bound, every char a real tag around a real block.
       *
       * .note = it asserts the SHARE still exceeds the bound, so the case
       *         cannot silently stop to exercise what it was written for.
       *         without that line, a later change to the fixture could drop it
       *         under 10% and the test would still pass — green for the wrong
       *         reason.
       */
      const CHARS = 5_276;
      const MARKUP = 789;

      when('[t0] the census grades it', () => {
        then('the fixture still trips the SHARE bound', () => {
          expect(MARKUP / CHARS).toBeGreaterThan(BOUND_OF_MARKUP_SHARE);
        });

        then('🔴 the mass floor saves it from a false `unattributed`', () => {
          expect(MARKUP).toBeLessThan(FLOOR_OF_ATTRIBUTABLE_CHARS);
          const grade = getOneAttributionGrade({
            composition: asComposition({ chars: CHARS, markup: MARKUP }),
          });
          expect(grade).toEqual('attributed');
        });
      });
    },
  );

  given('[case5] a residual that went NEGATIVE', () => {
    /**
     * 🔴 the opposite direction, which the share cannot see: a diff counted but
     * never rendered inflates `targetDiffs` and drives the residual below zero.
     * arithmetically impossible for a prompt that was really rendered, so it
     * names a CODE defect at every scale — and it THROWS where the share grades.
     */
    when('[t0] the census reads it', () => {
      then('🔴 it throws rather than grades', () => {
        expect(() =>
          getOneAttributionGrade({
            composition: asComposition({ chars: 100_000, markup: -1 }),
          }),
        ).toThrow('markup went NEGATIVE');
      });

      then('the throw names the fix, never the symptom alone', () => {
        const error = (() => {
          try {
            getOneAttributionGrade({
              composition: asComposition({ chars: 100_000, markup: -1 }),
            });
            return null;
          } catch (caught) {
            return caught as Error;
          }
        })();

        expect(error).not.toEqual(null);
        expect(error?.message).toContain('isTargetDiffSent');
      });

      then(
        '🔴 the negative check runs FIRST — a tiny prompt does not excuse it',
        () => {
          // under the measurable floor, where the share branch returns early.
          // a negative residual is a defect at EVERY scale, so the floor must
          // not swallow it
          expect(() =>
            getOneAttributionGrade({
              composition: asComposition({ chars: 100, markup: -1 }),
            }),
          ).toThrow('markup went NEGATIVE');
        },
      );
    });
  });

  given(
    '[case6] a corpus PAST the mass floor, where the share alone rules',
    () => {
      /**
       * 🔴 the regime `[case4]` cannot speak for. there the mass floor was the
       * subject under test, and it answered `attributed` before the share was
       * ever consulted — so that case proves the floor prevents a false positive
       * and proves NAUGHT about whether detection survives once the floor is
       * behind us.
       *
       * .why = the floor is crossed at ~15 targets (~90 chars of tag apiece), and
       *        every real review carries more. so the floor's regime is the
       *        EXCEPTION and this one is the norm — the scale at which wish bar 2
       *        actually has to hold, and the scale no case here had exercised.
       *
       * .note = both halves sit past `FLOOR_OF_ATTRIBUTABLE_CHARS` ON PURPOSE.
       *         that is what makes the pair a measurement of the SHARE: if either
       *         half returned early at the floor, the two would differ for a
       *         reason that has naught to do with the input that was added.
       */
      const TARGETS = 40;
      const MARKUP_PER_TARGET = 90;
      const MARKUP_LEGIT = TARGETS * MARKUP_PER_TARGET; // 3,600 — past the floor
      const CHARS_OF_CLEAN = 100_000;

      const CHARS_OF_ABSENT_INPUT = 9_000; // an input that entered with no row

      when('[t0] every input the corpus carries has a row', () => {
        then('the floor is behind us, so the SHARE is what answers', () => {
          expect(MARKUP_LEGIT).toBeGreaterThan(FLOOR_OF_ATTRIBUTABLE_CHARS);
          expect(MARKUP_LEGIT / CHARS_OF_CLEAN).toBeLessThan(
            BOUND_OF_MARKUP_SHARE,
          );
        });

        then('it vouches for the rows', () => {
          const grade = getOneAttributionGrade({
            composition: asComposition({
              chars: CHARS_OF_CLEAN,
              markup: MARKUP_LEGIT,
            }),
          });
          expect(grade).toEqual('attributed');
        });
      });

      when(
        '[t1] one input enters with NO row, and hides in that scaffold',
        () => {
          const chars = CHARS_OF_CLEAN + CHARS_OF_ABSENT_INPUT;
          const markup = MARKUP_LEGIT + CHARS_OF_ABSENT_INPUT;

          then('the floor is behind us here too — only the share moved', () => {
            expect(markup).toBeGreaterThan(FLOOR_OF_ATTRIBUTABLE_CHARS);
          });

          then(
            '🔴 it still DECLINES to vouch — detection survives the floor',
            () => {
              const grade = getOneAttributionGrade({
                composition: asComposition({ chars, markup }),
              });
              expect(grade).toEqual('unattributed');
            },
          );
        },
      );
    },
  );
});

describe('the word `unattributed`, as a declared term', () => {
  /**
   * 🔴 `unattributed` names exactly ONE concept in this repo — an
   * `AttributionGrade`: a prompt census that declines to vouch for its own rows.
   *
   * .why = it was spent TWICE on a second concept — *"a run with no guard
   *        identity"* — once in `grove/` and once in `meter/`. the `grove/` one
   *        was found and renamed; the `meter/` one survived, because the repair
   *        bound the one call site somebody remembered to wire.
   *
   *        that is the SAME lesson this branch already learned at
   *        `isTargetDiffSent`, and it recurred at the next rename. so the clamp
   *        is aimed at the CLASS, never at either instance: it reads every
   *        absent-key label the two reports render and asserts none of them
   *        reaches for the declared word.
   *
   * .note = a label renders where a reader holds no TYPE to part two senses by,
   *         which is why the collision costs more in output than in code
   *         (rule.forbid.domain-term-ambiguity).
   */
  given('[case1] every label a report renders for an ABSENT key', () => {
    when('[t0] the declared term is searched for among them', () => {
      const labels = [
        SLUG_OF_ABSENT_IDENTITY,
        ...Object.values(LABEL_OF_ABSENT_KEY),
      ];

      then('🔴 not one of them spends the word `unattributed`', () => {
        for (const label of labels)
          expect(label.toLowerCase()).not.toContain('unattributed');
      });

      then('each still NAMES its absence, rather than render empty', () => {
        // the collision is repaired by a better word, never by silence — a
        // bucket with no visible name is dropped from a reader's view, and the
        // corpus total then exceeds the sum of its rows (rule.forbid.failhide)
        for (const label of labels) {
          expect(label).toContain('no ');
          expect(label.length).toBeGreaterThan(10);
        }
      });
    });
  });
});
