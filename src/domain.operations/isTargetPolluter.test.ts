import { given, then, when } from 'test-fns';

import {
  HUMAN_OF_ROUTE_ARTIFACT_ALLOWED,
  isTargetPolluter,
} from './isTargetPolluter';

/**
 * .what = clamps which target files reach the review scope by default
 * .why = 🔴 the default exclusion is the ONLY thing between a review prompt and
 *        a route's own paperwork. it is expressed once, and a regression here is
 *        silent everywhere else: the review still runs, the verdict still parses,
 *        and the prompt is 13.9% larger with a lane that can read what its peers
 *        concluded (rule.require.exclude-review-scope-polluters).
 *
 *        so every polluter CLASS gets a case, and every KEPT class gets one
 *        beside it. the two halves must be graded together — a change that drops
 *        the whole repo passes half a suite that only grades the drop.
 */
describe('isTargetPolluter', () => {
  given('[case1] a caught dream, in the repo-wide queue', () => {
    when('[t0] the scope is filtered', () => {
      then('the dream is a polluter', () => {
        expect(
          isTargetPolluter({
            path: '.dream/v2026_09_24.feat.a-lever-nobody-built-yet.md',
          }),
        ).toEqual(true);
      });

      then('🔴 and so is the readme that sits beside it', () => {
        expect(isTargetPolluter({ path: '.dream/.readme.md' })).toEqual(true);
      });
    });
  });

  given('[case2] a dream SYMLINK inside a route', () => {
    /**
     * .why = `rule.always.catch-dreams-for-followups` requires a symlink from
     *        the route that caught a dream back into `.dream/`. so the SAME
     *        bytes reach the scope twice — 131.2k of the 185.2k measured.
     *
     * 🔴 a route-scoped allowlist alone cuts the symlink and KEEPS the original,
     *    which is the wrong half of the pair: the bytes stay and the provenance
     *    goes. `.dream` is matched on its own segment for exactly that reason.
     */
    when('[t0] the scope is filtered', () => {
      then('the symlinked dream is a polluter', () => {
        expect(
          isTargetPolluter({
            path: '.behavior/v2026_09_20.review-cost-meter/dreams/v2026_09_24.feat.a-lever.md',
          }),
        ).toEqual(true);
      });
    });
  });

  given('[case3] a machine-written lockfile', () => {
    when('[t0] the scope is filtered', () => {
      then('pnpm-lock.yaml is a polluter', () => {
        expect(isTargetPolluter({ path: 'pnpm-lock.yaml' })).toEqual(true);
      });

      then('package-lock.json is a polluter', () => {
        expect(isTargetPolluter({ path: 'package-lock.json' })).toEqual(true);
      });

      then('yarn.lock is a polluter', () => {
        expect(isTargetPolluter({ path: 'yarn.lock' })).toEqual(true);
      });

      then('🟡 and a nested one is too — the leaf name decides', () => {
        expect(
          isTargetPolluter({ path: 'packages/api/pnpm-lock.yaml' }),
        ).toEqual(true);
      });

      then('🟡 but package.json is KEPT — a human authors it', () => {
        expect(isTargetPolluter({ path: 'package.json' })).toEqual(false);
      });
    });
  });

  given('[case3b] a machine-written run log at the repo root', () => {
    /**
     * 🔴 the self-pollution case. a review writes its scope and token census under
     * `.log/bhrain/review/` before the overflow gate, so in a repo that does not gitignore
     * `.log/`, the next round read its own last round as changed files — and a declared
     * partition set was refused for the review's own logs
     */
    when('[t0] the scope is filtered', () => {
      then("the review's own log is a polluter", () => {
        expect(
          isTargetPolluter({
            path: '.log/bhrain/review/2026-10-06T19-32-54-630Z.pid1.uuid/tokens.expected.md',
          }),
        ).toEqual(true);
      });

      then("another tool's log is a polluter too", () => {
        expect(
          isTargetPolluter({
            path: '.log/role=mechanic/skill=git.repo.test/what=unit/run.stdout.log',
          }),
        ).toEqual(true);
      });

      then(
        '🟡 a nested `.log` dir is KEPT — only the repo root is bound',
        () => {
          expect(isTargetPolluter({ path: 'src/.log/readme.md' })).toEqual(
            false,
          );
        },
      );

      then('🟡 a file merely named `.log` is KEPT', () => {
        expect(isTargetPolluter({ path: '.log' })).toEqual(false);
      });
    });
  });

  given('[case4] a `.behavior` route — the behavior VARIANT', () => {
    const route = '.behavior/v2026_09_20.review-cost-meter';

    when('[t0] the scope is filtered', () => {
      then('the wish is a polluter', () => {
        expect(isTargetPolluter({ path: `${route}/0.wish.md` })).toEqual(true);
      });

      then('a stone is a polluter', () => {
        expect(isTargetPolluter({ path: `${route}/1.vision.stone` })).toEqual(
          true,
        );
      });

      then('a guard is a polluter', () => {
        expect(isTargetPolluter({ path: `${route}/1.vision.guard` })).toEqual(
          true,
        );
      });

      then('an experience demo is a polluter', () => {
        expect(
          isTargetPolluter({
            path: `${route}/1.vision.experience.case=1.a-driver-reads-the-bill.md`,
          }),
        ).toEqual(true);
      });

      then('the passage ledger is a polluter', () => {
        expect(
          isTargetPolluter({ path: `${route}/.route/passage.jsonl` }),
        ).toEqual(true);
      });
    });
  });

  given('[case5] a `.route` route — the DEFAULT variant', () => {
    /**
     * 🔴 the case a `.behavior`-only rule misses entirely. `howto.create-routes`
     *    declares `.route/` the DEFAULT variant and `.behavior/` one kind among
     *    several — a behavior is a specific KIND of route, never the category.
     *
     *    this repo runs seven `.route/v*` routes today, and
     *    `.route/v2026_09_16.goal=acceptance-under-5min` carries stones and
     *    yields exactly as a behavior does.
     */
    const route = '.route/v2026_09_16.goal=acceptance-under-5min';

    when('[t0] the scope is filtered', () => {
      then('its stone is a polluter', () => {
        expect(
          isTargetPolluter({ path: `${route}/1.instrument.stone` }),
        ).toEqual(true);
      });

      then('a loose record under the variant is a polluter', () => {
        expect(
          isTargetPolluter({
            path: '.route/v2026_04_03.package.install/3.reason.for_js-yaml.v1.i1.md',
          }),
        ).toEqual(true);
      });

      then('a self review under the variant root is a polluter', () => {
        expect(
          isTargetPolluter({ path: '.route/review/self/for.1.vision._.r2.md' }),
        ).toEqual(true);
      });

      then('🟡 but its yield is KEPT — the allowlist is variant-blind', () => {
        expect(
          isTargetPolluter({ path: `${route}/1.instrument.yield.md` }),
        ).toEqual(false);
      });
    });
  });

  given('[case6] a route peer-review report', () => {
    /**
     * 🔴 the independence case, and the one no meter can price. a `.given` holds
     *    another lane's verdict on this very artifact. a lane that reads one can
     *    echo it, so N reviews report as independent while they are not.
     */
    const route = '.behavior/v2026_09_20.review-cost-meter';

    when('[t0] the scope is filtered', () => {
      then('a peer .given is a polluter', () => {
        expect(
          isTargetPolluter({
            path: `${route}/.reviews/peer/5.3.verification._.review.i003.abc.r002._.given.by_peer.slug.md`,
          }),
        ).toEqual(true);
      });

      then('a self review is a polluter', () => {
        expect(
          isTargetPolluter({
            path: `${route}/review/self/for.1.vision._.r2.has-questioned-assumptions.md`,
          }),
        ).toEqual(true);
      });
    });
  });

  given('[case7] the three allowlisted route artifacts', () => {
    const route = '.behavior/v2026_09_20.review-cost-meter';

    when('[t0] the scope is filtered', () => {
      then(
        '🔴 a fulcrum case is a polluter — the summary row carries it',
        () => {
          expect(
            isTargetPolluter({
              path: `${route}/.fulcrums/inventory.of=fulcrums.case=F1-a-fork.md`,
            }),
          ).toEqual(true);
        },
      );

      then('🔴 a file nested below the fulcrum root is a polluter too', () => {
        expect(
          isTargetPolluter({
            path: `${route}/.fulcrums/archive/inventory.of=fulcrums._.md`,
          }),
        ).toEqual(true);
      });

      then('a fulcrum summary is KEPT', () => {
        expect(
          isTargetPolluter({
            path: `${route}/.fulcrums/inventory.of=fulcrums._.md`,
          }),
        ).toEqual(false);
      });

      then('a seed is KEPT', () => {
        expect(
          isTargetPolluter({
            path: `${route}/.seeds/inventory.of=seeds.case=S8-three-goals.md`,
          }),
        ).toEqual(false);
      });

      then('a stage yield is KEPT', () => {
        expect(
          isTargetPolluter({ path: `${route}/1.vision.yield.md` }),
        ).toEqual(false);
      });

      then('🟡 and a nested yield is KEPT — depth does not decide', () => {
        expect(
          isTargetPolluter({ path: `${route}/appendix/2.criteria.yield.md` }),
        ).toEqual(false);
      });
    });
  });

  given('[case8] 🔴 a `.route` dir that is NOT a route', () => {
    /**
     * 🔴 the case that makes the repo-root bound load-bearing. two dirs in this
     *    repo are named `.route` and hold no route at all:
     *
     *      src/domain.roles/thinker/.route/                 (chance.*.md drafts)
     *      src/domain.roles/thinker/briefs/…/.route/        ([.brief.*].md drafts)
     *
     *    a structural detector — "any dir with a `.route/` inside" — reads both
     *    as routes and drops the WHOLE thinker role from every scope: real
     *    source, real briefs. and the review still runs clean, so no assertion
     *    anywhere else goes red.
     */
    when('[t0] the scope is filtered', () => {
      then("the thinker's own .route drafts are KEPT", () => {
        expect(
          isTargetPolluter({
            path: 'src/domain.roles/thinker/.route/chance.solve.md',
          }),
        ).toEqual(false);
      });

      then('a nested brief .route is KEPT', () => {
        expect(
          isTargetPolluter({
            path: 'src/domain.roles/thinker/briefs/thinker.tactics/.route/[.brief.article]<blend>.md',
          }),
        ).toEqual(false);
      });

      then("the thinker's source is KEPT", () => {
        expect(
          isTargetPolluter({
            path: 'src/domain.roles/thinker/getThinkerRole.ts',
          }),
        ).toEqual(false);
      });
    });
  });

  given('[case9] ordinary source, docs, and agent briefs', () => {
    when('[t0] the scope is filtered', () => {
      then('source is KEPT', () => {
        expect(
          isTargetPolluter({
            path: 'src/domain.operations/review/stepReview.ts',
          }),
        ).toEqual(false);
      });

      then('a test is KEPT', () => {
        expect(
          isTargetPolluter({ path: 'src/contract/cli/review.test.ts' }),
        ).toEqual(false);
      });

      then('an agent brief is KEPT', () => {
        expect(
          isTargetPolluter({
            path: '.agent/repo=.this/role=any/briefs/rule.require.a-law.md',
          }),
        ).toEqual(false);
      });

      then('🔴 a src file whose name merely CONTAINS "dream" is KEPT', () => {
        expect(
          isTargetPolluter({ path: 'src/domain.objects/DreamCatcher.ts' }),
        ).toEqual(false);
      });

      then('🔴 a dir named `dreams` OUTSIDE a route is KEPT', () => {
        expect(isTargetPolluter({ path: 'docs/dreams/why.md' })).toEqual(false);
      });
    });
  });

  given('[case10] paths that name no file, or lead with `./`', () => {
    when('[t0] the scope is filtered', () => {
      then('the route dir itself is not a polluter — it names no file', () => {
        expect(
          isTargetPolluter({ path: '.behavior/v2026_09_20.review-cost-meter' }),
        ).toEqual(false);
      });

      then('a `./`-led route artifact is still a polluter', () => {
        expect(
          isTargetPolluter({
            path: './.behavior/v2026_09_20.review-cost-meter/0.wish.md',
          }),
        ).toEqual(true);
      });

      then('a `./`-led seed is still KEPT', () => {
        expect(
          isTargetPolluter({
            path: './.behavior/v2026_09_20.review-cost-meter/.seeds/inventory.of=seeds._.md',
          }),
        ).toEqual(false);
      });
    });
  });

  given('[case-hint] the human form of the allowlist', () => {
    when('[t0] the refusal hint reads it', () => {
      then('it names the three kept shapes', () => {
        expect(HUMAN_OF_ROUTE_ARTIFACT_ALLOWED).toEqual(
          '.fulcrums/*._.md, .seeds/**, *.yield.md',
        );
      });

      then('🔴 every shape it names is one the predicate keeps', () => {
        const route = '.behavior/v2026_09_20.review-cost-meter';
        const asPath = (shape: string): string =>
          `${route}/${shape.replace('/**', '/any.md').replace('*', 'stage')}`;
        for (const shape of HUMAN_OF_ROUTE_ARTIFACT_ALLOWED.split(', '))
          expect(isTargetPolluter({ path: asPath(shape) })).toEqual(false);
      });
    });
  });
});
