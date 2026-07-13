import { UnexpectedCodePathError } from 'helpful-errors';

const INFIX_GIVEN = '._.given.by_peer.';
const INFIX_TAKEN = '._.taken.by_self.';

/**
 * .what = decides whether a path is a peer .given.by_peer path
 * .why = the single source of the given-infix grammar — any caller that must
 *        know "is this a given path?" (e.g. the tree's paired taken line) asks
 *        here rather than with its own copy of the literal, so a rename of the
 *        infix cannot silently desync one caller from the path transformer
 */
export const isRouteGuardReviewPeerGivenPath = (input: {
  pathGiven: string;
}): boolean => input.pathGiven.includes(INFIX_GIVEN);

/**
 * .what = derives the .taken.by_self path paired to a .given.by_peer path
 * .why = one grammar source — the taken path is a pure string transform of the
 *        given path, NOT a re-derivation from {stone,iter,hash,idx,slug}, so the
 *        given↔taken pair can never silently desync (single source of render)
 */
export const getRouteGuardReviewPeerPathTaken = (input: {
  pathGiven: string;
}): string => {
  // fail loud if the input is not a given path — there is no taken to derive
  if (!isRouteGuardReviewPeerGivenPath({ pathGiven: input.pathGiven }))
    UnexpectedCodePathError.throw(
      'expected a .given.by_peer path to derive its paired .taken.by_self path',
      { pathGiven: input.pathGiven },
    );

  // swap the given infix for the taken infix; every other segment is retained verbatim
  return input.pathGiven.replace(INFIX_GIVEN, INFIX_TAKEN);
};
