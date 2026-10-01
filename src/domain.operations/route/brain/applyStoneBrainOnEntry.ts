import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import type { DriveBlockerState } from '../drive/DriveBlocker';
import { getDriveBlockerState } from '../drive/getDriveBlockerState';
import { setDriveEntryStone } from '../drive/setDriveEntryStone';
import { delBrainDispatchClaim } from './delBrainDispatchClaim';
import { genBrainDispatchClaim } from './genBrainDispatchClaim';
import { getOneBrainInheritance } from './getOneBrainInheritance';
import { isStoneBrainDeclared } from './isStoneBrainDeclared';
import type { StoneBrainOutcome } from './setStoneBrain';
import { setStoneBrain } from './setStoneBrain';

/**
 * .what = applies a stone's prescribed brain, then marks the entry (the F7/F14 entry rule)
 * .why = the dispatch cadence depends on the surface:
 *        - `dispatchAlways` (onBoot + direct mode) dispatches unconditionally: the entry marker
 *          persists across sessions, so a resumed session would read `entered === false` and
 *          go silent (F7). a re-dispatch is benign (F14)
 *        - onStop dispatches only on ENTRY, since it fires every tick
 *
 * .note = direct mode skips the `entered` gate but not the claim, so the rate is bounded at one
 *         `/model` per claim window per stone. residual: a driver who re-runs `route.drive`
 *         every 20s on one stone sees one `/model` line per window. an `entered` gate would
 *         silence resumed sessions and stop the self-heal of a hand-typed `/model`
 * .note = the marker write preserves the block count (`setDriveEntryStone`), so a parked stone
 *         does not inflate the push cutoff
 * .note = the same-repo ops ride `options` as a deliberate deviation from
 *         `rule.forbid.inject-same-repo-domain-ops`: the unit tests assert the ORDER and
 *         ARGUMENTS of the four disk writes (a failed dispatch leaves `setEntry` uncalled and
 *         calls `delClaim`), which an fs-only seam cannot observe
 */
export const applyStoneBrainOnEntry = async (
  input: {
    stone: { name: string; guard: RouteStoneGuard | null };
    route: string;
    dispatchAlways: boolean;

    /**
     * .what = does ANY stone on this route declare a `brain:`?
     * .why = it parts case=10 from case=7 at zero cost — the caller already holds every guard.
     *        per-ROUTE so a route that never declares a brain returns before any i/o and stays
     *        byte-identical, the guarantee with the largest blast radius here (case=10)
     */
    routeDeclaresBrain: boolean;
  },
  options?: {
    getState?: typeof getDriveBlockerState;
    setBrain?: typeof setStoneBrain;
    setEntry?: typeof setDriveEntryStone;
    genClaim?: typeof genBrainDispatchClaim;
    delClaim?: typeof delBrainDispatchClaim;
  },
): Promise<StoneBrainOutcome> => {
  const getState = options?.getState ?? getDriveBlockerState;
  const setBrain = options?.setBrain ?? setStoneBrain;
  const setEntry = options?.setEntry ?? setDriveEntryStone;
  const genClaim = options?.genClaim ?? genBrainDispatchClaim;
  const delClaim = options?.delClaim ?? delBrainDispatchClaim;

  // a stone that declares no brain never dispatches, and writes no marker (case=10)
  // .why = the marker's only consumer is this gate; a brainless stone's write is pure overhead
  //        and the next brain stone's `entered` compare is unchanged without it
  if (!isStoneBrainDeclared(input.stone.guard))
    return getOneBrainInheritance(
      {
        route: input.route,
        routeDeclaresBrain: input.routeDeclaresBrain,
      },
      { getState },
    );

  // the entry marker is the BRAIN record's stone — the stone whose switch last landed
  // 🔴 .why = never `state.stone`: every onStop tick rewrites that field for the block count
  //    (`setDriveBlockerState`), so a halted stone read as entered on its second tick, and the
  //    retry and the halt both went silent (S8). the brain record changes on `requested` alone
  const stateBefore = await getState({ route: input.route });
  const landedHere = stateBefore.brain?.stone === input.stone.name;
  if (!input.dispatchAlways && landedHere)
    return asOwnSwitch({ state: stateBefore });

  // win the right to dispatch, or stand down — one process per (route, stone) per window
  // .why = the detached `clone say` writes into the pty after this process exits, so two
  //        concurrent hooks could interleave keystrokes. a mutex would serialize the spawns and
  //        leave the writes overlapped; only a window sized to the child's submit-verify
  //        timeout bounds it. a stood-down peer renders this stone's landed switch if the
  //        record holds one, else `none` — the winner renders the fresh one
  // .note = keyed on the stone: two different stones inside one window can still overlap, but
  //         an unkeyed claim would swallow a genuine stone change
  // .note = a process killed between this claim and `setEntry`/`delClaim` leaves a live claim
  //         and no dispatch: up to one window of silence for an owed switch. open for the
  //         council at `.fulcrums/inventory.of=fulcrums.case=F27-a-kill-mid-await-leaves-a-live-claim-and-no-dispatch.md`
  const claim = await genClaim({ route: input.route, stone: input.stone.name });
  if (!claim.won)
    return landedHere
      ? asOwnSwitch({ state: stateBefore })
      : { outcome: 'none' };

  const outcome = await setBrain({
    guard: input.stone.guard,
    route: input.route,
  });

  // mark the entry ONLY on a dispatched switch; on failure, release the claim instead
  // .why = a failed dispatch writes no record, so `landedHere` stays false and each next onStop
  //        tick retries — loud
  //        until it lands, and a mid-session fix (`rhx enroll`) self-heals with no reboot. a
  //        mark on failure would halt once, then go silent for the rest of the stone
  // .why release = the claim suppresses a duplicate of a SUCCESS, never a retry after a FAILURE;
  //        left to expire, it would put up to one window of silence before the retry
  // .note = the retry has no backoff: a stone parked on a repairable cause re-pays the full probe
  //         every tick (up to ~40% of the hook's 25s budget on a slow host). a breaker would
  //         block the self-heal; the fix is a dwell, deferred to
  //         `.dream/v2026_09_15.fix.stone-brain-undispatched-overload-and-retry-backoff.md` (F21).
  //         the cadence is pinned both ways by the `RETRY CADENCE` block in
  //         `applyStoneBrainOnEntry.test.ts` — change it there, deliberately
  // .note = the entry write also records the brain and effort (+ the stone) a later
  //         brainless stone inherits for case=7's `brain = <slug>` + `effort = <x>` lines
  if (outcome.outcome === 'requested')
    await setEntry({
      route: input.route,
      stone: input.stone.name,
      brain: outcome.brain,
      effort: outcome.effort,
    });
  else await delClaim({ route: input.route });
  return outcome;
};

/**
 * .what = this stone's OWN landed switch, read back from the record, for a tick that skips
 *         the dispatch
 * .why = a skipped tick still owes the `brain =` and `effort =` rows the dispatch tick showed
 *        (`S12` parity); `none` would drop them, so the second tick of a brain stone read like a
 *        stone that never declared one
 *
 * .note = it rides the `inherited` arm: its fields are exactly the record's, and the only
 *         consumers read the slug and the effort. `stone` names this stone itself
 * .note = the caller checks `landedHere` first, so the record is present by construction
 */
const asOwnSwitch = (input: { state: DriveBlockerState }): StoneBrainOutcome =>
  input.state.brain
    ? {
        outcome: 'inherited',
        brain: input.state.brain.slug,
        effort: input.state.brain.effort,
        stone: input.state.brain.stone,
      }
    : { outcome: 'none' };
