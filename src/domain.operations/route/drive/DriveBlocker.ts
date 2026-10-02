import { DomainLiteral } from 'domain-objects';
import * as path from 'path';

/**
 * .what = the last brain this route DISPATCHED, and the stone whose guard prescribed it
 * .why = case=7 (`absent-after-switch`) owes a `brain = <slug>` line on a brainless stone
 *        that follows a switch, so a sticky spend is traceable; the record carries it
 *        across stones
 *
 * 🔴 .why a RECORD rather than a DERIVATION = a derivation from the route's stones would
 *        attribute a switch that halted `undispatched` and never landed. the record is
 *        written on the `requested` arm alone (`rule.forbid.failhide`)
 *
 * .note = it records a DISPATCH on this route, never the live brain of this session (F5)
 */
export interface DriveBrainInheritance {
  /**
   * the last `/model` argument submitted (F10), or null where only an `/effort` was ever sent
   */
  slug: string | null;

  /**
   * the last `/effort` level submitted, or null where the live model runs at its default
   *
   * .note = effort is model-scoped, so a `/model` with no `/effort` beside it clears it
   */
  effort: string | null;

  /**
   * the stone whose guard dispatched last
   */
  stone: string;
}

export class DriveBrainInheritance
  extends DomainLiteral<DriveBrainInheritance>
  implements DriveBrainInheritance {}

/**
 * .what = current state of drive stop blocker
 */
export interface DriveBlockerState {
  /**
   * consecutive blocks since last approval/reset
   */
  count: number;

  /**
   * the stone this file last recorded; two writers, one reader
   *
   * .writer1 = `setDriveBlockerState`: the current stone, on every push-block
   * .writer2 = `setDriveEntryStone`: the stone whose brain was just dispatched
   * .reader  = `applyStoneBrainOnEntry`: `stateBefore.stone !== stone.name` is the
   *            stone-entry edge that gates the onStop dispatch
   *
   * 🟡 .hazard = a fix for `.dream/v2026_09_09.fix.drive-blocker-count-never-resets-on-stone-change.md`
   *    touches this same field, and must keep the entry-edge semantics intact
   */
  stone: string | null;

  /**
   * the last brain dispatched on this route, or `null` where no switch ever landed
   *
   * .writer = `setDriveEntryStone` alone, on the `requested` arm alone
   * .reader = `applyStoneBrainOnEntry`, on a brainless stone of an opted-in route (case=7)
   *
   * .note = `setDriveBlockerState` carries it through verbatim, so a block streak cannot
   *         erase it; it does not ride `.stone`, which holds the stone ENTERED, never the
   *         stone that PRESCRIBED (`rule.forbid.domain-term-ambiguity`)
   */
  brain: DriveBrainInheritance | null;
}

export class DriveBlockerState
  extends DomainLiteral<DriveBlockerState>
  implements DriveBlockerState
{
  public static nested = { brain: DriveBrainInheritance };
}

/**
 * .what = the on-disk path of a route's `DriveBlockerState`
 * .why = three ops read or write this file; one derivation keeps them in step
 */
export const asDriveBlockerStatePath = (input: { route: string }): string =>
  path.join(input.route, '.route', '.drive.blockers.latest.json');
