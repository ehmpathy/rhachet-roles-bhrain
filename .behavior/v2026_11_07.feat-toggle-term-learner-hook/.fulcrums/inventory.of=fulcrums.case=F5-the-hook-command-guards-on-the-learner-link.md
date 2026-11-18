# F5 — the hook command guards on the learner link

## .the fork

- **A.** write the bare command, as the withdrawn hook had it: `./node_modules/.bin/rhx learn.domain.terms --when hook.onStop`
- **B.** guard it on the learner's role link: `[ ! -e .agent/repo=bhrain/role=learner ] || <the bare command>`
- **C.** have rhachet prune it on unlink, via a `repo=…/role=learner` author

## .taken — B

the toggle's author is outside `repo=` (F1), so rhachet's prune never removes the entry when the
learner is unlinked, and every toggle verb is gone with the learner. under A each later stop runs
a skill that is gone. B costs one shell test and exits 0 there. C is F1's option A, which the
per-role sync deletes on the next init.

the guard sits in "the hook it adds", which the wish's nano bound permits; the term-distill face is
untouched.

## .rework — clean

one command string, and its match predicate already keys on the `learn.domain.terms --when
hook.onStop` fragment (F3).

## .confidence — 85%, why not higher

the guard's path assumes rhachet links a role at `.agent/repo=<repo>/role=<role>`, as it does in
this repo today; a rhachet that moved the link would leave the guard always true, and the hook
silent. case=9's clamp and a test that the path exists while linked pin it.

## .where

`1.vision.yield.md` `.the contract` · `case=9.the-learner-leaves-and-the-entry-stays-quiet`
