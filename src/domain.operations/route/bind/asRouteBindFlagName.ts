import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

/**
 * .what = the filename of a branch's bind flag, `.bind.<flat>.flag`
 * .why = the bind write, the bind lookup glob, and the status line's flag check and
 *        fingerprint must all name the same file; one transformer keeps them from drift
 *
 * .note = imports only `sanitizeBranchName`, which imports naught, so the status line's
 *         cache hit path may load it at no module cost
 */
export const asRouteBindFlagName = (input: { branch: string }): string =>
  `.bind.${sanitizeBranchName({ branch: input.branch })}.flag`;
