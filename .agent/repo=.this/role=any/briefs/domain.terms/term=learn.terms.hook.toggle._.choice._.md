# domain.term: toggle

term.chosen   = toggle
term.kind     = noun · verb     # the per-repo on/off control, and the act of a flip
term.boundary = learn.terms.hook
term.synonyms.forbidden:
- switch       # `route.guard.brain.switch` already names a different act
- flag         # a flag is a cli argument; the toggle is state in a settings file
- opt-in       # names the default, never the control

## .what

the **toggle** is the per-repo control over the term hook: `enable` turns it on, `disable` turns it
off, `get` reads it. its state lives in the repo's committed claude settings file, as the presence
of one Stop entry, and nowhere else. default off.

## .refs

- src/domain.operations/learn/termsHook/setTermsHookToggle.ts   # the one write path, both verbs
- src/domain.operations/learn/termsHook/TERMS_HOOK_DECLARED.ts  # author `toggle=learn.terms.hook/role=learner`
- src/contract/cli/learn.terms.hook.ts

## .reason

- `term=learn.terms.hook.toggle._.choice.reason.md`
