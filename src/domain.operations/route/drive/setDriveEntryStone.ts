import { DriveBlockerState, DriveBrainInheritance } from './DriveBlocker';
import { mutateDriveBlockerState } from './mutateDriveBlockerState';

/**
 * .what = marks the stone whose switch just LANDED, and PRESERVES the block count
 * .why = `applyStoneBrainOnEntry` detects entry by the brain record's `stone`, which this op
 *        alone writes; a stone whose switch landed must not re-dispatch every onStop tick
 * 🔴 .note = the gate reads `brain.stone`, never the top-level `stone`: every onStop tick
 *           rewrites that one for the block count (`setDriveBlockerState`)
 *
 * .note = `count` is carried through: a parked stone must not inflate the 21-tick cutoff
 * .note = the sole writer of `brain`, and it runs on the `requested` arm alone, so the
 *         record changes only when a `/model` was submitted (`DriveBlocker.ts`)
 */
export const setDriveEntryStone = async (input: {
  route: string;
  stone: string;

  /**
   * .what = the `/model` choice just dispatched, or `null` where none was sent
   * 🔴 .note = NULL carries the prior slug through: the last `/model` sent still stands
   */
  brain: string | null;

  /**
   * .what = the `/effort` level just dispatched, or `null` where none was sent
   * 🔴 .note = NULL carries the prior level through ONLY where no `/model` was sent either:
   *           effort is model-scoped, so a new model runs at its own default
   */
  effort: string | null;
}): Promise<{ state: DriveBlockerState }> =>
  mutateDriveBlockerState({
    route: input.route,
    project: (before) =>
      new DriveBlockerState({
        count: before.count,
        stone: input.stone,
        brain: asBrainInheritanceAfterDispatch({
          before: before.brain,
          stone: input.stone,
          brain: input.brain,
          effort: input.effort,
        }),
      }),
  });

/**
 * .what = the inheritance record after one dispatch
 * .why = the two axes carry through on different terms — a slug outlives an `/effort`,
 *        a level does not outlive a `/model` — and that rule is stated once, here
 */
const asBrainInheritanceAfterDispatch = (input: {
  before: DriveBrainInheritance | null;
  stone: string;
  brain: string | null;
  effort: string | null;
}): DriveBrainInheritance | null => {
  // naught dispatched → the prior record stands
  if (!input.brain && !input.effort) return input.before;

  return new DriveBrainInheritance({
    slug: input.brain ?? input.before?.slug ?? null,
    effort:
      input.effort ?? (input.brain ? null : (input.before?.effort ?? null)),
    stone: input.stone,
  });
};
