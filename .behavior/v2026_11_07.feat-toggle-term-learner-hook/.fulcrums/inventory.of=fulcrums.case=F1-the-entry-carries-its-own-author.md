# F1 — the entry carries its own author

## .the fork

- **A.** write the Stop entry under the learner's author, `repo=bhrain/role=learner`
- **B1.** write it under a bare toggle author, `toggle=learn.terms.hook`
- **B2.** write it under `toggle=learn.terms.hook/role=learner` — a first segment outside `repo=`, plus the learner's `role=` segment
- **C.** declare the onStop in the role always, and have the hook short-circuit when a repo flag is off

## .taken — B2

three rhachet gates read the author, each a different way (rhachet 1.51):

| gate | reads | A | B1 | B2 |
|---|---|---|---|---|
| per-role sync (`syncOneRoleHooksIntoOneBrainRepl`) | exact `repo=bhrain/role=learner`; deletes undeclared | 🔴 deleted | kept | kept |
| orphan prune (`pruneOrphanedRoleHooksFromOneBrain`) | `^repo=.+\/role=.+$`, absent from linked roles | kept while linked | kept | kept |
| peer-actor narrow (`getSettingsForRoles` via `asRoleSlugOfHookAuthor`) | the `role=` segment, against the actor's roles | kept for learner actors | 🔴 dropped for every peer actor | kept for learner actors |

only B2 survives all three. A dies on the next `rhx init --hooks`. B1 reaches the repo actor alone,
never an enrolled clone. C puts a process on every stop of every repo, the cost the wish forbids.
B2 also scopes the nudge as the withdrawn hook was scoped: to actors that hold the learner.

## .rework — clean

the author string is one constant; a change rewrites one literal and its clamps.

## .confidence — 85%, why not higher

it rests on three read rules observed in rhachet 1.51 source, none declared as a contract. case=3's
clamps pin all three: revert to A → the sync clamp is red; revert to B1 → the peer-actor clamp is red.

## .where

`1.vision.yield.md` · `case=3.the-toggle-survives-a-resync`
