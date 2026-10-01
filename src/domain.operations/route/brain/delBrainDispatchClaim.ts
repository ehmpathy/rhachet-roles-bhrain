import { delOneFile } from '../drive/delOneFile';
import { asBrainDispatchClaimPath } from './BrainDispatchClaim';

/**
 * .what = releases a dispatch claim, so the next tick may dispatch at once
 * .why = the claim is written BEFORE the dispatch, so a FAILED dispatch would leave one
 *        behind and suppress the next tick's retry for its 15s window. the retry is how a
 *        human who runs `rhx enroll` mid-session self-heals, so the claim may suppress a
 *        duplicate of a SUCCESS, never a retry after a FAILURE
 *
 * .note = idempotent: an absent claim is a no-op (`rule.require.idempotent-operations`)
 */
export const delBrainDispatchClaim = async (input: {
  route: string;
}): Promise<void> =>
  await delOneFile({ path: asBrainDispatchClaimPath({ route: input.route }) });
