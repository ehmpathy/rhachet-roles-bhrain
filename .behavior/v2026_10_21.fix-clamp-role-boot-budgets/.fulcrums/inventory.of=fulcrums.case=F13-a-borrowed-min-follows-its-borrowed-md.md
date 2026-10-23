# F13 — a borrowed min follows the mechanism its borrowed `.md` already uses

## the fork

the driver boots the learner's `rule.forbid.verbatim-quotes-outside-seeds`. on main, the driver's
`.md` is already a symlink to the learner's. this pr gives that brief a min, and the driver must
boot the min too.

- **A** — a symlink for the min beside the extant `.md` symlink, as the driver already does for
  `rule.always.archive-the-wishers-words-verbatim` (both `.md` and `.md.min` are symlinks on main)
- **B** — a copy of the min in the driver's dir
- **C** — move the shared rule to one shared home both roles read

## taken: A, and why

- the mechanism is extant. `git ls-tree HEAD src/domain.roles/driver/briefs/` lists three symlinks
  into the learner's briefs before this pr: the `archive-the-wishers-words` pair and the
  `verbatim-quotes` `.md`. a min symlink beside its `.md` symlink adds no new tie between the
  roles; it keeps the pair whole, so the driver's `.md` and min cannot point at two owners
- **B** forks the cue into two hand-kept copies, which is the drift this pr's F8 dream exists to
  close
- **C** has no shipped home today. `.agent/repo=.this/role=any/` is not built into `dist`; a
  consumer of the package never sees it. a shared `src/domain.roles/` brief dir is a new
  convention for every borrowed rule across every role, wider than a boot-budget pr

the break the reviewer names is real and is already caught: if the learner renames the brief, the
driver's symlink dangles, and `roleBootClamps` fails its `.md`-peer check and `roles boot` (both
read the driver's own boot spec).

## rework: dirty

a shared home touches every borrowed rule in every role, their boot specs, and the build copy
rule. that is why it is deferred, and why this is a fulcrum.

## confidence: 75%, and why it is not higher

- a symlink between two roles' dirs ties them by path, which the scope-leak rule forbids in
  general. the extant pair is precedent, and precedent is a reason to look, never to conform
- a shared-brief home may be the right design, and it is caught as a dream so it is not lost

## where

`src/domain.roles/driver/briefs/rule.forbid.verbatim-quotes-outside-seeds.md{,.min}` · peer
`arch-smell-scopeleaks` i001 blocker.2 · F3 (the choice to double-boot, which this fulcrum's
mechanism serves).
