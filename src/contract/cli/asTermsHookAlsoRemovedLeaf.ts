import { asTermsHookAuthorRows } from '@src/contract/cli/asTermsHookAuthorRows';
import { asTermsHookEntryCountText } from '@src/contract/cli/asTermsHookEntryCountText';
import { TERMS_HOOK_DECLARED } from '@src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED';

/**
 * .what = the branch that names the entries a disable removed under a foreign author, or null
 * .why = a hand copy or an older body under another author is gone too, and the caller must
 *        learn whose entry left (case=5b). the label says the count holds only the entries the
 *        toggle did not write, so it never reads as a miscount beside `get`'s drift, which counts
 *        the toggle's own older body too. each author is one child row, an absent one in words
 */
export const asTermsHookAlsoRemovedLeaf = (input: {
  authorsRemoved: string[];
}): string | null => {
  const entriesForeign = input.authorsRemoved.filter(
    (author) => author !== TERMS_HOOK_DECLARED.author,
  );
  if (entriesForeign.length === 0) return null;
  const count = asTermsHookEntryCountText({ count: entriesForeign.length });
  return [
    `   ├─ also removed = ${count} the toggle did not write`,
    ...asTermsHookAuthorRows({ authors: entriesForeign }),
  ].join('\n');
};
