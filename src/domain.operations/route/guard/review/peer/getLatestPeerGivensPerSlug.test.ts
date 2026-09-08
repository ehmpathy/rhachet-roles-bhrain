import { given, then, when } from 'test-fns';

import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';
import { getLatestPeerGivensPerSlug } from './getLatestPeerGivensPerSlug';

const asGiven = (input: {
  slug: string;
  iteration: number;
  hash: string;
  blockers?: number;
  unreadable?: boolean;
}): RouteGuardReviewPeerGiven => ({
  slug: input.slug,
  blockers: input.blockers ?? 1,
  nitpicks: 0,
  unreadable: input.unreadable ?? false,
  // .note = `hash` is an input to the PATH only — the record carries no hash field, by
  //         design (see RouteGuardReviewPeerGiven). so these cases assert on pathGiven,
  //         which is where a hash legitimately lives (r11 blocker.1, i003).
  iteration: input.iteration,
  pathGiven: `1.x._.review.i${String(input.iteration).padStart(3, '0')}.${
    input.hash
  }.r001._.given.by_peer.${input.slug}.md`,
});

describe('getLatestPeerGivensPerSlug', () => {
  given('[case1] one reviewer that spoke once', () => {
    when('[t0] picked', () => {
      then('its given is the live one', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [asGiven({ slug: 'architect', iteration: 1, hash: 'h1' })],
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.pathGiven).toContain('.h1.');
      });
    });
  });

  given('[case2] one reviewer that spoke across three hashes', () => {
    when('[t0] picked', () => {
      then('only its latest word survives', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [
            asGiven({ slug: 'architect', iteration: 1, hash: 'h1' }),
            asGiven({ slug: 'architect', iteration: 2, hash: 'h2' }),
            asGiven({ slug: 'architect', iteration: 3, hash: 'h3' }),
          ],
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.iteration).toEqual(3);
        expect(result[0]?.pathGiven).toContain('.h3.');
      });
    });
  });

  given('[case3] two reviewers, each with its own history', () => {
    when('[t0] picked', () => {
      then('each keeps its own latest, independently', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [
            asGiven({ slug: 'architect', iteration: 1, hash: 'h1' }),
            asGiven({ slug: 'mechanic', iteration: 1, hash: 'h1' }),
            asGiven({ slug: 'architect', iteration: 4, hash: 'h2' }),
          ],
        });
        const bySlug = new Map(result.map((one) => [one.slug, one.iteration]));
        expect(bySlug.get('architect')).toEqual(4);
        expect(bySlug.get('mechanic')).toEqual(1);
      });
    });
  });

  given('[case4] the SAME givens, handed over in a scrambled order', () => {
    // enumFilesFromGlob returns raw globby output and no caller sorts it, so the
    // input order here is whatever the filesystem happened to yield. a pick that
    // leaned on first-or-last would be right on one machine and wrong on another
    // (rule.forbid.order-dependence). this case is the clamp on that.
    const ordered = [
      asGiven({ slug: 'architect', iteration: 1, hash: 'h1' }),
      asGiven({ slug: 'architect', iteration: 2, hash: 'h2' }),
      asGiven({ slug: 'architect', iteration: 3, hash: 'h3' }),
    ];

    when('[t0] handed over oldest first', () => {
      then('iteration 3 wins', () => {
        const result = getLatestPeerGivensPerSlug({ givens: ordered });
        expect(result[0]?.iteration).toEqual(3);
      });
    });

    when('[t1] handed over reversed', () => {
      then('iteration 3 STILL wins — the max, never the last seen', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [...ordered].reverse(),
        });
        expect(result[0]?.iteration).toEqual(3);
      });
    });

    when('[t2] handed over with the latest in the middle', () => {
      then('iteration 3 STILL wins — the max, never the first seen', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [ordered[1]!, ordered[2]!, ordered[0]!],
        });
        expect(result[0]?.iteration).toEqual(3);
      });
    });
  });

  given(
    '[case5] a reviewer that dropped its own blocker on a later round',
    () => {
      when('[t0] picked', () => {
        then(
          'the clean later word wins, so the reviewer supersedes itself',
          () => {
            // a reviewer may take back a blocker it no longer holds. were the
            // EARLIER given to win, it never could.
            //
            // .note = this is NOT a third discharge path. the entrance gate
            //         (setStoneAsPassed.ts:332-337) is stone-level and returns
            //         before any reviewer runs, so a reviewer speaks again only
            //         after an answer or an overrule already unlocked the round
            const result = getLatestPeerGivensPerSlug({
              givens: [
                asGiven({
                  slug: 'architect',
                  iteration: 1,
                  hash: 'h1',
                  blockers: 3,
                }),
                asGiven({
                  slug: 'architect',
                  iteration: 2,
                  hash: 'h2',
                  blockers: 0,
                }),
              ],
            });
            expect(result).toHaveLength(1);
            expect(result[0]?.blockers).toEqual(0);
          },
        );
      });
    },
  );

  given('[case6] no givens at all', () => {
    when('[t0] picked', () => {
      then('the result is empty', () => {
        expect(getLatestPeerGivensPerSlug({ givens: [] })).toEqual([]);
      });
    });
  });

  given('[case7] THREE reviewers, handed over in two different orders', () => {
    // case4 clamps the WINNER against input order; this clamps the SEQUENCE, and
    // they are separate guarantees. a max settles which given survives per slug and
    // says no word about the order the survivors come back in — that is map-insertion
    // order, which is glob order, which is the filesystem's. the sequence is not
    // private: the filter/map chain downstream keeps it intact into the halt prompt,
    // so an unsorted return lists a driver's reviewers differently per machine.
    // case4 cannot catch this — it carries one slug, so its sequence is length 1.
    const scattered = [
      asGiven({ slug: 'mechanic', iteration: 2, hash: 'h2' }),
      asGiven({ slug: 'architect', iteration: 1, hash: 'h1' }),
      asGiven({ slug: 'ergonomist', iteration: 3, hash: 'h3' }),
    ];

    when('[t0] handed over in one filesystem order', () => {
      then('the slugs come back sorted', () => {
        const result = getLatestPeerGivensPerSlug({ givens: scattered });
        expect(result.map((one) => one.slug)).toEqual([
          'architect',
          'ergonomist',
          'mechanic',
        ]);
      });
    });

    when('[t1] handed over in the reverse order', () => {
      then('the slugs come back in the SAME sorted sequence', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [...scattered].reverse(),
        });
        expect(result.map((one) => one.slug)).toEqual([
          'architect',
          'ergonomist',
          'mechanic',
        ]);
      });
    });
  });

  given('[case8] the given that wins carries an UNREADABLE verdict', () => {
    // the pick sits mid-chain between the parse (asPeerGivenVerdict, which raises the
    // flag) and the render (the contemplate prompt, which must print it INSTEAD of a
    // count). a pick that carried the counts and dropped the flag would restore the
    // exact failhide both ends were built to close — and it would do so silently,
    // because blockers:1 still gates, so every OTHER case here would stay green.
    when('[t0] it is the reviewers latest word', () => {
      then(
        'the flag rides through with the counts, never apart from them',
        () => {
          const result = getLatestPeerGivensPerSlug({
            givens: [
              asGiven({ slug: 'architect', iteration: 1, hash: 'h1' }),
              asGiven({
                slug: 'architect',
                iteration: 2,
                hash: 'h2',
                unreadable: true,
              }),
            ],
          });
          expect(result).toHaveLength(1);
          expect(result[0]?.unreadable).toEqual(true);
        },
      );
    });

    when('[t1] a READABLE later word supersedes it', () => {
      then(
        'the flag clears — a reviewer that recovers is not still broken',
        () => {
          const result = getLatestPeerGivensPerSlug({
            givens: [
              asGiven({
                slug: 'architect',
                iteration: 1,
                hash: 'h1',
                unreadable: true,
              }),
              asGiven({ slug: 'architect', iteration: 2, hash: 'h2' }),
            ],
          });
          expect(result).toHaveLength(1);
          expect(result[0]?.unreadable).toEqual(false);
        },
      );
    });
  });

  given('[case9] ONE reviewer with TWO givens at the SAME iteration', () => {
    // case4 clamps the winner across DISTINCT iterations, where a max over iteration
    // alone already decides. this is the tie, and a max over iteration alone does NOT
    // decide it — a strict `>` keeps whichever arrived first, and arrival is glob
    // order, which is the filesystem's. so the pick must be total, never merely a max.
    const tied = [
      asGiven({ slug: 'architect', iteration: 4, hash: 'aaa' }),
      asGiven({ slug: 'architect', iteration: 4, hash: 'zzz' }),
    ];

    when('[t0] handed over in one filesystem order', () => {
      then('exactly one survives, and it is the greater path', () => {
        const result = getLatestPeerGivensPerSlug({ givens: tied });
        expect(result).toHaveLength(1);
        expect(result[0]?.pathGiven).toContain('.zzz.');
      });
    });

    when('[t1] handed over in the reverse order', () => {
      then('the SAME one survives — the winner is machine-free', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [...tied].reverse(),
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.pathGiven).toContain('.zzz.');
      });
    });

    when('[t2] a genuinely later iteration joins the tie', () => {
      then('iteration still outranks the path tie-break', () => {
        const result = getLatestPeerGivensPerSlug({
          givens: [
            ...tied,
            asGiven({ slug: 'architect', iteration: 5, hash: 'aaa' }),
          ],
        });
        expect(result).toHaveLength(1);
        expect(result[0]?.iteration).toEqual(5);
        expect(result[0]?.pathGiven).toContain('.aaa.');
      });
    });
  });
});
