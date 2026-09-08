import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { asStableGuardEmit } from '../__test_assets__/asStableGuardEmit';
import { computeStoneReviewInputHash } from '../guard/review/computeStoneReviewInputHash';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';
import { setStoneAsContemplated } from './setStoneAsContemplated';

/**
 * 🔴 .note = this suite is MISCLASSIFIED — named `.test.ts` (unit) while its `genScene`
 *         helper writes a real temp route to disk. `rule.forbid.unit.remote-boundaries`
 *         grades that a blocker, and it is right about the rule.
 *
 *         it predates this behavior: the same `genScene`, with the same `fs.mkdtemp`,
 *         sits on origin/main. ~44 unit suites here share the pattern.
 *
 *         it is NOT repaired here because the two defects are ORDERED. the prescribed
 *         destination already exists — `setStoneAsContemplated.integration.test.ts` —
 *         and it cannot run locally: `jest.integration.env.ts:96` demands five brain
 *         keys of every integration suite, and neither suite calls a brain. so the
 *         rename converts a green test into a dead one.
 *
 *         ⇒ fix the harness first, then reclassify in one sweep:
 *         `.dream/v2026_09_04.fix.unit-suite-crosses-the-fs-boundary-repo-wide.md`
 */

/**
 * .what = the shared run-token stabilizer, aliased for the reads below
 * .why = 🔴 this suite held a FOURTH drifted copy of it, and the i002 sweep that
 *        consolidated the other three did not reach it — that sweep enumerated the
 *        suites which snapshot a GUARD emit, and this one snapshots a `setStoneAs*`
 *        emit, so it sat outside the list.
 *
 *        its copy swapped the absolute route and the hash, and no more. that was
 *        adequate only by luck: it snapshots guidance trees, which carry no elapsed
 *        time, so the duration mask the other three needed was never missed here.
 *        one reviewer line added to any of these snapshots would have made it flaky,
 *        at a mask the shared asset already carries.
 *
 * ⇒ the lesson is the one this drive has now met four times: to extract a transformer
 *   does not tell you where it must be reached for. you must enumerate the sites, and
 *   "every suite that snapshots an emit" is that enumeration — never "the suites I
 *   happened to touch" (r2 nitpick.1, i003).
 */
const asStableEmit = asStableGuardEmit;

/**
 * .what = builds a temp route with a guarded stone + a current-hash given
 * .why = setStoneAsContemplated needs a real stone, guard (peer slug), and given
 */
