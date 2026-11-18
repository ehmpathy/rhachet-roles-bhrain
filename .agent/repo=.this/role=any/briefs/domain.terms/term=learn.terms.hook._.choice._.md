# domain.term: hook

term.chosen   = hook
term.kind     = noun
term.boundary = learn.terms     # the learner's onStop term-distill nudge, as one settings entry
term.synonyms.forbidden:
- nudge        # the nudge is what the hook prints at a stale stop, never the entry that runs it
- reminder     # a `route.reminder` is the driver's daemon note, a different mechanism

## .what

the **term hook** is the one claude code Stop entry that runs `learn.domain.terms --when
hook.onStop`, guarded on the learner's role link. at a stop with a stale distillation it holds the
session and prints the nudge; at a fresh one it rests.

the learner role declares no onStop of its own, so the hook exists in a repo only while its
toggle is on.

## .refs

- src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED.ts   # the one entry `enable` writes
- src/domain.operations/learn/termsHook/isTermsHookCommand.ts    # the fragment that marks it
- src/contract/cli/learn.terms.hook.ts                           # the cli surface named after it

## .reason

- `term=learn.terms.hook._.choice.reason.md`
