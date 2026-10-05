import { given, then, when } from 'test-fns';

import { asReviewPeerBrain } from './asReviewPeerBrain';

/**
 * .what = pins the reader that answers case=9's question for the OTHER scope
 * .why = `brain:` bounds the driver and `--brain` bounds each reviewer. case=9 [t4]
 *        prints both, so a reader learns the relation from the run rather than from the
 *        key name — and this is the half that reads the reviewer's declaration
 *
 * .note = every `run:` string below is copied from a real guard in this repo rather than
 *         invented, so a change to the guard format fails here before it fails in a drive
 *
 * 🔴 .note = the return is a DISCRIMINATED UNION, and the `cause` is what each abstention
 *           row asserts. these once read `.toEqual(null)` on both abstention kinds alike,
 *           so the suite was green on the very fusion `case6` below exists to refuse —
 *           a clamp cannot catch a state its assertions cannot express
 */
describe('asReviewPeerBrain', () => {
  given('[case1] a `rhx review` line that declares a brain', () => {
    when('[t0] the run is read', () => {
      then('the `--brain` value is returned', () => {
        expect(
          asReviewPeerBrain({
            run: `rhx review --repo bhrain --rules '...' --brain opus`,
          }),
        ).toEqual({ brain: 'opus' });
      });

      then('a slug that holds slashes survives whole', () => {
        // .why = `rhx review`'s own default is `openrouter/deepseek/flash`, so a reader
        //        that stopped at a `/` would truncate the most common value there is
        expect(
          asReviewPeerBrain({
            run: `rhx review --brain openrouter/deepseek/flash --diffs since-main`,
          }),
        ).toEqual({ brain: 'openrouter/deepseek/flash' });
      });
    });
  });

  given('[case2] an `rhx enroll` line, which names the axis `--model`', () => {
    // 🔴 .why = this repo's own L3 reviewers are enroll lines, so a reader that knew only
    //          `--brain` would print `(its tool's default)` for the two most expensive
    //          reviewers on the stone — the exact rows case=9 exists to make visible
    when('[t0] the run is read', () => {
      then('the `--model` value is returned, quotes stripped', () => {
        expect(
          asReviewPeerBrain({
            run: `$rhx enroll claude --model 'claude-sonnet-5[1m]' --roles reviewer -p '...'`,
          }),
        ).toEqual({ brain: 'claude-sonnet-5[1m]' });
      });

      then('a double-quoted value is stripped the same way', () => {
        expect(
          asReviewPeerBrain({ run: `rhx enroll claude --model "opus"` }),
        ).toEqual({ brain: 'opus' });
      });
    });
  });

  given('[case3] a run that declares NO brain', () => {
    const CASES = [
      {
        run: `rhx review --repo bhrain --rules '...' --diffs since-main`,
        why: 'it carries no brain flag at all',
      },
      {
        run: `rhx review --brain`,
        why: 'the flag is present with no value after it',
      },
      {
        run: `rhx review --brain ''`,
        why: 'the flag is present with an EMPTY value',
      },
      { run: '', why: 'the run is empty' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the run is \`${thisCase.run}\``, () => {
        then(`the cause is \`undeclared\` — ${thisCase.why}`, () => {
          // .why = `undeclared` means NO BRAIN APPLIES, so the render prints the tool's
          //        default rather than a slug this repo would have to guess
          //
          // 🔴 .note = rows 2 and 3 differ in SYNTAX and not at all in effect, and both are
          //           `undeclared` for that reason. `unreadable` is reserved for a value
          //           that EXISTS and this reader cannot see — the case where the quiet
          //           cell would be a lie. neither applies a brain, so the quiet cell is
          //           true, and a loud one would spend the reader's attention on a row
          //           that needs none
          expect(asReviewPeerBrain({ run: thisCase.run })).toEqual({
            brain: null,
            cause: 'undeclared',
          });
        });
      });
    });
  });

  given('[case4] a run a naive text scan would get wrong', () => {
    when('[t0] a longer flag shares the prefix', () => {
      then('`--brainstorm` is NOT read as `--brain`', () => {
        // 🔴 .why = the separator is part of the match, so a flag that merely STARTS with
        //          `brain` cannot satisfy it. a prefix read would print a reviewer's
        //          brain as the word that followed an unrelated flag
        expect(
          asReviewPeerBrain({ run: `rhx review --brainstorm yes` }),
        ).toEqual({ brain: null, cause: 'undeclared' });
      });
    });

    when('[t1] the flag uses `=` rather than a space', () => {
      then('the value is still read', () => {
        expect(asReviewPeerBrain({ run: `rhx review --brain=opus` })).toEqual({
          brain: 'opus',
        });
      });
    });

    when('[t2] the word `--brain` appears inside a quoted prompt', () => {
      then('the real flag wins, and the quoted mention is ignored', () => {
        expect(
          asReviewPeerBrain({
            run: `rhx review --brain sonnet -p 'mention --brain opus in the report'`,
          }),
        ).toEqual({ brain: 'sonnet' });
      });
    });

    when('[t3] the ONLY `--brain` text sits inside a quoted prompt', () => {
      /**
       * 🔴 .why = the case that makes [t2] insufficient, and it was a REAL defect. [t2]
       *          passes for the wrong reason — the real flag came first, so a scan that
       *          could not see quotes at all still returned the right answer. here there
       *          is no real flag, so the same scan attributed `opus` to a reviewer that
       *          declared none, and the drive printed a cost claim nobody made
       *
       * .note = the render is the harm, never the read. case=9 [t4] prints these rows so
       *         a human can price the round; a fabricated row prices it wrong and reads
       *         exactly like a true one (`rule.forbid.failhide`)
       */
      then('the cause is `undeclared` — a mention is not a declaration', () => {
        expect(
          asReviewPeerBrain({
            run: `rhx review -p 'use --brain opus in the report'`,
          }),
        ).toEqual({ brain: null, cause: 'undeclared' });
      });

      then('a double-quoted prompt is read the same way', () => {
        expect(
          asReviewPeerBrain({
            run: `rhx review -p "prefer --model sonnet over opus"`,
          }),
        ).toEqual({ brain: null, cause: 'undeclared' });
      });
    });

    when('[t4] the run OPENS on the flag, with no word ahead of it', () => {
      /**
       * 🔴 .why = the anchor is `(^|\s)`, and the `^` half had no clamp. the prior
       *          pattern anchored on a leading SPACE alone, so a run whose first
       *          character is the flag matched no flag at all — and `asReviewPeerBrain`
       *          returns null for "matched none", which is the same value it returns for
       *          "this reviewer declared no brain"
       *
       * ⇒ the two states are indistinguishable at the call site, so case=9's render would
       *   print a declared reviewer as undeclared and a human would price the round on a
       *   wrong row (`rule.forbid.failhide`)
       *
       * .note = drop the `^` from the alternation and both rows below go red
       *         (`rule.require.clamp-edge-cases`)
       */
      then('a bare flag-first run is read', () => {
        expect(asReviewPeerBrain({ run: `--brain opus` })).toEqual({
          brain: 'opus',
        });
      });

      then('and the `=` form is read there too', () => {
        expect(
          asReviewPeerBrain({ run: `--model=sonnet --roles reviewer` }),
        ).toEqual({ brain: 'sonnet' });
      });
    });

    when('[t5] a quoted VALUE holds the flag word', () => {
      then('the value is still read whole', () => {
        // .why = the mask blanks quoted CONTENT and keeps its length, so a quoted value
        //        stays readable at its own offsets. a mask that collapsed spans would
        //        find the flag and then hand back the wrong slice of the original
        expect(
          asReviewPeerBrain({
            run: `rhx enroll claude --model 'claude-opus-5[1m]' --roles reviewer`,
          }),
        ).toEqual({ brain: 'claude-opus-5[1m]' });
      });
    });
  });

  given(
    '[case5] the shell forms this reader is DOCUMENTED not to parse',
    () => {
      /**
       * 🔴 .why = the op's own `.note` calls these a "KNOWN, ACCEPTED bound" — a brain behind
       *          a substitution yields no readable literal. that claim had NO clamp, so it
       *          was a promise rather than a property
       *
       * ⇒ what these pin is the DEGRADATION, never the parse. the abstention is the honest
       *   answer here: the reader may not run a shell to learn the value. the hazard a clamp
       *   must refuse is the OTHER failure — a scan that returns `$(cat` or a fragment and
       *   prices the round on a brain nobody declared
       *
       * .note = and the cause is `unreadable`, which is the half that was owed. a
       *           substitution resolves at run time to a REAL brain, possibly the dearest in
       *           the file — so `undeclared` here would report "takes the cheap default" for
       *           a lane that is on a real one. that is the cost-row lie, and these two rows
       *           are the only place the vocabulary is pinned
       *
       * .note = to widen `FLAG_DECLARED` so any of these "parses" turns a documented
       *         abstention into a fabricated row. these rows go red on that change, which
       *         is what makes them a clamp (`rule.require.clamp-edge-cases`)
       */
      when('[t0] the value comes from a `$()` substitution', () => {
        then('it abstains rather than reports the substitution text', () => {
          expect(
            asReviewPeerBrain({ run: `rhx review --brain $(cat .brain)` }),
          ).toEqual({ brain: null, cause: 'unreadable' });
        });
      });

      when('[t1] the value comes from a backtick substitution', () => {
        then('it abstains rather than reports the backtick text', () => {
          expect(
            asReviewPeerBrain({ run: 'rhx review --brain `cat .brain`' }),
          ).toEqual({ brain: null, cause: 'unreadable' });
        });
      });

      /**
       * 🔴 .why = the header promises THREE forms abstain — "a substitution, an unclosed
       *          quote, or an escaped quote" — and only the first had a row. the other two
       *          did not merely lack a clamp; they did not WORK:
       *
       *          `--brain 'opus`     → `{ brain: "'opus" }`
       *          `--brain \'opus\'`  → `{ brain: "\\'opus\\'" }`
       *
       * ⇒ two fabricated slugs, in the cost row, beneath a comment that swore they could
       *   not happen. the trace for the first: the mask keeps the quote that OPENS the
       *   span, so `FLAG_DECLARED`'s `'[^']*'` arm cannot match (no quote closes it) and
       *   `\S+` takes `'\0\0\0\0` instead; the strip needs a PAIR so it no-ops; and the
       *   old `/^[$`]/` guard sees `'`, which is neither `$` nor a backtick
       *
       * .note = narrow the class back to `/^[$`]/` and all three rows below go red
       *         (`rule.require.clamp-edge-cases`)
       */
      when('[t1b] no quote ever CLOSES the value', () => {
        then("a lone `'` abstains", () => {
          expect(
            asReviewPeerBrain({ run: `rhx review --brain 'opus` }),
          ).toEqual({ brain: null, cause: 'unreadable' });
        });

        then('a lone `"` abstains too', () => {
          expect(
            asReviewPeerBrain({ run: `rhx review --brain "opus` }),
          ).toEqual({ brain: null, cause: 'unreadable' });
        });
      });

      when(
        '[t1d] the substitution sits INSIDE the value, never at its head',
        () => {
          /**
           * .why = a first-character test is not enough: `--brain opus$(cat .brain)` splits
           *        on whitespace, so `\S+` takes `opus$(cat`, which opens on an ordinary `o`
           */
          then('an embedded `$(` abstains', () => {
            expect(
              asReviewPeerBrain({
                run: `rhx review --brain opus$(cat .brain)`,
              }),
            ).toEqual({ brain: null, cause: 'unreadable' });
          });

          then('an embedded `${}` variable abstains too', () => {
            expect(
              asReviewPeerBrain({ run: `rhx review --brain claude-\${TIER}` }),
            ).toEqual({ brain: null, cause: 'unreadable' });
          });
        },
      );

      when('[t1e] every real slug in this repo survives the allowlist', () => {
        // 🔴 .why = an allowlist's hazard is the OPPOSITE of a blocklist's — it abstains on
        //          a value it should have read. these are the values this repo actually
        //          declares, so a class too narrow goes red here rather than in a drive
        const REAL = [
          'opus',
          'sonnet',
          'anthropic/claude/sonnet',
          'openrouter/deepseek/flash',
          'claude-opus-5[1m]',
          'claude-haiku-4-5-20251001',
          'gpt_4.1',
        ];

        REAL.forEach((slug) => {
          then(`\`${slug}\` reads as a brain`, () => {
            expect(
              asReviewPeerBrain({ run: `rhx review --brain ${slug}` }),
            ).toEqual({ brain: slug });
          });
        });
      });

      when('[t1c] the quotes around the value are ESCAPED', () => {
        then(
          'the backslash form abstains rather than reports its source text',
          () => {
            // .why = the third form the header names, and the one a reader is likeliest to
            //        write by hand inside a `run: |` block that is already quoted once
            expect(
              asReviewPeerBrain({ run: `rhx review --brain \\'opus\\'` }),
            ).toEqual({ brain: null, cause: 'unreadable' });
          },
        );
      });

      when('[t2] the command is a multi-line `run: |` block', () => {
        then('a flag on a later line is still read, never a fragment', () => {
          expect(
            asReviewPeerBrain({
              run: [
                'rhx review \\',
                '  --brain opus \\',
                '  --rules a.md',
              ].join('\n'),
            }),
          ).toEqual({ brain: 'opus' });
        });
      });
    },
  );
});
