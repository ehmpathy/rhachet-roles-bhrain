# domain.term: target

term.chosen   = target
term.kind     = noun
term.boundary = learn.terms.hook     # the one settings file a toggle verb reads and writes
term.synonyms.forbidden:
- destination  # a read verb has a target too, and a read has no destination
- config       # the file is claude code's settings, not this repo's config

## .what

the **target** is the one claude settings file a toggle verb reads and writes, picked by the
layout: `.claude/settings.of.repo.json` on the split layout, the real `.claude/settings.json` on
the old one. it carries the path, how to name it to a human, and the layout it sits in.

## .refs

- src/domain.operations/learn/termsHook/getOneTermsHookTarget.ts   # `TermsHookTarget`, the pick
- src/domain.operations/learn/termsHook/getOneTermsHookSettings.ts # the read, and its refusals
- src/domain.operations/learn/termsHook/setTermsHookSettings.ts    # the atomic write

## .reason

- `term=learn.terms.hook.target._.choice.reason.md`
