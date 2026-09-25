import * as path from 'path';
import { given, then, when } from 'test-fns';

import {
  getGuardPeerReviews,
  getGuardSelfReviews,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import { parseStoneGuard } from './parseStoneGuard';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('parseStoneGuard', () => {
  given('[case1] a guard file with artifacts and judges (no reviews)', () => {
    const guardPath = path.join(ASSETS_DIR, 'route.guarded', '1.vision.guard');

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with artifacts and judges', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('$route/1.vision*.md');
        expect(getGuardPeerReviews(result)).toHaveLength(0);
        expect(result.judges).toHaveLength(1);
      });
    });
  });

  given('[case2] a guard file with flat reviews array', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.guarded',
      '5.implement.guard',
    );

    when('[t0] guard is parsed', () => {
      then(
        'returns RouteStoneGuard with reviews converted to structured',
        async () => {
          const result = await parseStoneGuard({ path: guardPath });
          expect(result.path).toEqual(guardPath);
          expect(result.artifacts).toContain('src/**/*'); // matches repo root src/
          // flat reviews are converted to structured at parse time
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(1);
          expect(peerReviews[0]?.slug).toBeDefined();
          expect(peerReviews[0]?.run).toBeDefined();
          expect(getGuardSelfReviews(result)).toHaveLength(0);
          expect(result.judges).toHaveLength(2);
        },
      );
    });
  });

  given('[case3] a guard file with structured reviews (self + peer)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.review.self',
      '1.vision.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with structured reviews', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('$route/1.vision*.md');
        // all reviews are structured at parse time
        expect(result.reviews.self).toBeDefined();
        expect(result.reviews.peer).toBeDefined();
      });

      then('self reviews are parsed with multiline say', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const selfReviews = getGuardSelfReviews(result);
        expect(selfReviews).toHaveLength(2);
        expect(selfReviews[0]?.slug).toEqual('all-done');
        expect(selfReviews[0]?.say).toContain(
          'did you complete all that was requested',
        );
      });

      then('self reviews with @path reference are expanded', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const selfReviews = getGuardSelfReviews(result);
        expect(selfReviews[1]?.slug).toEqual('tests-pass');
        expect(selfReviews[1]?.say).toContain('do all tests pass');
      });

      then('peer reviews are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        expect(peerReviews).toHaveLength(1);
        expect(peerReviews[0]?.run).toContain('rhx review');
      });

      then('judges are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.judges).toHaveLength(2);
      });
    });
  });

  given('[case4] a guard file with flat reviews (backwards compat)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.review.self',
      '2.research.guard',
    );

    when('[t0] guard is parsed', () => {
      then(
        'returns RouteStoneGuard with flat reviews converted to structured',
        async () => {
          const result = await parseStoneGuard({ path: guardPath });
          // flat reviews are converted to structured at parse time
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(1);
          expect(peerReviews[0]?.slug).toBeDefined();
          expect(peerReviews[0]?.run).toBeDefined();
          expect(getGuardSelfReviews(result)).toHaveLength(0);
        },
      );
    });
  });

  given('[case5] a guard file with protect directive', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.protected',
      '3.blueprint.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with protect globs', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.protect).toHaveLength(2);
        expect(result.protect).toContain('src/**/*.ts');
        expect(result.protect).toContain('src/**/*.tsx');
      });
    });
  });

  given('[case6] a guard file without protect directive', () => {
    const guardPath = path.join(ASSETS_DIR, 'route.guarded', '1.vision.guard');

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with empty protect array', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.protect).toEqual([]);
      });
    });
  });

  given('[case7] a guard file with structured peer reviews (timeout)', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.peer.timeout',
      '1.vision.guard',
    );

    when('[t0] guard is parsed', () => {
      then('peer reviews with quoted timeout are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const quickReview = peerReviews.find(
          (r) => r.slug === 'quick-with-quotes',
        );

        expect(quickReview).toBeDefined();
        expect(quickReview!.timeout).toEqual('PT30S');
      });

      then('peer reviews with unquoted timeout are parsed', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const slowReview = peerReviews.find(
          (r) => r.slug === 'slow-without-quotes',
        );

        expect(slowReview).toBeDefined();
        expect(slowReview!.timeout).toEqual('PT90S');
      });

      then('peer reviews without timeout have undefined', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        const peerReviews = getGuardPeerReviews(result);
        const defaultReview = peerReviews.find(
          (r) => r.slug === 'default-timeout',
        );

        expect(defaultReview).toBeDefined();
        expect(defaultReview!.timeout).toBeUndefined();
      });
    });
  });

  given(
    '[case8] a guard file with structured peer reviews (budget + level)',
    () => {
      const guardPath = path.join(
        ASSETS_DIR,
        'route.peer.budget',
        '1.vision.guard',
      );

      when('[t0] guard is parsed', () => {
        then('returns RouteStoneGuard with structured reviews', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          expect(result.path).toEqual(guardPath);
          // all reviews are structured at parse time
          expect(result.reviews.self).toBeDefined();
          expect(result.reviews.peer).toBeDefined();
        });

        then('peer reviews are parsed with structured format', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          expect(peerReviews).toHaveLength(3);

          // all peer reviews have slug, run, budget, level
          expect(peerReviews.every((r) => r.slug && r.run)).toBe(true);
        });

        then('primo peer review has correct budget and level', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          const primo = peerReviews.find((r) => r.slug === 'primo');

          expect(primo).toBeDefined();
          expect(primo!.slug).toEqual('primo');
          expect(primo!.run).toContain('rhx review');
          expect(primo!.run).toContain('--brain opus');
          expect(primo!.budget).toEqual(3);
          expect(primo!.level).toEqual(2);
        });

        then('cheapo peer review has correct budget and level', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const peerReviews = getGuardPeerReviews(result);
          const cheapo = peerReviews.find((r) => r.slug === 'cheapo');

          expect(cheapo).toBeDefined();
          expect(cheapo!.slug).toEqual('cheapo');
          expect(cheapo!.budget).toEqual(10);
          expect(cheapo!.level).toEqual(1);
        });

        then('self reviews are parsed alongside structured peer', async () => {
          const result = await parseStoneGuard({ path: guardPath });
          const selfReviews = getGuardSelfReviews(result);
          expect(selfReviews).toHaveLength(1);
          expect(selfReviews[0]?.slug).toEqual('all-done');
        });
      });
    },
  );

  given(
    '[case-provenance-tolerated] a guard that declares a top-level provenance key',
    () => {
      // characterization (i012.N5): parseSimpleYaml already skips unrecognized
      // top-level keys, so a `provenance:` block needs no tolerate-branch. this
      // locks that a provenance-tagged guard parses cleanly today. pure unit —
      // the { content } variant needs no disk (no @path refs to expand).
      const content = `provenance:
  uri: node_modules/rhachet-roles-bhuild/dist/x/5.1.execution.guard
artifacts:
  - $route/5.1.execution*.md
judges:
  - rhx judge --mechanism reviewed?
`;

      when('[t0] guard is parsed via the { content } variant', () => {
        then(
          'parses WITHOUT a throw (unknown top-level key is skipped)',
          async () => {
            const result = await parseStoneGuard({
              content,
              path: '/synthetic/5.1.execution.guard',
            });
            // the known keys still parse; the provenance key is simply ignored here
            expect(result.artifacts).toContain('$route/5.1.execution*.md');
            expect(result.judges).toHaveLength(1);
          },
        );
      });
    },
  );

  given('[case9] a guard that declares a concurrency group', () => {
    const content = `artifacts:
  - $route/1.vision*.md
reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      level: 1
      group: anthropic
    - slug: beta-checker
      run: rhx review --rules b.md
      budget: 5
      level: 1
      group: anthropic
  groups:
    anthropic:
      concurrency: 10
`;

    when('[t0] the guard is parsed', () => {
      then('membership lands on the reviewer', async () => {
        const result = await parseStoneGuard({
          content,
          path: '/synthetic/1.vision.guard',
        });
        const peers = getGuardPeerReviews(result);
        expect(peers).toHaveLength(2);
        expect(peers[0]?.group).toEqual('anthropic');
        expect(peers[1]?.group).toEqual('anthropic');
      });

      then('the bound lands on the group, never on a member', async () => {
        const result = await parseStoneGuard({
          content,
          path: '/synthetic/1.vision.guard',
        });
        expect(result.reviews.groups).toEqual({
          anthropic: { concurrency: 10 },
        });
        // a bound is a cardinality of the SET; no member carries a number
        const peers = getGuardPeerReviews(result);
        expect(peers[0]).not.toHaveProperty('concurrency');
      });
    });
  });

  given('[case10] a guard with NO groups key — every extant guard', () => {
    const content = `artifacts:
  - $route/1.vision*.md
reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      level: 1
`;

    when('[t0] the guard is parsed', () => {
      then('it parses without error; the key is additive', async () => {
        const result = await parseStoneGuard({
          content,
          path: '/synthetic/1.vision.guard',
        });
        expect(getGuardPeerReviews(result)).toHaveLength(1);
        expect(result.reviews.groups).toBeUndefined();
        expect(getGuardPeerReviews(result)[0]?.group).toBeUndefined();
      });
    });
  });

  given('[case11] a groups entry declared TWICE — the values MATCH', () => {
    const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: 10
    anthropic:
      concurrency: 10
`;

    when('[t0] the guard is parsed', () => {
      then('it is REFUSED at parse, though the values agree', async () => {
        // .why = two declarations of one fact is an ambiguity whichever way it
        //        is settled. a silent last-wins teaches that duplicates are
        //        fine, and the next duplicate will disagree
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/declared twice/);
      });
    });
  });

  given('[case12] a reviewer names a group with no bound declared', () => {
    const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropc
  groups:
    anthropic:
      concurrency: 10
`;

    when('[t0] the guard is parsed', () => {
      then('the typo is REFUSED at parse', async () => {
        // .why = without this the guard parses clean, the level fans out
        //        uncapped, and the author's own file reads back as though it
        //        capped. a safety valve that fails open is worse than none
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/no bound declared/);
      });

      then('the refusal names the REVIEWER, never only the group', async () => {
        // 🔴 .why = the fix is per-reviewer, so the slug is where an author
        //    must go. the message named only the group, and on a guard where
        //    several reviewers share one typo the author had to hunt each site
        //    (`rule.require.errors-name-the-fix`). raised i032/r10
        //
        // ✅ .teeth = revert to `undeclared.join(', ')` and this goes red while
        //     the assertion above stays green — the refusal still fires, it
        //     merely stops to say WHERE
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/alpha-checker → anthropc/);
      });
    });
  });

  given('[case13] a group declared that no reviewer joins — a phantom', () => {
    const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: 10
    openai:
      concurrency: 2
`;

    when('[t0] the guard is parsed', () => {
      then('the memberless group is REFUSED at parse', async () => {
        // .why = it bounds no reviewer, so its cap is inert — while the author
        //        reads their declaration back and counts it as a cap
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/no members/);
      });
    });
  });

  given('[case14] a bound that is not a positive integer', () => {
    when('[t0] the bound is zero', () => {
      then('it is REFUSED at parse', async () => {
        // .why = a level bounded at zero never pours, so it halts forever
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: 0
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/positive integer/);
      });
    });

    when('[t1] the bound is not a number at all', () => {
      then('it is REFUSED at parse', async () => {
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: lots
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/positive integer/);
      });
    });

    when('[t2] the bound is NEGATIVE', () => {
      then('it is REFUSED at parse', async () => {
        // 🔴 .why = the code's own `.why` names this case verbatim —
        //           *"`concurrency: -1` carries no sense"* — and no test
        //           witnessed it. a reason that sits beside correct code is
        //           not a clamp on it; only a case that would go red is
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: -1
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/positive integer/);
      });
    });

    when('[t3] the bound is FRACTIONAL', () => {
      then('it is REFUSED rather than truncated to 2', async () => {
        // 🔴 .why = the boundary is "a positive integer", and `parseInt` reads a
        //           PREFIX — so a check on its answer would call `2.5` valid and
        //           silently bind the level at 2. the author declared a bound
        //           they did not get, and no line of output says so.
        //
        //           ⇒ `rule.require.clamp-edge-cases`: clamp the BOUNDARY, never
        //             only the values observed to cross it. `0` and `lots` were
        //             clamped; `-1` and `2.5` are the same boundary, unwitnessed
        //
        // ✅ .proven = the check is `/^[0-9]+$/.test(raw) || parseInt(raw, 10) < 1` —
        //             a raw-text regex that rejects any char outside 0-9 (catches `2.5`,
        //             `1e3`, `-1`, `abc`) combined with a `< 1` floor.
        //             `[t3]` and `[t4]` went red and the other 31 stayed green,
        //             `[t2]` among them — so the NEGATIVE case was already
        //             refused and its test is a WITNESS, where these two are a
        //             REPAIR. worth the distinction: only these two changed
        //             behavior, and only they can prove they did
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: 2.5
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/positive integer/);
      });
    });

    when('[t4] the bound is an integer PREFIX of a wider literal', () => {
      then('it is REFUSED rather than read as its prefix', async () => {
        // .why = `parseInt('1e3')` is 1, so a bound of one thousand would bind
        //        at one — the widest possible miss, in the direction that hurts
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      group: anthropic
  groups:
    anthropic:
      concurrency: 1e3
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/positive integer/);
      });
    });
  });

  given('[case15] a bound written on the REVIEWER, not on the group', () => {
    when('[t0] a reviewer carries `concurrency:`', () => {
      then('it is REFUSED at parse', async () => {
        // 🔴 .why = the ONE refusal that protects the wish's second outcome. every
        //           other case here guards against an author who declares too much;
        //           this guards against a valve that is SILENTLY ABSENT.
        //
        //           `parseStoneGuard` reads six peer keys and had no `else`, so this
        //           line parsed clean and capped naught — the author believes they
        //           bounded a level, and it fans out. a valve that fails OPEN is
        //           worse than an absent one, because it reports success
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      concurrency: 2
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/cannot be declared on a reviewer/);
      });
    });

    when('[t1] a reviewer carries a nested `groups:` map', () => {
      then('it is REFUSED — by the phantom-group invariant', async () => {
        // 🔴 .why = the same misplacement, caught by a DIFFERENT invariant, and
        //           the seam is worth a clamp. the section switch matches
        //           `trimmed === 'groups:'` at ANY indent, so a nested block is
        //           read as the reviews-level map — and then refused, because no
        //           reviewer joined the group it declares.
        //
        //           ⇒ what matters is that the valve does not fail OPEN, and it
        //             does not. measured 2026-09-09; a second parser arm for
        //             this shape would be UNREACHABLE, so none was written
        //
        // 🔴 .note = the message used to name ONE cause, and this note recorded
        //            that as an accepted seam: it "does not say wrong place".
        //            peer review i002/r9 refused the seam and was right — an
        //            author who nested the block believes the bound belongs on
        //            the reviewer, so `add group: to a reviewer` reads as the
        //            OPPOSITE of what they wrote. the message now names both
        //            causes, and this test asserts the misplacement half, so a
        //            regression to the one-cause form goes red here
        const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      groups:
        anthropic:
          concurrency: 2
`;
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/no members/);

        // the misplacement half — the clause i002/r9 asked for
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/nested UNDER a reviewer/);
      });
    });

    when(
      '[t2] a reviewer carries an unrecognized key that is NOT a bound',
      () => {
        then('it is accepted — the refusal is narrow on purpose', async () => {
          // .why = a blanket unknown-key schema would reject the comments and stray
          //        lines extant guards already carry. so the refusal names the ONE
          //        key that MEANS a bound, and leaves every other line alone
          const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      notes: this line means naught to the parser
`;
          const result = await parseStoneGuard({
            content,
            path: '/synthetic/1.vision.guard',
          });
          expect(result.reviews.peer).toHaveLength(1);
          expect(result.reviews.peer?.[0]?.slug).toEqual('alpha-checker');
        });
      },
    );
  });

  given('[case16] `budget:` and `level:` — the two numeric NEIGHBOURS', () => {
    // 🔴 .why this case exists = `[case14]` held `concurrency:` to a raw-text bar
    //     and left its two neighbours on a bare `parseInt`, which reads a PREFIX.
    //     so one key REFUSED exactly what the other two silently truncated —
    //     three numeric keys, one contract between them, and it did not hold.
    //
    //     ⚠️ the NaN branch is the worst of the three, and it is not a truncation:
    //       `rounds >= NaN` is `false` for every `rounds`, so a typo'd budget makes
    //       a reviewer NEVER exhaust. an unbounded ladder, reported nowhere.
    //
    // ✅ .proven = reverted both call sites to a bare `parseInt(...)`. `[t0]`
    //     through `[t5]` went red and the other 34 stayed green — `[case14]`'s
    //     five among them, so `concurrency:` was already strict and its tests are
    //     a WITNESS, where these six are a REPAIR.
    //
    //     ⚠️ `[t6]` stayed GREEN under the revert, deliberately: a plain integer
    //       parses identically either way, so it is a WITNESS too. it is here
    //       because six red cases prove the refusal and say naught about the pass
    //
    // .note = the census that priced this: 1,538 `budget:`/`level:` values across
    //         117 `.guard` files in this repo, ZERO non-integers. and a
    //         non-integer has no correct sense to take away — `2.5` cannot mean
    //         half a round — so the refusal surfaces a defect rather than breaks
    //         a guard (fulcrum F10)
    const withBudget = (raw: string): string => `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: ${raw}
`;

    const withLevel = (raw: string): string => `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      level: ${raw}
`;

    when('[t0] `budget:` is FRACTIONAL', () => {
      then('it is REFUSED rather than truncated to 2', async () => {
        await expect(
          parseStoneGuard({
            content: withBudget('2.5'),
            path: '/synthetic/1.vision.guard',
          }),
        ).rejects.toThrow(/budget must be a positive integer/);
      });
    });

    when('[t1] `budget:` is an integer PREFIX of a wider literal', () => {
      then('it is REFUSED rather than read as 1', async () => {
        // .why = `parseInt('1e3')` is 1, so a budget of one thousand rounds would
        //        bind at one — the widest miss, in the direction that hurts
        await expect(
          parseStoneGuard({
            content: withBudget('1e3'),
            path: '/synthetic/1.vision.guard',
          }),
        ).rejects.toThrow(/budget must be a positive integer/);
      });
    });

    when('[t2] `budget:` is not a number at all', () => {
      then('it is REFUSED rather than bound at NaN', async () => {
        // 🔴 .why this one is the sharpest = the other five bind at a WRONG value;
        //     this binds at a value that never compares true. `rounds >= NaN` is
        //     false for every `rounds`, so the reviewer never exhausts and the
        //     ladder has no bound at all — with no line of output to say so
        await expect(
          parseStoneGuard({
            content: withBudget('abc'),
            path: '/synthetic/1.vision.guard',
          }),
        ).rejects.toThrow(/budget must be a positive integer/);
      });
    });

    when('[t3] `budget:` is ZERO', () => {
      then(
        'it is REFUSED — a reviewer with no rounds never speaks',
        async () => {
          await expect(
            parseStoneGuard({
              content: withBudget('0'),
              path: '/synthetic/1.vision.guard',
            }),
          ).rejects.toThrow(/budget must be a positive integer/);
        },
      );
    });

    when('[t4] `level:` is FRACTIONAL', () => {
      then('it is REFUSED rather than truncated to 1', async () => {
        // .why = `level: 1.9` would sort as level 1, so a reviewer the author put
        //        on the expensive rung runs on the cheap one — and unlocks it
        await expect(
          parseStoneGuard({
            content: withLevel('1.9'),
            path: '/synthetic/1.vision.guard',
          }),
        ).rejects.toThrow(/level must be a positive integer/);
      });
    });

    when('[t5] the error names WHICH reviewer carries the bad value', () => {
      then('the message is actionable, not merely correct', async () => {
        // .why = `rule.require.errors-name-the-fix` — a guard holds many
        //        reviewers, so "budget must be a positive integer" alone sends the
        //        author to read every one of them
        await expect(
          parseStoneGuard({
            content: withBudget('abc'),
            path: '/synthetic/1.vision.guard',
          }),
        ).rejects.toThrow(/reviewer "alpha-checker" declares "abc"/);
      });
    });

    when('[t6] both keys carry plain positive integers', () => {
      then('they parse, unchanged — the strictness is narrow', async () => {
        // .why = the census says every extant value looks like this one. a clamp
        //        that only ever goes red proves the refusal and not the pass
        const result = await parseStoneGuard({
          content: withLevel('3'),
          path: '/synthetic/1.vision.guard',
        });
        expect(result.reviews.peer?.[0]?.budget).toEqual(5);
        expect(result.reviews.peer?.[0]?.level).toEqual(3);
      });
    });
  });

  given(
    '[case17] a LEGACY FLAT reviews entry BESIDE a structured sub-key',
    () => {
      // .why = `self:`, `peer:`, and `groups:` each make the structured object
      //        truthy. a flat `- cmd` parsed BEFORE one of them lands in the flat
      //        bucket, so a precedence that PICKS one source drops it. the two
      //        triggers below are NOT equally dangerous, and that asymmetry is
      //        the point of the pair

      when(
        '[t0] the flat entry precedes a `self:` block — the SILENT loss',
        () => {
          // .why = no group is declared, so assertConcurrencyGroupsResolve never
          //        fires. no other reader touches the flat bucket ⇒ the reviewer
          //        ceases to exist, with no refusal, no warn, and no exit code
          const content = `artifacts:
  - src/**/*
reviews:
  - rhx review --rules a.md --paths src/**/*.ts
  self:
    - slug: all-done
      say: |
        did you complete all that was requested in this stone?
judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route
`;

          then('the flat reviewer SURVIVES the fold', async () => {
            const result = await parseStoneGuard({
              content,
              path: '/synthetic/5.implement.guard',
            });
            const peers = getGuardPeerReviews(result);
            expect(peers).toHaveLength(1);
            expect(peers[0]?.run).toContain('--rules a.md');
          });

          then(
            'it keeps the flat defaults, and the self block is intact',
            async () => {
              // .why = one mapper serves both destinations, so a folded entry and a
              //        freshly-converted one cannot drift apart on their defaults
              const result = await parseStoneGuard({
                content,
                path: '/synthetic/5.implement.guard',
              });
              const peers = getGuardPeerReviews(result);
              expect(peers[0]?.level).toEqual(1);
              expect(peers[0]?.budget).toEqual(Infinity);
              expect(getGuardSelfReviews(result)).toHaveLength(1);
            },
          );
        },
      );

      when(
        '[t1] the flat entry precedes a `groups:` block — ALREADY loud',
        () => {
          // .why = a flat reviewer cannot carry `group:`, so the group is joined by
          //        nobody and F13's phantom check refuses at parse. ⇒ this trigger
          //        was never silent, which is why the fold is not what protects it
          const content = `artifacts:
  - src/**/*
reviews:
  - rhx review --rules a.md --paths src/**/*.ts
  groups:
    anthropic:
      concurrency: 10
`;

          then('the parse REFUSES, and names the fix', async () => {
            await expect(
              parseStoneGuard({
                content,
                path: '/synthetic/5.implement.guard',
              }),
            ).rejects.toThrow(/no members: anthropic/);
          });

          then('the refusal names the join that would repair it', async () => {
            await expect(
              parseStoneGuard({
                content,
                path: '/synthetic/5.implement.guard',
              }),
            ).rejects.toThrow(/group: anthropic/);
          });
        },
      );
    },
  );

  given(
    '[case18] a `concurrency:` bound under groups: with NO group name',
    () => {
      // 🔴 .why = the fail-open twin of `[case15]`. the reviewer-level bound is
      //           refused there; this is the SAME defect one line over — a bound
      //           written under `groups:` with no `<name>:` above it to attach to.
      //
      //           the groups parser only stored a bound when `currentGroupName` was
      //           set, so `startsWith('concurrency:')` was true, the `&& currentGroupName`
      //           guard short-circuited, and NO branch stored it. the groups map
      //           stayed empty, the level poured uncapped, and the author's file
      //           read back as though it declared a cap — the exact silent-absorb
      //           shape every parse-time refusal in this feature exists to close.
      //
      // ✅ .teeth = with the refusal removed the line drops silently, the parse
      //     SUCCEEDS with an empty groups map, and `.rejects` goes red. the arm
      //     turns the silent drop into a loud BadRequestError. raised i017/r6

      when('[t0] the bound sits directly under `groups:`', () => {
        then(
          'the parse REFUSES, and names the missing group name',
          async () => {
            const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
  groups:
    concurrency: 5
`;
            await expect(
              parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
            ).rejects.toThrow(/needs a group name/);
          },
        );

        then('the refusal shows the orphan line it read', async () => {
          const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
  groups:
    concurrency: 5
`;
          await expect(
            parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
          ).rejects.toThrow(/concurrency: 5/);
        });
      });
    },
  );

  // 🔴 [case19] — the `@path` say-ref that cannot be read — lives in
  //     `parseStoneGuard.integration.test.ts`, NOT here. an unreadable @path is
  //     proven by a real `fs.readFile` that returns ENOENT, and a real disk read
  //     is a remote boundary this tier forbids
  //     (`rule.forbid.unit.remote-boundaries`). raised i020/r9, and the reviewer
  //     was right: the case drove genuine disk i/o inside `npm run test:unit`
  //
  //     ⚠️ the marker stays so the id is not silently re-used. `[case20]` below
  //     is its twin and is correctly UNIT — a malformed `timeout:` is refused
  //     by the duration parser before any fs call is reached

  given('[case20] a `timeout:` value the duration parser refuses', () => {
    // 🔴 .why = the twin of `[case19]`, and it was unclamped for the same
    //           reason — `[case7]` proves a VALID timeout parses, and no case
    //           proved what an invalid one reads back as
    //
    // ⚠️ .the two arms are NOT one = a positive-value refusal and a format
    //     refusal leave the same `try` by different doors, and only the second
    //     ever held a discarded cause. a case that tested one would have
    //     reported the pair as covered

    when('[t0] the value is not an iso-8601 duration', () => {
      const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      timeout: "21 minutes"
`;

      then('the parse refuses, and names the CAUSE', async () => {
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/invalid timeout format: 21 minutes/);

        // the parser's own complaint, which the bare message threw away
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/— .+\./);
      });

      then('the refusal shows a value that WOULD work', async () => {
        // .why = `rule.require.errors-name-the-fix`. "invalid format" states
        //        the fault and leaves the author to guess the grammar
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/PT21M/);
      });
    });

    when('[t1] the value parses but is not positive', () => {
      const content = `reviews:
  peer:
    - slug: alpha-checker
      run: rhx review --rules a.md
      budget: 5
      timeout: "PT0S"
`;

      then('it leaves by the OTHER door, message intact', async () => {
        // 🔴 .why this case exists = the catch re-throws a BadRequestError
        //     untouched, so this arm must NOT gain a cause clause. without
        //     the assertion, a repair that wrapped every throw would double
        //     the sentence here and no test would notice
        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.toThrow(/timeout must be positive: PT0S/);

        await expect(
          parseStoneGuard({ content, path: '/synthetic/1.vision.guard' }),
        ).rejects.not.toThrow(/invalid timeout format/);
      });
    });
  });

  given(
    '[case21] a self review that still declares the retired `hashbar:`',
    () => {
      // 🔴 .why = the key is read for ONE purpose — so the emit can tell the author it
      //           is dead. the parser dropped it silently, so `asHashbarDeclaredReviews`
      //           saw an undefined field on every guard in the wild and the notice could
      //           never fire from a real file. the formatter was correct and unreachable
      //
      // ⚠️ .why `0` = it was the commonest value set in the wild — a bug report written
      //     in yaml — and it is the one value a truthiness test reads as absent

      const content = `reviews:
  self:
    - slug: all-done
      hashbar: 0
      say: |
        did you complete all that was requested?

    - slug: tests-pass
      say: |
        do all tests pass?
`;

      when('[t0] the guard is parsed', () => {
        then('the key is ACCEPTED — the parse does not throw', async () => {
          // .why = an author's guard was correct when it was written. a throw halts
          //        their route over a key the notice merely asks them to delete
          const result = await parseStoneGuard({
            content,
            path: '/synthetic/1.vision.guard',
          });
          expect(getGuardSelfReviews(result)).toHaveLength(2);
        });

        then(
          'the declared value survives to the review it sits on',
          async () => {
            const result = await parseStoneGuard({
              content,
              path: '/synthetic/1.vision.guard',
            });
            const [allDone, testsPass] = getGuardSelfReviews(result);
            expect(allDone?.hashbar).toEqual(0);

            // the review that omits the key keeps it undefined, so the notice names
            // only the review that actually carries it
            expect(testsPass?.hashbar).toBeUndefined();
          },
        );

        then('the `say` that follows the key is still read', async () => {
          // .why = the key sits BETWEEN `slug:` and `say:`, so a parse branch that
          //        consumed the line wrongly would strand the review unpushed
          const result = await parseStoneGuard({
            content,
            path: '/synthetic/1.vision.guard',
          });
          expect(getGuardSelfReviews(result)[0]?.say).toContain(
            'did you complete all that was requested?',
          );
        });
      });
    },
  );
});
