# domain.term: drift

term.chosen   = drift
term.kind     = noun
term.boundary = learn.terms.hook     # term hook entries that differ from the declared one
term.synonyms.forbidden:
- stale        # `stale` names a distillation past its hour, the hook's own trigger
- legacy       # dates the entry; drift may be a hand copy written today

## .what

**drift** is every term hook entry in the target other than the declared one, whole: an older body
(another timeout, an unguarded command), a second copy, or a hand copy under another author. `get`
counts it and names `enable` as the repair; `enable` replaces it with the one declared entry;
`disable` removes it with the rest.

## .refs

- src/domain.operations/learn/termsHook/getOneTermsHookState.ts   # the count, status `drifted`
- src/domain.operations/learn/termsHook/asSettingsWithTermsHook.ts # the converge
- src/contract/cli/asTermsHookDriftLeaf.ts                        # the leaf a human reads

## .reason

- `term=learn.terms.hook.drift._.choice.reason.md`
