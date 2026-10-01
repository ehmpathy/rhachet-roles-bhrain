import { getDriveBlockerState } from '../drive/getDriveBlockerState';
import type { StoneBrainOutcome } from './setStoneBrain';

/**
 * .what = the BRAINLESS arm — case=10's silence, or case=7's attribution
 * .why = one input (`this stone declares no brain`), two owed outputs: without the
 *        attribution, a driver who inherited an expensive brain cannot trace the spend
 *
 *        | the cell | the route | what is owed |
 *        |---|---|---|
 *        | case=10 `absent-from-launch` | never opted in | byte-identical silence, no I/O |
 *        | case=7  `absent-after-switch` | a prior stone dispatched | the attribution line |
 *
 * 🔴 .note = the ROUTE gate runs first: case=10 covers every drive in every repo, so it is
 *           settled by `routeDeclaresBrain` (already in hand) at zero I/O. only an opted-in
 *           route pays the read, and only on its brainless stones
 * 🟡 .note = an absent record returns `none`: switches that all halted `undispatched`
 *           submitted no brain, so an attribution would name one never sent (failhide)
 * .note = deps ride `options` as a test seam (`rule.forbid.inject-same-repo-domain-ops`)
 */
export const getOneBrainInheritance = async (
  input: {
    route: string;

    /**
     * .what = does ANY stone on this route declare a `brain:`?
     * .why = it is the one fact that parts case=10 from case=7, and it costs NAUGHT to
     *        compute — the caller already read every stone and its guard up front
     */
    routeDeclaresBrain: boolean;
  },
  options?: { getState?: typeof getDriveBlockerState },
): Promise<StoneBrainOutcome> => {
  const getState = options?.getState ?? getDriveBlockerState;

  // case=10 — the route never opted in. return before any I/O at all
  if (!input.routeDeclaresBrain) return { outcome: 'none' };

  // case=7 — an opted-in route. a prior stone may have dispatched a brain this one carries
  const state = await getState({ route: input.route });
  if (!state.brain) return { outcome: 'none' };

  return {
    outcome: 'inherited',
    brain: state.brain.slug,
    effort: state.brain.effort,
    stone: state.brain.stone,
  };
};
