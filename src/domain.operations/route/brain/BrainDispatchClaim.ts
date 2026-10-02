import { DomainLiteral } from 'domain-objects';
import * as path from 'path';

/**
 * .what = how long after a dispatch a peer must stand down rather than dispatch again
 * .why = sized to `clone say`'s own submit-verify window: rhachet's
 *        `CLONE_SUBMIT_VERIFY_TIMEOUT_MS` is 15000, the interval a child may still write into
 *        the target pty. a shorter claim expires mid-write and reopens the interleave
 *
 * .note = copied, not imported: the rhachet const lives under `dist/`, on no published path
 * .note = a drift that SHRINKS this below rhachet's value is a real hazard, so it is clamped:
 *         `BrainDispatchClaim.integration.test.ts [case1]` reads rhachet's const off disk and
 *         asserts this is >= it
 */
export const BRAIN_DISPATCH_CLAIM_WINDOW_MS = 15_000;

/**
 * .what = the record of the most recent brain dispatch on a route
 * .why = two concurrent hooks on one route (a session boot and a manual `rhx route.drive`, or two
 *        clones) each spawn a detached `clone say` into the SAME pty; their keystrokes can
 *        interleave into a line the brain reads as neither
 *
 * .note = a lock around the spawn does not close it: the detached child writes AFTER its parent
 *         releases, so a mutex serializes the spawns and leaves the writes overlapped. only a
 *         window sized to the child's lifetime bounds the overlap
 */
export interface BrainDispatchClaim {
  /**
   * the stone whose brain was dispatched
   *
   * .note = keyed so a genuine stone change inside the window still dispatches. the stated
   *         bound: two DIFFERENT stones inside one window can still overlap
   */
  stone: string;
}

export class BrainDispatchClaim
  extends DomainLiteral<BrainDispatchClaim>
  implements BrainDispatchClaim {}

/**
 * .what = the on-disk path of a route's `BrainDispatchClaim`
 * .why = one derivation, so the findsert and the clear cannot drift
 *
 * .note = its own file, never a field on `DriveBlockerState`: that shape feeds live decisions
 *         and is pinned by a snapshot, so a third field would ripple into every reader
 */
export const asBrainDispatchClaimPath = (input: { route: string }): string =>
  path.join(input.route, '.route', '.brain.dispatch.latest.json');

/**
 * .what = reads a claim out of its on-disk text, and answers `null` where none is readable
 * .why = a claim is an optimization — it suppresses a dispatch F14 proves redundant — so an
 *        unreadable one degrades to "no claim" and the dispatch runs
 *
 * .note = every field is SHAPE-checked, never `?? default`-ed: `{"stone": 3}` would otherwise
 *         read as "a peer holds a different stone" and silently un-arm the claim
 */
export const asBrainDispatchClaim = (input: {
  text: string | null;
}): BrainDispatchClaim | null => {
  if (input.text === null) return null;

  // only a `SyntaxError` (a torn or mangled file) degrades; every other fault travels
  // (`rule.forbid.failhide`)
  const parsed = ((): unknown => {
    try {
      return JSON.parse(input.text) as unknown;
    } catch (error) {
      if (error instanceof SyntaxError) return null;
      throw error;
    }
  })();

  if (typeof parsed !== 'object' || parsed === null) return null;

  const { stone } = parsed as Record<string, unknown>;
  if (typeof stone !== 'string' || stone.length === 0) return null;

  return new BrainDispatchClaim({ stone });
};

/**
 * .what = whether a claim still covers a dispatch for the given stone
 * .why = the whole stand-down decision as one named predicate
 *
 * .note = age comes from the file's `mtimeMs`, never a field: route artifacts may not embed a
 *         time-precision timestamp, and `rule.forbid.timestamps-in-route-artifacts` names mtime
 *         as the sanctioned source. a rename preserves the mtime of the written temp
 * .note = `age >= 0`: a future-dated claim (clock skew) reads STALE, so the dispatch runs —
 *         the failure direction is a dispatch, never a silent suppression
 */
export const isBrainDispatchClaimLive = (input: {
  claim: BrainDispatchClaim | null;
  mtimeMs: number | null;
  stone: string;
  now: number;
}): boolean => {
  if (!input.claim) return false;
  if (input.mtimeMs === null || !Number.isFinite(input.mtimeMs)) return false;
  if (input.claim.stone !== input.stone) return false;
  const age = input.now - input.mtimeMs;
  return age >= 0 && age < BRAIN_DISPATCH_CLAIM_WINDOW_MS;
};
