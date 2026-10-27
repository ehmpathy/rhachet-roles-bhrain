import { MARK_OF_MULTI_BIND } from './MARK_OF_MULTI_BIND';

/**
 * .what = the value a writer should leave in the branch pointer, or null to leave it as is
 * .why = a writer holds one bound route; the pointer may already name another. the four
 *        cases, named, so the writer reads as narrative
 *
 * .note = the cases:
 *         - no pointer, or one that names this route → this route
 *         - the multi-bind mark → leave it; only a full bind lookup (`route.drive`) may clear it
 *         - another route whose flag for this branch still stands → the multi-bind mark
 *         - another route whose flag is gone (an unbind by hand) → this route
 */
export const asRouteStatusLinePointerNext = (input: {
  pointerFound: string | null;
  route: string;
  isPeerFlagPresent: boolean;
}): string | null => {
  if (input.pointerFound === null || input.pointerFound === input.route)
    return input.route;
  if (input.pointerFound === MARK_OF_MULTI_BIND) return null;
  return input.isPeerFlagPresent ? MARK_OF_MULTI_BIND : input.route;
};
