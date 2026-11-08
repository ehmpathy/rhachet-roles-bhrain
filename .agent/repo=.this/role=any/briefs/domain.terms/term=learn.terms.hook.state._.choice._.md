# domain.term: state

term.chosen   = state
term.kind     = noun
term.boundary = learn.terms.hook     # what one read of the target finds about the term hook
term.synonyms.forbidden:
- mode         # `--mode plan | apply` is the repo's word for a run's dry/real choice

## .what

the **state** is what one read of the target finds about the term hook: its **status** — `off`
(no entry), `current` (the declared entry alone, whole), or `drifted` (term hook entries to repair)
— and, when drifted, the drift count. `get` reports it; `enable` and `disable` decide from it.

## .refs

- src/domain.operations/learn/termsHook/getOneTermsHookState.ts   # `TermsHookStatus`, the one read
- src/domain.operations/learn/termsHook/asTermsHookNoopOutcome.ts # the no-op each verb settles at

## .reason

- `term=learn.terms.hook.state._.choice.reason.md`
