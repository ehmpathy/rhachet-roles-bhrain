import { given, then, useThen, when } from 'test-fns';

import { asPromptSectionChars } from '@src/domain.operations/review/asPromptSectionChars';

/**
 * .what = a rendered review prompt, in the shape `compileReviewPrompt` emits
 * .why = the reader parses the RENDERED artifact, so a fixture must carry the
 *        real markers rather than a convenient stand-in
 */
const asPrompt = (input: {
  rules?: string;
  refs?: string;
  conversation?: string;
  diff?: string;
  file?: string;
}): string =>
  [
    '# review task',
    '',
    'you are a reviewer.',
    '',
    '## rules (FOR REFERENCE ONLY)',
    '',
    '<rules>',
    input.rules ?? 'RULEBODY',
    '</rules>',
    ...(input.refs ? ['', '<refs>', input.refs, '</refs>'] : []),
    ...(input.conversation
      ? ['', '<conversation>', input.conversation, '</conversation>']
      : []),
    '',
    '## target (REVIEW THIS SECTION ONLY)',
    '',
    '<target>',
    ...(input.diff
      ? ['<target.diff path="a.ts">', input.diff, '</target.diff>', '']
      : []),
    ...(input.file
      ? ['<target.file path="a.ts">', input.file, '</target.file>']
      : []),
    '</target>',
    '',
  ].join('\n');

/**
 * .what = the invariant every case re-asserts — the rows sum to the prompt
 * .why = the whole law of this meter: a corpus total must equal the sum of
 *        its rows. a reader that loses or double-counts a char ships a
 *        census that refutes itself.
 */
const asSummed = (input: {
  read: ReturnType<typeof asPromptSectionChars>;
}): number | null => {
  if (input.read === null) return null;
  return Object.values(input.read.sections).reduce((sum, one) => sum + one, 0);
};

/**
 * .what = unit tests for the archaeological prompt reader
 * .why = the one instrument that can attribute already-spent review tokens
 *        by input. it is pure, so it is unit-tested
 *        (rule.forbid.unit.remote-boundaries)
 */
