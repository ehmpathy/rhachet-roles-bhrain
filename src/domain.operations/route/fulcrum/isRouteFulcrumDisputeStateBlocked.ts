import type { RouteFulcrumDisputeState } from './asRouteFulcrumDisputeState';

/**
 * .what = decides whether a route's dispute state refuses human approval
 * .why = invariant 2: any open human-owed dispute, or any entry the gate cannot read, holds
 *        approval until a human rules or the driver repairs the file. a reflect-owed dispute
 *        never holds it
 */
export const isRouteFulcrumDisputeStateBlocked = (input: {
  state: RouteFulcrumDisputeState;
}): boolean =>
  input.state.owedHuman.length > 0 || input.state.unreadable.length > 0;
