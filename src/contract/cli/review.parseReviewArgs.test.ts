import { given, then, when } from 'test-fns';

import { parseReviewArgs } from './review';

/**
 * .what = unit test for the review cli arg parser, focused on --conversation
 * .why = the guard expands $conversation to one comma-joined token; the cli must
 *        split it back into an array of filepaths, clamped here without an
 *        expensive end-to-end brain round-trip
 *
 * argv shape mirrors a real invocation: [node, entrypoint, ...flags]
 */
const asArgv = (flags: string[]): string[] => ['node', 'review.js', ...flags];

describe('parseReviewArgs', () => {
  given('[case0] a choice flag typed outside its closed set', () => {
    when('[t0] parsed', () => {
      then(
        'the value is handed back as typed, and its type claims no closed set',
        () => {
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--polluters', 'kepp']),
          );

          // the clamp lives in the type check: a parse that casts `kepp` to
          // 'drop' | 'keep' compiles this assignment, so the directive below goes unused
          // and the types gate fails (rule.forbid.as-cast)
          // @ts-expect-error — a raw argv string is no member of the closed set until checked
          const claimed: 'drop' | 'keep' = options.polluters;
          expect(claimed).toEqual('kepp');
        },
      );
    });
  });

  given('[case1] a --conversation flag with a comma-joined token', () => {
    when('[t0] parsed', () => {
      then('splits the token into an array of filepaths', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--conversation',
            '.reviews/peer/a.given.by_peer.md,.reviews/peer/a.taken.by_self.md',
          ]),
        );
        expect(options.conversation).toEqual([
          '.reviews/peer/a.given.by_peer.md',
          '.reviews/peer/a.taken.by_self.md',
        ]);
      });
    });
  });

  given('[case2] a single-file --conversation token', () => {
    when('[t0] parsed', () => {
      then('yields a one-element array', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--conversation', '.reviews/peer/x.md']),
        );
        expect(options.conversation).toEqual(['.reviews/peer/x.md']);
      });
    });
  });

  given('[case3] no --conversation flag (first iteration)', () => {
    when('[t0] parsed', () => {
      then('conversation is undefined, never an empty-string array', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.conversation).toBeUndefined();
      });
    });
  });

  given('[case4] --conversation alongside --refs', () => {
    when('[t0] parsed', () => {
      then('the two flags parse into separate arrays, no collision', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--refs',
            'refs/context.md',
            '--conversation',
            '.reviews/peer/a.md,.reviews/peer/b.md',
          ]),
        );
        expect(options.refs).toEqual(['refs/context.md']);
        expect(options.conversation).toEqual([
          '.reviews/peer/a.md',
          '.reviews/peer/b.md',
        ]);
      });
    });
  });

  given('[case5] a single --optional flag', () => {
    when('[t0] parsed', () => {
      then('accumulates the supply name into an array', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--optional', 'rules']),
        );
        expect(options.optional).toEqual(['rules']);
      });
    });
  });

  given('[case6] a repeated --optional flag', () => {
    when('[t0] parsed', () => {
      then('accumulates every supply name in order', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--optional',
            'rules',
            '--optional',
            'refs',
          ]),
        );
        expect(options.optional).toEqual(['rules', 'refs']);
      });
    });
  });

  given('[case7] no --optional flag', () => {
    when('[t0] parsed', () => {
      then('optional is undefined, never an empty array', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.optional).toBeUndefined();
      });
    });
  });

  given('[case8] a bare --optional with no supply value', () => {
    when('[t0] parsed (next token is another flag)', () => {
      then(
        'optional is a present-but-empty array (so review() can fail loud)',
        () => {
          const options = parseReviewArgs(
            asArgv(['--optional', '--rules', 'r.md']),
          );
          expect(options.optional).toEqual([]);
        },
      );
    });
  });

  given('[case9] a repeated --paths-wout flag', () => {
    when('[t0] parsed', () => {
      then('accumulates every glob, never keeps only the last', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--paths-wout',
            '*test.ts*',
            '--paths-wout',
            '**/__mocks__/**',
          ]),
        );
        expect(options.pathsWout).toEqual(['*test.ts*', '**/__mocks__/**']);
      });
    });
  });

  given('[case9b] the --partition flag', () => {
    when('[t0] repeated, one declaration per partition', () => {
      then(
        'accumulates every declaration in the order declared — the first that lists a common file grades it',
        () => {
          const options = parseReviewArgs(
            asArgv([
              '--rules',
              'r.md',
              '--partition',
              'review={src/review/**,src/domain.objects/**}',
              '--partition',
              'route={src/route/**,src/domain.objects/**}',
            ]),
          );
          expect(options.partition).toEqual([
            'review={src/review/**,src/domain.objects/**}',
            'route={src/route/**,src/domain.objects/**}',
          ]);
          expect(options.unknownFlags).toEqual([]);
        },
      );
    });

    when('[t1] absent', () => {
      then('it is undefined, so a whole review never splits', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.partition).toEqual(undefined);
      });
    });

    when('[t2] bare, its declaration forgotten', () => {
      then(
        '🔴 presence is kept as an empty array, so the caller refuses it',
        () => {
          const options = parseReviewArgs(
            asArgv(['--partition', '--rules', 'r.md']),
          );
          expect(options.partition).toEqual([]);
        },
      );
    });

    when('[t3] --mode plan', () => {
      then(
        'the mode reads plan, so the split previews and no brain runs',
        () => {
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--mode', 'plan']),
          );
          expect(options.mode).toEqual('plan');
        },
      );
    });

    when('[t4] --mode absent', () => {
      then('the mode reads apply', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.mode).toEqual('apply');
        expect(options.modeGiven).toEqual(null);
      });
    });

    when('[t5] --mode plna, a typo of plan', () => {
      then(
        'the typed value is kept, so the caller can refuse it rather than run apply',
        () => {
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--mode', 'plna']),
          );
          expect(options.modeGiven).toEqual('plna');
        },
      );
    });
  });

  given('[case10] a repeated --paths-with flag', () => {
    when('[t0] parsed', () => {
      then('accumulates every glob — symmetric with --paths-wout', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--paths-with',
            'src/**/*',
            '--paths-with',
            'blackbox/**/*',
          ]),
        );
        expect(options.pathsWith).toEqual(['src/**/*', 'blackbox/**/*']);
      });
    });
  });

  given(
    '[case10b] a repeated --rules flag, as review.by emits per rubric',
    () => {
      when('[t0] parsed', () => {
        then(
          'accumulates every rule glob, and refuses none as a repeat',
          () => {
            const options = parseReviewArgs(
              asArgv(['--rules', 'a.md', '--rules', 'b.md']),
            );
            expect(options.rules).toEqual(['a.md', 'b.md']);
            expect(options.repeatedFlags).toEqual([]);
          },
        );
      });
    },
  );

  given('[case11] the --paths-without alias', () => {
    when('[t0] parsed alone', () => {
      then('resolves onto the canonical pathsWout key', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--paths-without', '*test.ts*']),
        );
        expect(options.pathsWout).toEqual(['*test.ts*']);
      });
    });

    when('[t1] parsed beside the canonical form', () => {
      then('both accumulate into one array, in order', () => {
        const options = parseReviewArgs(
          asArgv([
            '--rules',
            'r.md',
            '--paths-wout',
            '*test.ts*',
            '--paths-without',
            '**/__mocks__/**',
          ]),
        );
        expect(options.pathsWout).toEqual(['*test.ts*', '**/__mocks__/**']);
      });
    });
  });

  given('[case11b] the --polluters mode', () => {
    when('[t0] omitted', () => {
      then('it defaults to drop — the exclusion is ON by default', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.polluters).toEqual('drop');
      });
    });

    when('[t1] given as keep', () => {
      then('it resolves to keep — the default is never a wall', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--polluters', 'keep']),
        );
        expect(options.polluters).toEqual('keep');
      });
    });

    when('[t2] given at all', () => {
      then('it is a KNOWN flag, never collected as unknown', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--polluters', 'keep']),
        );
        expect(options.unknownFlags).toEqual([]);
      });
    });

    when('[t3] given as drop, explicitly', () => {
      then('🟡 the DEFAULT is expressible, never omit-only', () => {
        // .why = every other case here either omits the flag or passes `keep`, so
        //        an allowlist of `['keep']` alone would refuse the default a driver
        //        typed out and no test would go red
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--polluters', 'drop']),
        );
        expect(options.polluters).toEqual('drop');
      });
    });

    when('[t4] given an unrecognized mode', () => {
      then(
        '🔴 it passes THROUGH unchanged — never coerced to the default',
        () => {
          // the cli refusal at `review.ts:358` compares the parsed value against
          // both modes, so a parse that coerced `keepp` to `drop` would make that
          // guard dead code and silently drop scope (rule.forbid.failhide).
          //
          // the declared return type says `'drop' | 'keep'`, a claim this parser
          // does not enforce (an `as` cast lets the guard be written). this case
          // pins the true runtime contract so a later cast tidy cannot retire it.
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--polluters', 'keepp']),
          );
          expect(options.polluters).toEqual('keepp');
          expect(options.polluters).not.toEqual('drop');
        },
      );
    });
  });

  given('[case12] no path globs at all', () => {
    when('[t0] parsed', () => {
      then('both are undefined, never an empty array', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md']));
        expect(options.pathsWith).toBeUndefined();
        expect(options.pathsWout).toBeUndefined();
      });
    });
  });

  given(
    '[case13] the real invocation every guard opens with — --skill, --repo, --mode',
    () => {
      when('[t0] parsed', () => {
        then(
          'the dispatcher flags are tolerated, never collected as unknown',
          () => {
            // clamps the i007 malfunction: every guard-run reviewer on this
            // route refused with "unrecognized flag(s): --skill, --repo,
            // --mode" the round FLAGS_KNOWN first shipped without them — a
            // regression from `rule.require.clamp-edge-cases`'s own repair
            const options = parseReviewArgs(
              asArgv([
                '--skill',
                'review',
                '--repo',
                'bhrain',
                '--mode',
                'hard',
                '--rules',
                'r.md',
              ]),
            );
            expect(options.unknownFlags).toEqual([]);
            expect(options.rules).toEqual(['r.md']);
          },
        );
      });
    },
  );

  given('[case14] the retired --warmer flag', () => {
    when('[t0] it is typed', () => {
      then('🔴 it is refused by name as unknown, never run in silence', () => {
        // the keep-warm poke was measured to lose money and was retired; a caller
        // who still types it must learn so, never get a review with no warmer
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--warmer', 'on']),
        );
        expect(options.unknownFlags).toEqual(['--warmer']);
      });
    });
  });

  given('[case15] the flag forms `review._.cost` already reads', () => {
    when('[t0] a flag is typed as --flag=value', () => {
      then('it reads as --flag value, never as an unknown flag', () => {
        const options = parseReviewArgs(
          asArgv(['--rules=r.md', '--brain=x/y', '--diffs=since-main']),
        );
        expect(options.rules).toEqual(['r.md']);
        expect(options.brain).toEqual('x/y');
        expect(options.diffs).toEqual('since-main');
        expect(options.unknownFlags).toEqual([]);
      });
    });

    when('[t1] a single-value flag is typed twice', () => {
      then('it is handed back for refusal, never run on the last', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--brain', 'a', '--brain', 'b']),
        );
        expect(options.repeatedFlags).toEqual(['--brain']);
      });

      then('a repeatable flag typed twice is not', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--refs', 'a.md', '--refs', 'b.md']),
        );
        expect(options.repeatedFlags).toEqual([]);
      });
    });

    when('[t2] a token no flag consumes is typed', () => {
      then('it is handed back as stray, never dropped', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r/*.md', 'src/foo.ts']),
        );
        expect(options.strayArgs).toEqual(['src/foo.ts']);
      });

      then(
        'an empty token, as a quoted empty var expands, is not stray',
        () => {
          const options = parseReviewArgs(
            asArgv([
              '--rules',
              'r.md',
              '--conversation',
              '',
              '--output',
              'o.md',
            ]),
          );
          expect(options.strayArgs).toEqual([]);
        },
      );
    });

    when('[t3] a short flag other than -h is typed', () => {
      then('it is refused by name as unknown', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md', '-j']));
        expect(options.unknownFlags).toEqual(['-j']);
      });
    });
  });

  given('[case-valueless] a known flag typed with no value', () => {
    when('[t0] the flag is not tolerant of absence', () => {
      then(
        '🔴 it is handed back for refusal, never read as its default',
        () => {
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--diffs', '--output', 'o.md']),
          );
          expect(options.valuelessFlags).toEqual(['diffs']);
        },
      );

      then('a valueless flag at the END of argv is handed back too', () => {
        const options = parseReviewArgs(asArgv(['--rules', 'r.md', '--brain']));
        expect(options.valuelessFlags).toEqual(['brain']);
      });
    });

    when('[t1] the flag is --conversation, as the guard spells round 1', () => {
      then(
        '🔴 it is NOT refused — `$conversation` expands empty on round 1 (F14)',
        () => {
          // the clamp that keeps round 1 of every guarded stone alive: a refusal
          // here would halt each lane before its first review
          const options = parseReviewArgs(
            asArgv(['--rules', 'r.md', '--conversation', '--output', 'o.md']),
          );
          expect(options.valuelessFlags).toEqual([]);
          expect(options.output).toEqual('o.md');
        },
      );
    });

    when('[t3] every flag carries its value', () => {
      then('none are handed back', () => {
        const options = parseReviewArgs(
          asArgv(['--rules', 'r.md', '--diffs', 'since-main']),
        );
        expect(options.valuelessFlags).toEqual([]);
      });
    });
  });
});