const genScene = async (input: {
  taken: 'none' | 'current';
  blockers?: number;
  /** also write a given for a slug ABSENT from the guard config — a retired reviewer */
  retired?: boolean;
}): Promise<{ route: string }> => {
  const route = await fs.mkdtemp(path.join(os.tmpdir(), 'route-set-contempl-'));

  // 🔴 the scene MUST be a git repo, or the snapshots below clamp no property.
  //    `asGuardDisplayPath` relativizes a printed path against the repo root; with no
  //    root to find, `getRepoRootWithFallback` falls back to `process.cwd()` and emits a
  //    `../../../../tmp/…` crawl. `asStableGuardEmit` swaps BOTH that crawl and the raw
  //    absolute route to the same `<route>` token, so a relativized path and an
  //    un-relativized one stabilize to identical bytes — the snapshot then passes
  //    whether or not the cast runs at all.
  //
  //    with a root, the cast yields a bare `.reviews/peer/…` that no swap touches, so
  //    the snapshot goes red the moment the cast is removed (r10 blocker, i005)
  execSync('git init', { cwd: route, stdio: 'ignore' });

  // stone artifact + stone file + guard with one peer reviewer
  await fs.writeFile(path.join(route, '1.vision.yield.md'), '# vision\n');
  await fs.writeFile(path.join(route, '1.vision.stone'), 'do the task\n');
  await fs.writeFile(
    path.join(route, '1.vision.guard'),
    `reviews:
  peer:
    - slug: architect
      run: rhx review --rules briefs/arch.md
judges:
  - rhx judge --mechanism reviewed?
`,
  );

  // learn the current hash the gate will recompute
  const stones = await getAllStones({ route });
  const stone = findOneStoneByPattern({ stones, pattern: '1.vision' })!;
  const hashCurrent = await computeStoneReviewInputHash({ stone, route });

  const reviewsDir = path.join(route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  // a current-hash given; blockers default to 2, or 0 for a clean reviewer
  const blockers = input.blockers ?? 2;
  await fs.writeFile(
    path.join(
      reviewsDir,
      `1.vision._.review.i001.${hashCurrent}.r001._.given.by_peer.architect.md`,
    ),
    `${blockers} blockers\n1 nitpicks\n`,
  );

  // a RETIRED reviewer: it spoke, and the guard config above does not name it
  if (input.retired)
    await fs.writeFile(
      path.join(
        reviewsDir,
        `1.vision._.review.i001.${hashCurrent}.r002._.given.by_peer.mechanic.md`,
      ),
      '2 blockers\n0 nitpicks\n',
    );

  // optionally the paired current-hash taken
  if (input.taken === 'current')
    await fs.writeFile(
      path.join(
        reviewsDir,
        `1.vision._.review.i001.${hashCurrent}.r001._.taken.by_self.architect.md`,
      ),
      'fixed by X\n',
    );

  return { route };
};

describe('setStoneAsContemplated', () => {
  given('[case1] the .taken is absent', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'none' }));

    when('[t0] --as contemplated --that architect', () => {
      const result = useThen('the command completes', async () =>
        setStoneAsContemplated({
          stone: '1.vision',
          route: scene.route,
          slug: 'architect',
        }),
      );

      then('blocks with crystal-clear absent guidance', () => {
        expect(result.contemplated).toBe(false);
        expect(result.emit?.stdout).toContain(
          'contemplation absent for reviewer architect',
        );
        expect(result.emit?.stdout).toContain('_.taken.by_self.architect.md');
      });

      then('matches snapshot — the GUIDANCE variant of the ack', () => {
        // the third of the contract's three stdout shapes. the two acks below are two
        // lines each; this one is a full tree, and it is the shape a driver meets when
        // they run the command too early — the most consequential to keep legible
        // (rule.require.contract-snapshot-exhaustiveness; r2 i001)
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: scene.route }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] the .taken is present at the current hash', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'current' }));

    when('[t0] --as contemplated --that architect', () => {
      const result = useThen('the command completes', async () =>
        setStoneAsContemplated({
          stone: '1.vision',
          route: scene.route,
          slug: 'architect',
        }),
      );

      then('acknowledges the contemplation as a recorded response', () => {
        expect(result.contemplated).toBe(true);
        expect(result.emit?.stdout).toContain('contemplated: architect');
        // a real .taken exists → the ack must claim the response is recorded
        expect(result.emit?.stdout).toContain('your response is recorded');
      });

      then('matches snapshot — the RESPONDED ack, rendered in full', () => {
        // 🔴 the two acks are parted by ONE line, and the substring assertions above
        //    pin only a fragment of it. a reword that kept 'your response is recorded'
        //    and changed every other word would pass them and ship unseen — the exact
        //    drift rule.require.contract-snapshot-exhaustiveness names (r2 i001)
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: scene.route }),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case5] a RETIRED reviewer — it spoke, the config no longer names it',
    () => {
      // the halt prompt marks such a reviewer `retired`, states that a .taken is the ONLY
      // fix, and prints `--as contemplated --that <slug>` for it. that slug is absent from
      // the live config by definition — so a config-only validity check throws
      // `invalid peer reviewer slug` on the exact command the guard just printed: the guard
      // refuses its own guidance, on the one reviewer the copy exists to make legible
      // (r10 blocker.1, i004). the union with slugs-that-have-spoken is what closes it.
      const scene = useBeforeAll(async () =>
        genScene({ taken: 'none', retired: true }),
      );

      when('[t0] --as contemplated --that mechanic', () => {
        then('it is ACCEPTED, and guides rather than throws', async () => {
          const result = await setStoneAsContemplated({
            stone: '1.vision',
            route: scene.route,
            slug: 'mechanic',
          });
          expect(result.contemplated).toBe(false);
          expect(result.emit?.stdout).toContain(
            'contemplation absent for reviewer mechanic',
          );
        });
      });

      when('[t1] the slug is a genuine TYPO', () => {
        then(
          'it still throws — the union widened the set, not the check',
          async () => {
            // the union must not become an accept-all. a typo names no configured reviewer
            // AND has authored no given, so it fails both halves.
            await expect(
              setStoneAsContemplated({
                stone: '1.vision',
                route: scene.route,
                slug: 'mechanik',
              }),
            ).rejects.toThrow('invalid peer reviewer slug');
          },
        );
      });

      when('[t2] the driver reads the options the error lists', () => {
        then(
          'the retired slug is among them, so the fix is discoverable',
          async () => {
            // rule.require.errors-name-the-fix: an error that lists only the slugs that still
            // RUN hides the one the driver was told to answer.
            const error = await setStoneAsContemplated({
              stone: '1.vision',
              route: scene.route,
              slug: 'mechanik',
            }).catch((thrown: Error) => thrown);
            expect(error).toBeInstanceOf(Error);
            expect((error as Error).message).toContain('architect');
            expect((error as Error).message).toContain('mechanic');
          },
        );

        then(
          'matches snapshot — the retired-UNION error, a distinct variant',
          async () => {
            // 🔴 case3 already snaps this error with a ONE-entry `validSlugs`. this is a
            //    different rendered variant of the same surface: the union puts TWO
            //    entries in the list, in a sorted order, and the second of them is the
            //    retired reviewer that made the union necessary at all.
            //
            //    the `.toContain`s above prove both words are present and prove no more
            //    than that — they would pass on a rendering that dropped the separator,
            //    reversed the order, or buried the list in an unreadable sentence. the
            //    ergonomic claim of this case is that a driver can READ the list and
            //    recover, so the list's shape is the assertion (r2 nitpick.3, i003).
            const error = await setStoneAsContemplated({
              stone: '1.vision',
              route: scene.route,
              slug: 'mechanik',
            }).catch((thrown: Error) => thrown);
            expect(
              asStableEmit({
                emit: (error as Error).message,
                route: scene.route,
              }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case4] a clean reviewer (0 blockers) with no .taken', () => {
    const scene = useBeforeAll(async () =>
      genScene({ taken: 'none', blockers: 0 }),
    );

    when('[t0] --as contemplated --that architect', () => {
      const result = useThen('the command completes', async () =>
        setStoneAsContemplated({
          stone: '1.vision',
          route: scene.route,
          slug: 'architect',
        }),
      );

      then(
        'acknowledges without a false "recorded" claim — no critique to answer',
        () => {
          // clean reviewer is ready without a .taken (B7 / usecase 5)
          expect(result.contemplated).toBe(true);
          expect(result.emit?.stdout).toContain('contemplated: architect');
          // the ack must NOT claim a response was recorded — none was written
          expect(result.emit?.stdout).not.toContain(
            'your response is recorded',
          );
          expect(result.emit?.stdout).toContain('raised no blockers');
        },
      );

      then('matches snapshot — the NO-BLOCKERS ack, rendered in full', () => {
        // the honest-ack demo (case=9). its whole value is that it does NOT overclaim,
        // and overclaim is a property of the WORDS — so the words belong in a snapshot
        // where a reviewer reads them, not behind a `.not.toContain` of one phrase
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: scene.route }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] an invalid --that slug', () => {
    const scene = useBeforeAll(async () => genScene({ taken: 'none' }));

    when('[t0] --as contemplated --that ghost', () => {
      then(
        'throws a BadRequestError that lists the valid peer slugs',
        async () => {
          await expect(
            setStoneAsContemplated({
              stone: '1.vision',
              route: scene.route,
              slug: 'ghost',
            }),
          ).rejects.toThrow('architect');
        },
      );

      then(
        'matches snapshot — the rendered error, as a driver reads it',
        async () => {
          // 🔴 the assertion above pins ONE word. a reword that kept `architect` and
          //    changed every other word — the wording, the order of the options, the
          //    hint — would pass it and ship unseen. the negative path of a user-faced
          //    contract is a variant like any other, so it is snapped rather than
          //    sampled (rule.require.contract-snapshot-exhaustiveness; r2 nitpick.1, i002)
          const error = await setStoneAsContemplated({
            stone: '1.vision',
            route: scene.route,
            slug: 'ghost',
          }).catch((caught: unknown) => caught);

          expect(error).toBeInstanceOf(Error);
          expect(
            asStableEmit({
              // 🔴 an ERROR MESSAGE, handed to a param that was called `stdout` until
              //    this round. it is this call site, and the stderr one in the
              //    acceptance suite, that proved the name wrong (r2 nitpick.1, i003)
              emit: (error as Error).message,
              route: scene.route,
            }),
          ).toMatchSnapshot();
        },
      );
    });
  });
});
