import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { formatGuardParseWarnings } from './formatGuardParseWarnings';
import { getGuardParseWarnings } from './getGuardParseWarnings';
import { parseStoneGuard } from './parseStoneGuard';

/**
 * .what = parses a guard from in-memory content, as if it sat at a real path
 * .why = parseStoneGuard takes a `{ content, path }` variant, so no disk write is
 *        needed. the tmpdir is only a plausible base for @path say-ref expansion
 */
const parseGuardContent = async (content: string) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'guard-brain-'));
  return parseStoneGuard({ content, path: path.join(dir, 'x.guard') });
};

/**
 * .what = writes a guard to disk, then reads back both its parse and its advisories
 * .why = the DROP and the REPORT are two operations (a producer + renderer split, as with
 *        `getBudgetClobberWarnings` + `formatGuardUpgradeTree`), so case=4 reads both, and
 *        `getGuardParseWarnings` takes a path
 */
const readGuardWithWarns = async (content: string) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'guard-brain-'));
  const at = path.join(dir, 'x.guard');
  await fs.writeFile(at, content, 'utf-8');
  const guard = await parseStoneGuard({ path: at });
  const warnings = await getGuardParseWarnings({ path: at });
  return { guard, warnings, prose: formatGuardParseWarnings({ warnings }) };
};

