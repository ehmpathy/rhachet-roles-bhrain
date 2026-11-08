import type { TermsHookStatus } from './getOneTermsHookState';

/**
 * .what = the no-op a toggle settles at, or null when a write is owed
 * .why = one rule for both reads: the lock-free look that lets a no-op skip the hold, and the
 *        re-read under the hold that decides for real
 */
export const asTermsHookNoopOutcome = (input: {
  mode: 'enable' | 'disable';
  status: TermsHookStatus;
}): 'already-enabled' | 'already-disabled' | null => {
  if (input.mode === 'enable' && input.status === 'current')
    return 'already-enabled';
  if (input.mode === 'disable' && input.status === 'off')
    return 'already-disabled';
  return null;
};