describe('asPromptSectionChars', () => {
  given('[case1] a prompt that carries every input', () => {
    const prompt = asPrompt({
      refs: 'REFBODY',
      conversation: 'CONVOBODY',
      diff: 'DIFFBODY',
      file: 'FILEBODY',
    });

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('each named input is attributed to its own row', () => {
        const read = parsed.read;
        // each body rides with the newlines its markers wrap it in
        expect(read?.sections.rules).toEqual('\nRULEBODY\n'.length);
        expect(read?.sections.refs).toEqual('\nREFBODY\n'.length);
        expect(read?.sections.conversation).toEqual('\nCONVOBODY\n'.length);
        expect(read?.sections['targetDiffs.mutations']).toEqual(
          '\nDIFFBODY\n'.length,
        );
        expect(read?.sections.targetFiles).toEqual('\nFILEBODY\n'.length);
        expect(read?.targets).toEqual(1);
      });

      then('🔴 the rows sum to the prompt — no char is lost or doubled', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case2] a prompt with no refs and no conversation', () => {
    // the common case: a first round of a lane that supplies no reference docs
    const prompt = asPrompt({ diff: 'DIFFBODY', file: 'FILEBODY' });

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the absent inputs read as a true zero', () => {
        expect(parsed.read?.sections.refs).toEqual(0);
        expect(parsed.read?.sections.conversation).toEqual(0);
      });

      then('🔴 the rows still sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case3] a target file whose own body holds the markers', () => {
    // not hypothetical: this repo reviews `compileReviewPrompt.ts`, whose
    // source carries the literal strings `<target.file path="...">` and
    // `</target.diff>`. a scan that ran one tag to exhaustion would open a
    // block inside a span it already counted.
    const prompt = asPrompt({
      file: [
        'const render = () => {',
        '  return `<target.diff path="${p}">\\n${d}\\n</target.diff>`;',
        '};',
      ].join('\n'),
    });

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the nested markers are absorbed into their outer body', () => {
        // every char of the file body counts ONCE, to targetFiles
        expect(parsed.read?.targets).toEqual(1);
        expect(parsed.read?.sections['targetDiffs.mutations']).toEqual(0);
      });

      then('🔴 the rows sum to the prompt — never past it', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case4] a RULE whose body quotes the target markers', () => {
    // the same defect from the other side: a rubric that documents the prompt
    // format. the rules block is taken first, so its quoted markers are absorbed
    const prompt = asPrompt({
      rules: 'never flag a `<target.file path="x">` block from <rules>.',
      file: 'FILEBODY',
    });

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the quoted marker does not open a target file', () => {
        expect(parsed.read?.targets).toEqual(1);
      });

      then('🔴 the rows sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case5] a prompt that carries no rubric marker', () => {
    // the failhide this forbids: a format drift or a truncated write would
    // otherwise report a prompt with no rules — a measurement nobody made.
    when('[t0] the inputs are read', () => {
      then('it answers ABSENT, never a zeroed row', () => {
        expect(
          asPromptSectionChars({
            prompt: '# review task\n<target>\nx\n</target>',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case6] a prompt that carries no target marker', () => {
    when('[t0] the inputs are read', () => {
      then('it answers ABSENT — not a review prompt this reader knows', () => {
        expect(
          asPromptSectionChars({
            prompt: '# review task\n<rules>\nx\n</rules>',
          }),
        ).toEqual(null);
      });
    });
  });

  given('[case7] a prompt truncated mid-target', () => {
    // a run killed while it wrote its artifacts. the open tag is there, the
    // close tag never arrived — the body must count zero, never run to eof
    const prompt = [
      '<rules>',
      'r',
      '</rules>',
      '<target>',
      't',
      '</target>',
      '<target.file path="a.ts">',
      'body with no close',
    ].join('\n');

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the unclosed block contributes no chars', () => {
        expect(parsed.read?.sections.targetFiles).toEqual(0);
        expect(parsed.read?.targets).toEqual(0);
      });

      then('🔴 the rows still sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case8] a prompt with several targets', () => {
    const prompt = [
      '<rules>',
      'r',
      '</rules>',
      '<target>',
      '<target.diff path="a.ts">',
      'DA',
      '</target.diff>',
      '<target.file path="a.ts">',
      'FA',
      '</target.file>',
      '<target.diff path="b.ts">',
      'DB',
      '</target.diff>',
      '<target.file path="b.ts">',
      'FB',
      '</target.file>',
      '</target>',
    ].join('\n');

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('every occurrence is summed, and the targets counted', () => {
        const read = parsed.read;
        expect(read?.sections['targetDiffs.mutations']).toEqual(
          '\nDA\n'.length * 2,
        );
        expect(read?.sections.targetFiles).toEqual('\nFA\n'.length * 2);
        expect(read?.targets).toEqual(2);
      });

      then('🔴 the rows sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case9] a deleted target, rendered as a void tag, between two', () => {
    // the defect this clamps: the opener regex once matched `… />` as an
    // open tag, then hunted forward for the next target's close and
    // absorbed that whole block into the deleted marker's body.
    const prompt = [
      '<rules>',
      'R',
      '</rules>',
      '<target>',
      '<target.file path="a.ts">',
      'FA',
      '</target.file>',
      '<target.file path="gone.ts" change="deleted" />',
      '<target.file path="b.ts">',
      'FB',
      '</target.file>',
      '</target>',
    ].join('\n');

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the void tag carries no body, and each real target its own', () => {
        expect(parsed.read?.sections.targetFiles).toEqual('\nFA\n'.length * 2);
      });

      then('the deleted target still counts as a target', () => {
        expect(parsed.read?.targets).toEqual(3);
      });

      then('🔴 the rows sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given('[case10] a target body that holds the close tag inline', () => {
    // the defect this clamps: `asTargetSection.ts` holds the literal text
    // `\n</target.file>` inside a template, so a first-match close would cut
    // the real body short at that literal.
    const body = 'const x = `<target.file>\\n${y}\\n</target.file>`;';
    const prompt = [
      '<rules>',
      'R',
      '</rules>',
      '<target>',
      '<target.file path="asTargetSection.ts">',
      body,
      '</target.file>',
      '</target>',
    ].join('\n');

    when('[t0] the inputs are read', () => {
      const parsed = useThen('it parses', () => ({
        read: asPromptSectionChars({ prompt }),
      }));

      then('the whole body is attributed to its target', () => {
        expect(parsed.read?.sections.targetFiles).toEqual(`\n${body}\n`.length);
      });

      then('🔴 the rows sum to the prompt', () => {
        expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
      });
    });
  });

  given(
    '[case11] the LOCUS — mass attributed to the place it came from',
    () => {
      // the gap this closes: the census names the KIND of input (`targetFiles is
      // 87.6% of 1.0M chars`) and withholds the PLACE, so it cannot part mass a
      // lane needs from mass a glob swept in, and a reader who wants to prune has
      // a total with no address
      // (rule.require.report-both-cost-levers-with-trend-and-locus)
      const prompt = [
        '<rules>',
        'RULEBODY',
        '</rules>',
        '<target>',
        '<target.file path="src/deep/one.ts">',
        'AAAA',
        '</target.file>',
        '',
        '<target.file path="src/deep/two.ts">',
        'BB',
        '</target.file>',
        '',
        '<target.diff path="src/deep/one.ts">',
        'DDD',
        '</target.diff>',
        '</target>',
      ].join('\n');

      when('[t0] the inputs are read', () => {
        const read = asPromptSectionChars({ prompt });

        then('every target path gets one entry, never one per block', () => {
          // a file and its diff share a path, so they share a row — the diff's
          // chars are mass that the SAME path brought in
          expect(read?.locus.map((one) => one.path).sort()).toEqual([
            'src/deep/one.ts',
            'src/deep/two.ts',
          ]);
        });

        then('a path`s file body and diff body SUM onto its row', () => {
          const one = read?.locus.find((l) => l.path === 'src/deep/one.ts');
          // `\nAAAA\n` (6) + `\nDDD\n` (5) — body chars, as the sections row counts
          expect(one?.chars).toEqual('\nAAAA\n'.length + '\nDDD\n'.length);
        });

        then('🔴 the locus never exceeds the two target section rows', () => {
          // the locus is folded off the SAME walk as `sections`, so its total is
          // exactly the target mass — a second scan would have double-counted the
          // nested markers and silently overstated a directory
          const locus = (read?.locus ?? []).reduce((s, l) => s + l.chars, 0);
          expect(locus).toEqual(
            (read?.sections.targetFiles ?? 0) +
              (read?.sections['targetDiffs.mutations'] ?? 0),
          );
        });

        then('🔴 the rows still sum to the prompt', () => {
          // the locus is additive — it must not perturb the census it rides beside
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case12] a PATH-LESS opener whose body quotes a path attribute',
    () => {
      // the one shape where "read the opener" and "read the whole block" DIVERGE,
      // and the reason this clamp is shaped this way rather than the obvious way.
      //
      // 🔴 the obvious fixture — a path-BEARING opener whose body quotes a second
      //    path — is green under both implementations, because the extraction regex
      //    is not `g` and an opener always precedes its own body. that draft was
      //    written first, ran green against the naive implementation, and proved
      //    naught (rule.require.clamp-edge-cases: a clamp must be seen to fail).
      //
      // with no path on the opener, a whole-block scan reaches into the body and
      // mints a row for a directory that contributed no chars — and this reader is
      // archaeological, so a path-less opener is a shape it must survive rather
      // than one it may assume away.
      const body = 'const tag = `<target.file path="src/OTHER/victim.ts">`;';
      const prompt = [
        '<rules>',
        'R',
        '</rules>',
        '<target>',
        '<target.file>',
        body,
        '</target.file>',
        '</target>',
      ].join('\n');

      when('[t0] the inputs are read', () => {
        const read = asPromptSectionChars({ prompt });

        then('🔴 no row is minted for the path the body merely QUOTED', () => {
          expect(read?.locus.some((one) => one.path.includes('OTHER'))).toEqual(
            false,
          );
          expect(read?.locus).toEqual([]);
        });

        then('the block`s chars still reach the census, unattributed', () => {
          // the mass is real and the ADDRESS is unknown. it must still be counted —
          // a locus that cannot place a char must not also lose it
          expect(read?.sections.targetFiles).toEqual(`\n${body}\n`.length);
          expect(read?.targets).toEqual(1);
        });

        then('🔴 the rows still sum to the prompt', () => {
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case13] a PULL-focus prompt — targets, and no payload to attribute',
    () => {
      // under `--focus pull` the renderer sends a path LIST and no blocks, so
      // there is real target scope and no per-target mass. the locus must be
      // EMPTY rather than absent, and a renderer must say which of the two it met
      // rather than report `0 directories` for both
      // (hazard.a-status-read-cannot-report-absence)
      const prompt = [
        '<rules>',
        'R',
        '</rules>',
        '<target>',
        // verbatim from `asPullTargetSection` — its copy is byte-pinned, so the
        // fixture must carry it unreworded
        'the following files are in scope for review:',
        '',
        '- src/deep/one.ts',
        '- src/deep/two.ts',
        '</target>',
      ].join('\n');

      when('[t0] the inputs are read', () => {
        const parsed = useThen('it parses', () => ({
          read: asPromptSectionChars({ prompt }),
        }));

        then('it reads, and reports an empty locus rather than null', () => {
          const read = parsed.read;
          expect(read).not.toEqual(null);
          expect(read?.locus).toEqual([]);
          // and the path list is still real prompt mass, held by the residual
          expect(read?.sections.targetFiles).toEqual(0);
        });

        then('🔴 the rows still sum to the prompt', () => {
          expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case14] the residual GRADE — an input with no row is visible, never absorbed',
    () => {
      // the head the compiler emits: preamble, output contract, then the rubric header
      const asHeadedPrompt = (input: { unmapped: string }): string =>
        [
          '# review task',
          '',
          'you are a reviewer.',
          '',
          '## output format',
          '',
          'emit N blockers and N nitpicks.',
          '',
          '## rules (FOR REFERENCE ONLY)',
          '',
          '<rules>',
          'R'.repeat(4_000),
          '</rules>',
          input.unmapped,
          '',
          '<target>',
          '<target.file path="a.ts">',
          'F'.repeat(20_000),
          '</target.file>',
          '</target>',
          '',
        ].join('\n');

      when('[t0] every input has its own block', () => {
        then('the residual is graded attributed', () => {
          const read = asPromptSectionChars({
            prompt: asHeadedPrompt({ unmapped: '' }),
          });
          expect(read?.attribution).toEqual('attributed');
        });
      });

      when('[t1] an input enters under a tag no row names', () => {
        // 🔴 the sum stays exact either way — `scaffold` absorbs the block. the
        // grade is the only signal that tells this prompt apart from [t0]
        const prompt = asHeadedPrompt({
          unmapped: ['<skills>', 'S'.repeat(8_000), '</skills>'].join('\n'),
        });
        const parsed = useThen('it parses', () => ({
          read: asPromptSectionChars({ prompt }),
        }));

        then('the residual is graded UNATTRIBUTED', () => {
          expect(parsed.read?.attribution).toEqual('unattributed');
        });

        then('🔴 the rows still sum to the prompt', () => {
          expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
        });
      });

      when(
        '[t6] 🔴 a SMALL input enters under a tag no row names — below the mass floor',
        () => {
          // the share test alone vouches for this: a few chars sit far under the floor.
          // the gap hunt names the tag, so the grade cannot vouch for an absorbed block
          const prompt = asHeadedPrompt({
            unmapped: ['<skills>', 'S', '</skills>'].join('\n'),
          });
          const parsed = useThen('it parses', () => ({
            read: asPromptSectionChars({ prompt }),
          }));

          then('the residual is graded UNATTRIBUTED', () => {
            expect(parsed.read?.attribution).toEqual('unattributed');
          });

          then('🔴 the rows still sum to the prompt', () => {
            expect(asSummed({ read: parsed.read })).toEqual(prompt.length);
          });
        },
      );

      when('[t2] the head carries the instructions as named blocks', () => {
        // a long preamble is NAMED input (instructions), never markup — so it must
        // not tip the grade, even where it dwarfs the bound
        const prompt = asHeadedPrompt({ unmapped: '' }).replace(
          'you are a reviewer.',
          'you are a reviewer. '.repeat(1_000),
        );

        then(
          'the preamble is cut out by name, and the grade stays attributed',
          () => {
            expect(asPromptSectionChars({ prompt })?.attribution).toEqual(
              'attributed',
            );
          },
        );
      });

      when(
        '[t4] 🔴 the instructions name the blocks by their literal tags',
        () => {
          // the compiler's preamble does exactly this: it tells the reviewer never to
          // flag the <rules> section, and its diff howto shows a `<target.diff …>` tag
          const prompt = asHeadedPrompt({ unmapped: '' }).replace(
            'you are a reviewer.',
            [
              'you are a reviewer. never flag the <rules> section.',
              'a delta reads `<target.diff path="x.ts">` in the target.',
            ].join('\n'),
          );
          const read = asPromptSectionChars({ prompt });

          then('the rubric row holds the rubric body alone', () => {
            expect(read?.sections.rules).toEqual(
              `\n${'R'.repeat(4_000)}\n`.length,
            );
          });

          then('no diff row is minted from the prose', () => {
            expect(read?.sections['targetDiffs.mutations']).toEqual(0);
          });

          then('the head is graded, never left ungraded', () => {
            expect(read?.attribution).toEqual('attributed');
          });

          then('🔴 the rows still sum to the prompt', () => {
            expect(asSummed({ read })).toEqual(prompt.length);
          });
        },
      );

      when('[t3] the head carries no markers to cut at', () => {
        const prompt = asPrompt({ file: 'F' });
        const read = asPromptSectionChars({ prompt });

        then('the grade is null — the reader declines to vouch', () => {
          expect(read).not.toBeNull();
          expect(read?.attribution).toBeNull();
        });

        then(
          'both named head rows read 0, so their chars stay in scaffold',
          () => {
            expect(read?.sections.instructions).toEqual(0);
            expect(read?.sections.outputFormat).toEqual(0);
          },
        );

        then('🔴 the rows still sum to the prompt', () => {
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });

      when('[t5] 🔴 the head carries both markers', () => {
        const prompt = asHeadedPrompt({ unmapped: '' });
        const read = asPromptSectionChars({ prompt });
        const atOutputFormat = prompt.indexOf('## output format');
        const atRules = prompt.indexOf('## rules', atOutputFormat);

        then(
          'the instructions row is the head ahead of the output contract',
          () => {
            expect(read?.sections.instructions).toEqual(
              '# review task\n\nyou are a reviewer.\n\n'.length,
            );
            expect(read?.sections.instructions).toEqual(atOutputFormat);
          },
        );

        then(
          'the outputFormat row runs from its header to the rubric header',
          () => {
            expect(read?.sections.outputFormat).toEqual(
              '## output format\n\nemit N blockers and N nitpicks.\n\n'.length,
            );
            expect(read?.sections.outputFormat).toEqual(
              atRules - atOutputFormat,
            );
          },
        );

        then('scaffold holds only the markup left over', () => {
          expect(read?.sections.scaffold).toBeLessThan(200);
        });

        then('🔴 the rows still sum to the prompt', () => {
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case15] a diff group with an addition, a deletion, and a mutation',
    () => {
      const prompt = [
        '<rules>',
        'R',
        '</rules>',
        '<target>',
        '<target.file path="edited.ts">',
        'EDITED',
        '</target.file>',
        '',
        '<target.diff path="new.ts" kind="+">',
        'NEWBODY',
        '</target.diff>',
        '<target.diff path="gone.ts" kind="-" />',
        '<target.diff path="edited.ts" kind="~">',
        'HUNK',
        '</target.diff>',
        '</target>',
      ].join('\n');

      when('[t0] the inputs are read', () => {
        const read = asPromptSectionChars({ prompt });

        then('🔴 each diff kind lands in its own row', () => {
          expect(read?.sections['targetDiffs.additions']).toEqual(
            '\nNEWBODY\n'.length,
          );
          expect(read?.sections['targetDiffs.deletions']).toEqual(0);
          expect(read?.sections['targetDiffs.mutations']).toEqual(
            '\nHUNK\n'.length,
          );
          expect(read?.sections.targetFiles).toEqual('\nEDITED\n'.length);
        });

        then(
          'an addition and a deletion each count a target; a mutation does not',
          () => {
            // edited.ts counts once, via its file row
            expect(read?.targets).toEqual(3);
          },
        );

        then('🔴 the rows sum to the prompt', () => {
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case16] an archived diff group in the prior word form, `change="added"` / `change="deleted"`',
    () => {
      const prompt = [
        '<rules>',
        'R',
        '</rules>',
        '<target>',
        '<target.diff path="new.ts" change="added">',
        'NEWBODY',
        '</target.diff>',
        '<target.diff path="gone.ts" change="deleted" />',
        '<target.diff path="edited.ts">',
        'HUNK',
        '</target.diff>',
        '</target>',
      ].join('\n');

      when('[t0] the inputs are read', () => {
        const read = asPromptSectionChars({ prompt });

        then(
          '🔴 each diff still lands in the row of its kind, as it was sent',
          () => {
            expect(read?.sections['targetDiffs.additions']).toEqual(
              '\nNEWBODY\n'.length,
            );
            expect(read?.sections['targetDiffs.deletions']).toEqual(0);
            expect(read?.sections['targetDiffs.mutations']).toEqual(
              '\nHUNK\n'.length,
            );
          },
        );

        then('🔴 the rows sum to the prompt', () => {
          expect(asSummed({ read })).toEqual(prompt.length);
        });
      });
    },
  );

  given(
    '[case17] a prompt with many targets behind tags that open only once',
    () => {
      // `<rules>`, `<refs>`, `<conversation>` each open once, ahead of 400 targets.
      // a walk that re-hunts every tag per block searches the rest of the prompt
      // for those three, once per later block — O(blocks × prompt), which was most
      // of a grove meter's wall time over legacy runs
      const count = 400;
      const prompt = [
        '## rules (FOR REFERENCE ONLY)',
        '<rules>',
        'R',
        '</rules>',
        '<refs>',
        'F',
        '</refs>',
        '<conversation>',
        'C',
        '</conversation>',
        '<target>',
        ...Array.from({ length: count }, (_, at) => [
          `<target.diff path="f${at}.ts">`,
          'HUNK',
          '</target.diff>',
          `<target.file path="f${at}.ts">`,
          'BODY',
          '</target.file>',
        ]).flat(),
        '</target>',
      ].join('\n');

      when(
        '[t0] the inputs are read, with each opener hunt that found none counted',
        () => {
          const scan = useThen('it parses', () => {
            // an opener regex is `<tag(?:\s[^>]*)?>`; a hunt that answers null has
            // scanned to the END of the prompt, so the count of those hunts is the
            // count of full-prompt scans the walk paid for
            const isOpenerHunt = (regex: RegExp): boolean =>
              regex.source.startsWith('<') && !regex.source.startsWith('<\\/?');
            const execOriginal = RegExp.prototype.exec;
            const spy = jest
              .spyOn(RegExp.prototype, 'exec')
              .mockImplementation(function (this: RegExp, text: string) {
                return execOriginal.call(this, text);
              });
            try {
              const read = asPromptSectionChars({ prompt });
              const misses = spy.mock.instances
                .map((regex, at) => ({ regex, result: spy.mock.results[at] }))
                .filter(
                  (one) =>
                    isOpenerHunt(one.regex as unknown as RegExp) && // jest types each instance as the mocked fn's `this`, which is the regex
                    one.result?.value === null,
                ).length;
              return { read, misses };
            } finally {
              spy.mockRestore();
            }
          });

          then('every target is still read', () => {
            expect(scan.read?.targets).toEqual(count);
            expect(asSummed({ read: scan.read })).toEqual(prompt.length);
          });

          then(
            '🔴 a tag that found no further opener is never hunted again',
            () => {
              // at most one miss per distinct tag, never one per block
              expect(scan.misses).toBeLessThanOrEqual(5);
            },
          );
        },
      );
    },
  );
});