describe('parseStoneGuard.brain', () => {
  given('[case1] a guard that declares no brain', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['artifacts:', '  - "*.md"'].join('\n')),
      );

      then('brain is undefined', () => {
        expect(guard.brain).toBeUndefined();
      });

      then('the extant keys still parse', () => {
        expect(guard.artifacts).toEqual(['*.md']);
      });
    });
  });

  given('[case2] a guard that declares a brain', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          ['brain: claude-opus-5[1m]', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('brain carries the value verbatim', () => {
        // .why = the value is the brain-cli's own /model argument, never a rhachet
        //        brainslug, so it is passed through unchanged (F10)
        expect(guard.brain?.choice).toEqual('claude-opus-5[1m]');
      });

      then('a key after it still parses', () => {
        // .why = the brain branch must reset currentKey, or the NEXT key's list items
        //        would land in the wrong bucket
        expect(guard.artifacts).toEqual(['*.md']);
      });
    });
  });

  given('[case3] a guard whose brain value is quoted', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(`brain: "claude-sonnet-5[1m]"`),
      );

      then('the yaml quotes are stripped', () => {
        expect(guard.brain?.choice).toEqual('claude-sonnet-5[1m]');
      });
    });
  });

  given('[case4] a guard with a BARE brain key and no value', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () => parseGuardContent('brain:'));

      then('brain stays undefined, never an empty string', () => {
        // .why = an empty parse would dispatch `/model ` — a blank argument — into the
        //        live clone. a key with no value declares no brain
        expect(guard.brain).toBeUndefined();
      });
    });
  });

  given('[case4b] a brain value that is EMPTY in every other way', () => {
    // 🔴 .why = case4 clamped ONE input on this boundary, and the boundary has four.
    //          `rule.require.clamp-edge-cases` asks for the CLASS, never the instance
    //          that happened to be tried — and the fourth row below was a live defect
    //          when this case was written, not a hypothetical
    when('[t0] the value is whitespace only', () => {
      const guard = useBeforeAll(async () => parseGuardContent('brain:    '));

      then('brain stays undefined', () => {
        expect(guard.brain).toBeUndefined();
      });
    });

    when('[t1] the value is an empty quoted string', () => {
      const guard = useBeforeAll(async () => parseGuardContent('brain: ""'));

      then('brain stays undefined', () => {
        expect(guard.brain).toBeUndefined();
      });
    });

    when('[t2] the value is whitespace INSIDE quotes', () => {
      const guard = useBeforeAll(async () => parseGuardContent('brain: "  "'));

      then('brain stays undefined', () => {
        // 🔴 .why = this arm FAILED before the repair. the parse trimmed before it
        //          stripped quotes, so the outer trim could not reach inside them and
        //          `'  '` survived as a TRUTHY value. `setStoneBrain`'s `if (!brain)`
        //          then let it through, and `/model   ` went into the live clone
        //          ⇒ the fix is a second trim AFTER the strip. this is the arm that
        //            proves it bites — remove that trim and this goes red
        expect(guard.brain).toBeUndefined();
      });
    });

    when('[t3] the value is a single quote pair around whitespace', () => {
      const guard = useBeforeAll(async () => parseGuardContent("brain: '  '"));

      then('brain stays undefined', () => {
        // .why = the strip regex admits both quote characters, so both need the clamp
        expect(guard.brain).toBeUndefined();
      });
    });
  });

  given(
    '[case4d] an EMPTY brain value, read for what the driver is TOLD',
    () => {
      /**
       * 🔴 .why = case4 and case4b prove the value is dropped. neither proves a human hears
       *          about it — and it was not told. every OTHER dropped shape warns: the
       *          `model:` alias warns, a `brian:` near-miss warns, and a KNOWN key with a
       *          blank value was silenced. so a placeholder, or a template that came back
       *          empty, ran byte-identically to a stone that never declared a brain
       *
       * ⇒ that is case=4's indistinguishability reached through the one path nobody checked,
       *   and the gap was invisible precisely because the DROP half was so well clamped
       *
       * .note = a clamp that asserts state alone can pass while the contract a human reads
       *         is broken. these asserts read the ADVISORY (`rule.require.clamp-edge-cases`)
       */
      const CASES = ['brain:', 'brain:    ', 'brain: "  "', "brain: '  '"];

      CASES.forEach((line) => {
        when(`[t0] the guard line is \`${line}\``, () => {
          const read = useBeforeAll(async () => readGuardWithWarns(line));

          then('the value is still dropped', () => {
            expect(read.guard.brain).toBeUndefined();
          });

          then('and the driver IS told, by an advisory of its own kind', () => {
            expect(read.warnings).toEqual([
              expect.objectContaining({ type: 'key-empty', key: 'brain' }),
            ]);
          });
        });
      });

      when('[t1] a BARE header key carries no inline value', () => {
        // 🔴 .why = the counter-bound, and it is what keeps the advisory off every guard in
        //          every repo. `artifacts:` is a bare header whose items sit on the lines
        //          beneath it, so an empty value there is correct syntax rather than an
        //          absent prescription (F-f, and case=10's bound one surface over)
        const read = useBeforeAll(async () =>
          readGuardWithWarns(['artifacts:', '  - "*.md"'].join('\n')),
        );

        then('no advisory is raised', () => {
          expect(read.warnings).toEqual([]);
        });

        then('and it parses exactly as before', () => {
          expect(read.guard.artifacts).toEqual(['*.md']);
        });
      });
    },
  );

  given('[case4c] a guard whose key is CASE-shifted', () => {
    /**
     * 🔴 .why = the two halves of case=4's own defense disagreed, and the gap they left
     *          was silent. `asDeclaredGuardKey` folds case, so the advisory reporter
     *          reads `Brain:` as the known key `brain` and stays quiet — correctly, since
     *          it IS known. the parse branch was case-SENSITIVE, so it refused the very
     *          key the reporter had just excused
     *
     * ⇒ `Brain: opus` set no brain AND raised no advisory: the stone ran on the inherited
     *   brain with no observation anywhere. that is the exact indistinguishability case=4
     *   exists to destroy, arrived at from inside its own fail-safe rather than around it
     *
     * .note = remove the `i` flag from the parse branch and [t0] goes red. that is what
     *         makes this a clamp rather than a restatement (`rule.require.clamp-edge-cases`)
     */
    when('[t0] the canonical key is capitalized', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(
          ['Brain: opus', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('it parses, exactly as a lowercase key would', () => {
        expect(read.guard.brain?.choice).toEqual('opus');
      });

      then('and no advisory fires, because the key IS known', () => {
        // .why = the silence is correct here, and it was the harm before. the two halves
        //        now agree that a case-variant of a known key is that key
        expect(read.warnings).toEqual([]);
      });

      then('the keys after it still parse', () => {
        expect(read.guard.artifacts).toEqual(['*.md']);
      });
    });

    when('[t1] the ALIAS is capitalized', () => {
      const read = useBeforeAll(async () => readGuardWithWarns('Model: opus'));

      then('the value is still dropped', () => {
        expect(read.guard.brain).toBeUndefined();
      });

      then('and the advisory still names the canonical key', () => {
        // .why = the reporter already folded case here, so this arm passed before the
        //        repair. it is pinned so the parse branch and the reporter stay in step
        expect(read.warnings.map((warn) => warn.key)).toEqual(['model']);
      });
    });
  });

  given('[case4e] a guard whose key is SPACED off its colon', () => {
    /**
     * 🔴 .why = the same two-halves disagreement as case4c, on a second axis, and it
     *          failed the same silent way. `brain : opus` is valid yaml — a writer who
     *          aligns a column, or an editor that formats one, produces it — and the
     *          parse branch matched `brain:` with no tolerance for the gap, so the key
     *          was refused. the advisory reporter, meanwhile, read the key as `brain`
     *          and stayed quiet because `brain` IS known
     *
     * ⇒ so the value was dropped AND excused: no brain set, no warn raised, and a stone
     *   that declared its brain ran on the inherited one with no observation anywhere
     *
     * .note = remove the `\\s*` from either half and one row below goes red. that is what
     *         parts a clamp from a restatement (`rule.require.clamp-edge-cases`)
     */
    when('[t0] the canonical key is spaced', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(
          ['brain : opus', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('it parses, exactly as a tight key would', () => {
        expect(read.guard.brain?.choice).toEqual('opus');
      });

      then('and no advisory fires, because the key IS known', () => {
        expect(read.warnings).toEqual([]);
      });

      then('the keys after it still parse', () => {
        // .why = the brain branch must reset currentKey on this shape too, or the next
        //        key's list items land in the wrong bucket
        expect(read.guard.artifacts).toEqual(['*.md']);
      });
    });

    when('[t1] the ALIAS is spaced', () => {
      const read = useBeforeAll(async () => readGuardWithWarns('model : opus'));

      then('the value is still dropped', () => {
        expect(read.guard.brain).toBeUndefined();
      });

      then('and the advisory still names the canonical key', () => {
        // 🔴 .why = the reporter must read the key as `model` through the gap too. if it
        //          read `model ` — with the space — the near-miss lookup would miss its
        //          own alias table and the one fail-safe case=4 has would go quiet
        expect(read.warnings.map((warn) => warn.key)).toEqual(['model']);
      });
    });

    when('[t2] a spaced key that is BOTH case-shifted and aliased', () => {
      // .why = the two tolerances must compose, never merely coexist. a build that
      //        folded case in one half and trimmed space in the other would pass t0 and
      //        t1 above and still drop this one
      const read = useBeforeAll(async () => readGuardWithWarns('Brain : opus'));

      then('it parses', () => {
        expect(read.guard.brain?.choice).toEqual('opus');
      });

      then('and no advisory fires', () => {
        expect(read.warnings).toEqual([]);
      });
    });
  });

  given('[case4f] a brain value that cannot be read AS A LITERAL', () => {
    /**
     * 🔴 .why = `brain: 'opus` extracts as the TRUTHY fragment `'opus` (the quote-strip needs
     *          a matched pair), so without the gate `/model 'opus` reaches the live clone —
     *          a fabricated slug, and no refusal comes back to read (F5)
     * .note = the driver-side twin of `asReviewPeerBrain`'s gate
     */
    const CASES = [
      { line: "brain: 'opus", read: "'opus" },
      { line: 'brain: opus$(cat .brain)', read: 'opus$(cat .brain)' },
    ];

    CASES.forEach((thisCase) => {
      when(`[t0] the line is \`${thisCase.line}\``, () => {
        const read = useBeforeAll(async () =>
          readGuardWithWarns(thisCase.line),
        );

        then('the value is REFUSED — brain stays undefined', () => {
          // .why = an unset brain is what `applyStoneBrainOnEntry` reads as `outcome:
          //        'none'`, so the stone keeps its inherited brain and no say is
          //        dispatched. that is the one safe outcome available: this build cannot
          //        ask the brain whether it would have taken the value (F5)
          expect(read.guard.brain).toBeUndefined();
        });

        then('and the refusal is REPORTED, never silent', () => {
          // 🔴 .why = a refusal with no advisory is the same silent drop case=4 exists to
          //          destroy, reached from a new side. the drop alone would trade a
          //          fabricated dispatch for an invisible one
          expect(read.warnings.map((warn) => warn.type)).toEqual([
            'key-unreadable',
          ]);
        });

        then('the advisory ECHOES what the file actually holds', () => {
          // 🔴 .why = an unclosed quote is invisible in a guard read at a glance —
          //          `brain: 'opus` reads as `brain: opus` to a tired eye. the echo is the
          //          one line that makes the defect legible (`rule.require.errors-name-the-fix`)
          expect(read.prose).toContain(`read: \`${thisCase.read}\``);
        });

        then('and it states that no switch went out', () => {
          // .why = the driver's next question is "did it dispatch anyway?", and a warn that
          //        leaves that open sends them to read a transcript to find out
          expect(read.prose).toContain('NO switch was dispatched');
        });
      });
    });
  });

  given('[case5] a guard that uses the `model:` alias', () => {
    when('[t0] it is parsed, and its advisories are read', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns('model: claude-opus-5[1m]'),
      );

      then('the value is DROPPED — brain stays undefined', () => {
        // .why = case=4 [t4] says the parser "drops the line, exactly as it does
        //        today", and [t6] carries the value only once the driver renames the
        //        key. a `model:` that still works is a `model:` nobody renames, and
        //        `rule.forbid.domain-term-synonyms` forbids a contract that accepts
        //        a synonym at all
        expect(read.guard.brain).toBeUndefined();
      });

      then('the producer yields STRUCTURED state, never prose', () => {
        // 🔴 .why = the repo's own split, cited by four reviewers:
        //          `getBudgetClobberWarnings` is "pure — takes two already-parsed
        //          guards and yields structured warnings; the renderer owns the
        //          prose". a test that can assert on STATE cannot be broken by a
        //          reword, which is what makes the copy safe to tune later
        expect(read.warnings).toEqual([
          {
            type: 'key-alias',
            key: 'model',
            canonical: 'brain',
            value: 'claude-opus-5[1m]',
            guard: expect.stringContaining('x.guard'),
            line: 1,
          },
        ]);
      });

      then(
        'the render names it an ALIAS, its value IGNORED, and the rename that fixes it',
        () => {
          // .why = case=4 [t5]: name the key, the file and line, and that its VALUE was
          //        ignored. never "not a key i know" (it IS a known alias), never "safe to
          //        ignore" (a `model:` left in place applies no brain; the rename is required)
          expect(read.prose).toContain(
            '`model:` reads as an alias of `brain:`, but its value was IGNORED',
          );
          expect(read.prose).toContain('rename it to `brain:`');
          expect(read.prose).toContain('its value did not take');
          expect(read.prose).not.toContain('is not a key i know');
          expect(read.prose).not.toContain('safe to ignore');
        },
      );

      then('the render names the LINE, never the file alone', () => {
        // .why = [t5] requires "the file and line". a one-line guard puts it at :1
        expect(read.prose).toContain('x.guard:1');
      });

      then('the fix it prints is runnable as written', () => {
        expect(read.prose).toContain('brain: claude-opus-5[1m]');
      });

      then('the render is a snapshot a reviewer can eyeball', () => {
        // .why = rule.require.snapshots. the assertions above verify function; this
        //        gives a visual spotcheck of the exact bytes a driver reads
        expect(read.prose).toMatchSnapshot();
      });
    });
  });

  given('[case6] a guard with a MISSPELLED known key', () => {
    when('[t0] it is parsed, and its advisories are read', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(
          ['brian: opus', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('it does NOT throw', () => {
        // .why = the parser stays permissive, for forward compat (F4, ruled by the
        //        wisher against the vision's own best-guess). a future key written by
        //        a newer template must not break an older engine
        expect(read.guard.artifacts).toEqual(['*.md']);
      });

      then('brain stays undefined — the key is still dropped', () => {
        expect(read.guard.brain).toBeUndefined();
      });

      then('the producer yields a near-miss, with the key it meant', () => {
        // .why = case=4's harm is the INDISTINGUISHABILITY, never the dropped key.
        //        `brian` is two edits from `brain`, which a future key never is — so
        //        the limit is held by the shape of the check rather than by a closed
        //        key set (case=4 [t8])
        expect(read.warnings).toEqual([
          {
            type: 'key-near-miss',
            key: 'brian',
            nearest: 'brain',
            guard: expect.stringContaining('x.guard'),
            line: 1,
          },
        ]);
      });

      then('the render says it was IGNORED, so the drop is reported', () => {
        expect(read.prose).toContain('`brian:` is not a key i know');
        expect(read.prose).toContain('did you mean: `brain:`?');
        expect(read.prose).toContain('IGNORED');
      });

      then('the render is a snapshot a reviewer can eyeball', () => {
        expect(read.prose).toMatchSnapshot();
      });
    });
  });

  given('[case6b] a guard with a FUTURE key, near no key we know', () => {
    when('[t0] it is parsed, and its advisories are read', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(
          ['cadence: weekly', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('it is dropped, exactly as today', () => {
        expect(read.guard.artifacts).toEqual(['*.md']);
      });

      then('NO advisory is yielded', () => {
        // .why = this is the half that makes the detector safe to ship under the F4
        //        verdict. a detector that warned on every unknown key would re-impose
        //        a closed key set in prose, and forward compat is the property the
        //        wisher chose to keep (case=4 [t8])
        expect(read.warnings).toEqual([]);
      });

      then('the render adds NO line at all', () => {
        // 🔴 .why = case=10's bound, one surface over. a clean guard is the
        //          overwhelmingly common case, so an empty list must render to '' —
        //          never to a header with no rows beneath it
        expect(read.prose).toEqual('');
      });
    });
  });

  given('[case6c] a guard with several dropped keys at once', () => {
    // .why = the producer returns a LIST, so a guard with two mistakes must report both.
    //        a detector that stopped at the first would leave the second to a second
    //        round — and the reader would fix one, re-run, and meet the other
    when('[t0] it is parsed, and its advisories are read', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(
          [
            'model: opus',
            'artifacts:',
            '  - "*.md"',
            'brian: sonnet',
            'cadence: weekly',
          ].join('\n'),
        ),
      );

      then(
        'every dropped known-adjacent key is reported, in file order',
        () => {
          expect(read.warnings.map((warn) => warn.key)).toEqual([
            'model',
            'brian',
          ]);
        },
      );

      then('each carries its OWN line number', () => {
        // .why = a reader opens the file at the line. one advisory that named the file
        //        alone would hand back the search the line number exists to remove
        expect(read.warnings.map((warn) => warn.line)).toEqual([1, 4]);
      });

      then('the future key is still silent', () => {
        expect(read.warnings.map((warn) => warn.key)).not.toContain('cadence');
      });

      then(
        'each advisory is its own branch, set off from the prior by a spacer',
        () => {
          // 🔴 .why = rule.require.stdout-is-treestruct. with no separator two advisories
          //          read as one with a stray sentence — and the reader fixes one key. one
          //          `🗿 guard` root holds them all; a `   │` spacer, never a blank, parts them
          const lines = read.prose.split('\n');
          const at = lines.findIndex((line) =>
            line.startsWith('   └─ `brian:` is not a key i know'),
          );
          expect(at).toBeGreaterThan(0);
          expect(lines[at - 1]).toEqual('   │');
          expect(read.prose.match(/🗿/g)).toHaveLength(1);
        },
      );

      then('the render is a snapshot a reviewer can eyeball', () => {
        expect(read.prose).toMatchSnapshot();
      });
    });
  });

  given('[case7] a NESTED brain-like key inside a peer review', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          [
            'reviews:',
            '  peer:',
            '    - slug: a-reviewer',
            '      run: rhx review --brain anthropic/claude/opus',
            '      budget: 3',
          ].join('\n'),
        ),
      );

      then('the top-level brain is untouched', () => {
        // .why = `brain:` bounds the DRIVER alone; the --brain flags on peer reviews
        //        declared by the same guard are a different scope (F12)
        expect(guard.brain).toBeUndefined();
      });

      then('the peer review parses whole', () => {
        expect(guard.reviews.peer?.[0]?.slug).toEqual('a-reviewer');
        expect(guard.reviews.peer?.[0]?.run).toContain('--brain');
      });
    });
  });

  given(
    '[case8] this route`s own 5.3.verification.guard, read from DISK',
    () => {
      when('[t0] it is parsed', () => {
        const guard = useBeforeAll(async () =>
          parseStoneGuard({
            path: '.behavior/v2026_09_09.feat-prescribed-brain-per-stone/5.3.verification.guard',
          }),
        );

        then('the declared brain is read', () => {
          // .why = case1-7 prove the BRANCH against synthetic content; this proves the
          //        branch survives a real guard — one that opens with a `provenance:`
          //        block, carries comments above the key, and holds every extant key
          expect(guard.brain?.choice).toEqual('claude-sonnet-5[1m]');
        });

        then('the keys after it still parse', () => {
          // .why = the brain branch resets currentKey. absent that, `artifacts:`'s list
          //        items would land in the brain bucket — and this is the real file, so
          //        a regression here is one a driver would actually hit
          expect(guard.artifacts).toContain('$route/5.3.verification.yield.md');
          expect(guard.reviews.self?.length).toBeGreaterThan(0);
          expect(guard.reviews.peer?.length).toBeGreaterThan(0);
        });

        then('the peer reviewers keep their own --model flags', () => {
          // .why = the F12 scope boundary, on a real file rather than a fixture. this
          //        guard declares level-3 reviewers that each carry `--model` on their
          //        run line, and those are a different scope from the driver's brain
          const enrolled = guard.reviews.peer?.filter((peer) =>
            peer.run?.includes('--model'),
          );
          expect(enrolled?.length).toBeGreaterThan(0);
        });
      });
    },
  );

  /**
   * 🔴 .what = the four declaration variants, each at its boundary
   * .why = `brain` is the one guard key with TWO shapes — an inline value, and an
   *        exploded block of sub-keys — and the two shapes are parsed by different
   *        branches that share one accumulator. so a variant proven in isolation
   *        proves naught about the pair, and the pair is what a driver writes
   *
   *        | the guard text                        | choice     | effort   |
   *        |---------------------------------------|------------|----------|
   *        | `brain: opus[1m]`                     | `opus[1m]` | `null`   |
   *        | `brain:` + `choice:` + `effort:`      | `opus[1m]` | `medium` |
   *        | `brain:` + `effort:` alone            | `null`  | `medium` |
   *        | no `brain:` key at all                | — (`brain` is undefined) |
   *
   * .note = row 3 is the one that carries weight. an effort declared with no choice
   *           makes `choice` NULLABLE while the key is present, so every consumer past
   *           the parse — the dispatch, each render, the attribution record — must hold
   *           a declared brain whose choice is absent. case1-8 above cannot reach it
   */

  given('[case9] the DEFAULT form — a bare value on the `brain:` line', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain: opus[1m]'].join('\n')),
      );

      then('the value lands on choice, and effort is null', () => {
        // .why = "default brain declaration is the choice" — the wisher, verbatim. an
        //        inline value is never read as an effort, however it is spelled
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: null });
      });
    });
  });

  given('[case10] the EXPLODED form — sub-keys beneath a bare `brain:`', () => {
    when('[t0] both axes are declared', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          ['brain:', '  choice: opus[1m]', '  effort: medium'].join('\n'),
        ),
      );

      then('both axes carry', () => {
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: 'medium' });
      });
    });

    when('[t1] the sub-keys are declared in the reverse order', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          ['brain:', '  effort: medium', '  choice: opus[1m]'].join('\n'),
        ),
      );

      then('the result is identical', () => {
        // .why = the accumulator keys by sub-key NAME, so their order on the page is
        //        a fact about the author rather than about the parse
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: 'medium' });
      });
    });

    when('[t2] a top-level key follows the block', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          [
            'brain:',
            '  choice: opus[1m]',
            '  effort: medium',
            'artifacts:',
            '  - "*.md"',
          ].join('\n'),
        ),
      );

      then('the block is shut and both axes survive', () => {
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: 'medium' });
      });

      then('the key after it parses into its OWN bucket', () => {
        // 🔴 .why = the sharp edge of the exploded form: `currentKey` stays 'brain'
        //          across the block, so a finalize that does not fire on the next
        //          top-level line would swallow `- "*.md"` into the brain scope
        expect(guard.artifacts).toEqual(['*.md']);
      });
    });

    when('[t3] the block runs to the end of the file', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '  choice: opus[1m]'].join('\n')),
      );

      then('the block is finalized anyway', () => {
        // .why = no top-level line follows, so the only finalize that can fire is the
        //        one after the loop. absent it, an exploded brain at EOF is dropped
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: null });
      });
    });

    when('[t4] blank rows and comments sit inside the block', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          [
            'brain:',
            '',
            '  # the hard stones want the deep brain',
            '  choice: opus[1m]',
            '',
            '  effort: medium',
          ].join('\n'),
        ),
      );

      then('neither shuts the block', () => {
        expect(guard.brain).toEqual({ choice: 'opus[1m]', effort: 'medium' });
      });
    });
  });

  given('[case11] the EFFORT-ONLY form — exploded, with no `choice:`', () => {
    when('[t0] it is parsed', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '  effort: medium'].join('\n')),
      );

      then('choice is NULL and effort carries', () => {
        // 🔴 .why = "if they want to change effort but not choice, then they still
        //           explode it but omit the choice" — the wisher, verbatim. so a
        //           declared brain with a null choice is LEGAL, and the dispatch
        //           sends one `/effort` say and no `/model` say at all
        expect(guard.brain).toEqual({ choice: null, effort: 'medium' });
      });
    });

    when('[t1] a top-level key follows it', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          ['brain:', '  effort: medium', 'artifacts:', '  - "*.md"'].join('\n'),
        ),
      );

      then('both scopes hold', () => {
        expect(guard.brain).toEqual({ choice: null, effort: 'medium' });
        expect(guard.artifacts).toEqual(['*.md']);
      });
    });
  });

  given('[case12] a bare `brain:` that explodes into NO known sub-key', () => {
    when('[t0] the sub-key beneath it is unknown', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(['brain:', '  temperature: 0.7'].join('\n')),
      );

      then('no brain is declared', () => {
        // .why = an unknown sub-key is not an axis, so the block is empty and the
        //        finalize declines to construct — the same outcome as a bare key
        expect(read.guard.brain).toBeUndefined();
      });

      then('the empty prescription is reported', () => {
        // 🔴 .why = this is the case=4 shape from the exploded side. a bare `brain:`
        //          is legal ONLY where it opens a populated block, so the exemption
        //          reads what FOLLOWS the key rather than the key itself
        expect(read.warnings).toHaveLength(1);
        expect(read.warnings[0]?.type).toEqual('key-empty');
        expect(read.warnings[0]?.key).toEqual('brain');
      });
    });

    when('[t1] no sub-key follows at all', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(['brain:', 'artifacts:', '  - "*.md"'].join('\n')),
      );

      then('no brain is declared, and the advisory fires', () => {
        expect(read.guard.brain).toBeUndefined();
        expect(read.warnings).toHaveLength(1);
        expect(read.warnings[0]?.type).toEqual('key-empty');
      });
    });

    when('[t2] a KNOWN sub-key follows', () => {
      const read = useBeforeAll(async () =>
        readGuardWithWarns(['brain:', '  effort: medium'].join('\n')),
      );

      then('the advisory does NOT fire', () => {
        // 🔴 .why = the false-positive half, and the reason the exemption is a
        //          lookahead rather than a blanket pass on the key. absent [t0]
        //          beside it this clamp would also pass under a blanket exemption
        expect(read.warnings).toEqual([]);
      });
    });
  });

  given('[case13] sub-key spelling folds', () => {
    when('[t0] the sub-key is capitalized', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '  Choice: opus'].join('\n')),
      );

      then('it is read', () => {
        // .why = `asBrainSubKey` lowercases, as `asDeclaredGuardKey` does one scope up.
        //        one fold rule across both scopes, so a reader learns it once
        expect(guard.brain).toEqual({ choice: 'opus', effort: null });
      });
    });

    when('[t1] a space sits before the colon', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '  effort : medium'].join('\n')),
      );

      then('it is read', () => {
        expect(guard.brain).toEqual({ choice: null, effort: 'medium' });
      });
    });

    when('[t2] the sub-key is indented deeply', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '      choice: opus'].join('\n')),
      );

      then('it is read', () => {
        // .why = the predicate is `indent > 0`, never a fixed width. the guard format
        //        has never declared a unit of indent, so a parser that demands two
        //        spaces would reject a file no rule forbids
        expect(guard.brain).toEqual({ choice: 'opus', effort: null });
      });
    });

    when('[t3] the sub-key is indented by a tab', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', '\tchoice: opus'].join('\n')),
      );

      then('it is read', () => {
        expect(guard.brain).toEqual({ choice: 'opus', effort: null });
      });
    });
  });

  given('[case14] sub-key values the parser refuses to read', () => {
    when('[t0] a value carries an unclosed quote', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(['brain:', "  choice: 'opus"].join('\n')),
      );

      then('the axis is dropped', () => {
        // 🔴 .why = the same refusal `isGuardValueLiteral` applies at the top level,
        //          applied one scope down. `'opus` would otherwise ride onto the wire
        //          as `/model 'opus`, which is the case=4 harm from a third side
        expect(guard.brain).toBeUndefined();
      });
    });

    when('[t1] a value carries a shell substitution', () => {
      const guard = useBeforeAll(async () =>
        parseGuardContent(
          ['brain:', '  choice: opus', '  effort: medium$(cat .brain)'].join(
            '\n',
          ),
        ),
      );

      then('the unreadable axis alone is dropped', () => {
        // .why = per-axis, never per-block. a refusal of one sub-key must not take a
        //        legible peer down with it, or one typo costs the whole prescription
        expect(guard.brain).toEqual({ choice: 'opus', effort: null });
      });
    });
  });
});
