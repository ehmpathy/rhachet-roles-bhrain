# domain.term: polluter

term.chosen   = polluter
term.kind     = noun
term.boundary = review.scope   # a file the scope would carry, and should not
term.synonyms.forbidden:
- noise
- cruft
- junk
- chaff
- exclusion

## .what

a polluter is a file that would enter a review's `targetFiles` and must not — because it is
paperwork about the work rather than the work itself.

three classes, and the set is closed:

| class | what |
|---|---|
| **route paperwork** | every artifact under a route variant dir, except `.fulcrums/**`, `.seeds/**`, `*.yield.md` |
| **a dream** | every file under `.dream`, and every route `dreams` symlink into it |
| **a lockfile** | `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock` |

a polluter is defined against the scope, never against the repo. the same file is a
perfectly good artifact in its own right — a peer review is how a driver converges, a dream is how
a followup survives. it pollutes only when it reaches a reviewer as a target.

and the source decides. a file that rode in on a `--diffs` range is incidental; a file a
specific `--paths` glob named is the caller's declared subject, so it is not a polluter at all —
a lane that reviews a route's own deliverable would otherwise scope to zero.

dropped by default when incidental; kept when named; `--polluters keep` is the blunt escape.

## .why the word carries a judgement

most candidates name the file's quality (`noise`, `cruft`, `junk`, `chaff`) and that is a lie: a
`.given.by_peer` is a careful artifact, and a lockfile is exactly correct. the defect is where it
lands, never what it is — and `pollute` is the one word that names a subject by the harm it does
in a place it does not belong.

and it is measured, so the judgement is earned rather than rhetorical: **13.9%** of the largest
real prompt this repo has produced, plus an independence cost no meter can price.

## .refs

where the term composes declared objects & operations:
- src/domain.operations/isTargetPolluter.ts          # the one shared decision
- src/domain.operations/isTargetPolluter.test.ts     # the clamp, per class
- src/domain.operations/review/getAllTargetsAskedForByName.ts  # the by-name exemption
- src/domain.operations/review/getAllTargetsAskedForByName.test.ts  # its specificity bound
- src/domain.operations/review/stepReview.ts                # the filter + the record
- src/domain.operations/review/stepReview.casePolluters.integration.test.ts  # the four modes, end to end
- src/contract/cli/review.ts                                # `--polluters drop|keep`
- .agent/repo=.this/role=any/briefs/rule.require.exclude-review-scope-polluters.md

## .reason

see the ref-level cluster beside this choice:
- `term=review.scope.polluter._.choice.reason.md` — etymology, the rejected synonyms, and why the
  route VARIANT is matched at the repo root
