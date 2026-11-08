import { asTermsHookAuthorRows } from '@src/contract/cli/asTermsHookAuthorRows';
import { asTermsHookEntryCountText } from '@src/contract/cli/asTermsHookEntryCountText';

/**
 * .what = the branch that names how many entries drift from the declared one, their authors,
 *         and the repair
 * .why = `get` tells the caller the file needs repair, the exact command that repairs it, and
 *        whose entries it would touch, the same author rows `disable` names after the fact
 */
export const asTermsHookDriftLeaf = (input: { authors: string[] }): string =>
  [
    `   ├─ drift = ${asTermsHookEntryCountText({ count: input.authors.length })} to replace or remove, via rhx learn.terms.hook enable`,
    ...asTermsHookAuthorRows({ authors: input.authors }),
  ].join('\n');
