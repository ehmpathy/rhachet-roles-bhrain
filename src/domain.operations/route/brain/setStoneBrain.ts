import path from 'path';

import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import type { ReviewerBrainRow } from './asReviewerBrains';
import { asReviewerBrains } from './asReviewerBrains';
import { dispatchBrainSwitch } from './dispatchBrainSwitch';
import type { CloneAddressRead } from './getCloneAddress';
import { getCloneAddress } from './getCloneAddress';
import { isStoneBrainDeclared } from './isStoneBrainDeclared';
import type { StoneBrainHaltCause } from './StoneBrainHaltCause';

export type { StoneBrainHaltCause };

/**
 * .what = the four outcomes a prescribed-brain apply can reach
 * .why = the caller renders a different surface for each. a boolean would fuse `undispatched`
 *        with `none`, so a stone that asked for a brain and did not get one would read like a
 *        stone that never asked (case=8 [t2])
 *
 * .note = `none` vs `inherited`: `none` (case=10) owes byte-identical silence on every route
 *         that never declares a brain; `inherited` (case=7) owes an attribution line, since it
 *         is where a driver can run an expensive brain no one on this stone asked for. it
 *         carries a STONE name, not a guard path — no guard is in hand on that arm
 * .note = `requested`, never `switched`: the dispatch is fire-and-forget and no code here reads
 *         the brain's reply (case=3 [t5])
 * .note = a refusal the brain never SPEAKS is undetected. the wisher deferred it on 2026-09-13
 *         until `clone whoami` reports the live brain (`F5`; `.dream/v2026_09_09.reseed.clone-
 *         whoami-cannot-report-the-live-brain.md`). it degrades to pre-feature behavior — the
 *         inherited brain — and the build must not fake a halt on a signal it never read.
 *         recorded here because a reviewer's scope cannot reach the route's `.seeds/`
 * .note = `undispatched`, never `unreachable`: `spawn-failed` confirms an address and then fails
 *         to launch. the tag names what did not happen — no say was submitted
 * .note = both guard-backed arms carry the guard PATH, and `requested` carries the reviewers:
 *         the parsed guard is in hand here and nowhere downstream
 */
export type StoneBrainOutcome =
  | { outcome: 'none' }
  | {
      /**
       * .what = this stone declares no brain; a prior stone's dispatch carries forward
       *         (case=7, `F6`)
       * .note = returned only by `applyStoneBrainOnEntry`, which holds the route's record
       */
      outcome: 'inherited';
      /** the last `/model` choice dispatched, or null where only an effort ever was */
      brain: string | null;
      /** the last `/effort` level dispatched and still live, or null (`F30`) */
      effort: string | null;
      /** the stone whose guard dispatched last — the provenance half of the attribution */
      stone: string;
    }
  | {
      outcome: 'undispatched';
      /** the `/model` choice the guard declared, or null where it declared only an effort */
      brain: string | null;
      /** the `/effort` level the guard declared, or null where it declared only a choice */
      effort: string | null;
      guard: string;
      cause: StoneBrainHaltCause;
    }
  | {
      outcome: 'requested';
      /** the `/model` choice the guard declared, or null where it declared only an effort */
      brain: string | null;
      /** the `/effort` level the guard declared, or null where it declared only a choice */
      effort: string | null;
      guard: string;
      reviewers: ReviewerBrainRow[];
    };

/**
 * .what = applies a stone's prescribed brain to the live driver clone
 * .why = a guard bounds what a stone may SPEND; this prices the driver's turns
 *
 * .note = convergent, never comparative: it dispatches the declared brain and holds no belief
 *         about the clone's current one. a redundant `/model` is benign, and a compare would be
 *         blind to a hand-typed `/model` — this self-heals at the next entry
 *         (`rule.require.fewer-paths-via-idempotency`, `F14`)
 */
export const setStoneBrain = async (
  input: {
    guard: RouteStoneGuard | null;
    route: string;
  },
  options?: {
    /**
     * .what = reads this clone's own address, or the reason none was confirmed
     * .why = a seam so every halt cause is clampable. jest inherits the driver's
     *        RHACHET_CLONE_SERIAL, so an unseamed test dispatches a REAL `/model` into the
     *        developer's live session
     */
    getAddress?: (input: {
      rhx: string;
      repoRoot: string;
    }) => Promise<CloneAddressRead>;

    /**
     * .what = submits the switch into the addressed clone; reports whether the child launched
     * .why = a seam so the `requested` arm is testable without a live `clone say`
     * .note = SYNCHRONOUS by contract, so an await of delivery — the case=5 deadlock — stays a
     *         type error. `submitted` is the launch, never the delivery (see
     *         `dispatchBrainSwitch`)
     */
    dispatch?: (input: {
      rhx: string;
      repoRoot: string;
      address: string;
      brain: string | null;
      effort: string | null;
    }) => { submitted: boolean };
  },
): Promise<StoneBrainOutcome> => {
  // no brain declared → keep the inherited brain at zero cost: no probe, no output (case=10)
  const guard = input.guard;
  if (!isStoneBrainDeclared(guard)) return { outcome: 'none' };

  // either axis may be null; the parser guarantees at least one is set (`finalizeBrain`)
  const brain = guard.brain.choice;
  const effort = guard.brain.effort;

  // anchor the rhx binary at the repo root, never the inherited cwd (rule.forbid.cwd-outside-gitroot)
  const repoRoot = await getRepoRootWithFallback({ from: input.route });
  const rhx = path.join(repoRoot, 'node_modules', '.bin', 'rhx');

  // confirm which clone this hook targets; no confirmed address → no say, and halt loud (case=1, case=2)
  const read = await (options?.getAddress ?? getCloneAddress)({
    rhx,
    repoRoot,
  });
  if (read.address === null)
    return {
      outcome: 'undispatched',
      brain,
      effort,
      guard: guard.path,
      cause: read.cause,
    };

  // dispatch the switch, and await naught — an await of delivery deadlocks (case=5)
  const dispatched = (options?.dispatch ?? dispatchBrainSwitch)({
    rhx,
    repoRoot,
    address: read.address,
    brain,
    effort,
  });

  // the child never launched → claim no request (rule.forbid.failhide)
  if (!dispatched.submitted)
    return {
      outcome: 'undispatched',
      brain,
      effort,
      guard: guard.path,
      cause: 'spawn-failed',
    };

  return {
    outcome: 'requested',
    brain,
    effort,
    guard: guard.path,
    // each reviewer's `--brain`, so the render shows both spend scopes (F12, case=9 [t4])
    reviewers: asReviewerBrains({ guard }),
  };
};
