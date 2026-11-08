# F22 — disable names foreign authors, not its own count

## .the fork

- **A.** `disable` reports `status = disabled (removed)` for the toggle's own entries, and an `also removed = N entries the toggle did not write` branch, one child row per author, only for entries another author wrote; `get`'s `drift` counts every term hook entry other than the declared one, its own older bodies included
- **B.** `disable` counts every entry it removed, its own included, so its number matches `get`'s drift

## .taken — A

the two leaves answer two questions. `drift` tells a caller the file needs repair and by how much; `also removed` tells a caller whose entries left that the toggle did not write, so a teammate's hand copy never vanishes unnamed (case=5b). the toggle's own older body is the toggle's to remove, and `disabled (removed)` already says it left. to fold it into `also removed` would name the toggle's own author as a foreign one; to add a third count leaf grows every disable frame for a case only a hand edit or an old version produces.

## .rework — clean

one leaf in `runToggle` and `asTermsHookAlsoRemovedLeaf`; no contract outside the cli frame reads it.

## .confidence — 85%, why not higher

a caller who reads `get` then `disable` back to back sees 3 become 2. the label `the toggle did not write` names why, but only to a caller who reads it as the scope of the count.

## .where

`src/contract/cli/asTermsHookAlsoRemovedLeaf.ts` · `src/contract/cli/learn.terms.hook.ts` (`runToggle`)
