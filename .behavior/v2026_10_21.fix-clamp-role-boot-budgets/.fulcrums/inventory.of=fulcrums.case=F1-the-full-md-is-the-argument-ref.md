# F1 — the full `.md` beside each `.md.min` is the argument's ref home

## the fork
- (a) rewrite each `.md.min` to cue-only; the extant `.md` beside it already holds the argument, so the min points to it
- (b) eject each argument into a new `define.$concept.md` at ref, per `rule.prefer.rules-that-refout`'s shape

## taken: (a), and why at the time
- every boot-time rule here already has a `.md` + `.md.min` pair, and both ship in `dist` (verified: `dist/domain.roles/learner/briefs/rule.require.a-cue-is-not-a-claim.md` + `.md.min`)
- the `.md` already holds every argument line, so (a) moves no content and deletes none
- (b) would double the files and copy argument text out of a `.md` that keeps it anyway — two homes for one argument

## rework: clean
a later move to `define.*` files is additive: the min's pointer line changes target. no caller hardens against it.

## confidence: 85%, low because
`rule.prefer.rules-that-refout` names `define.$concept.md` as the argument home, and the wish says "a ref file beside it". (a) satisfies "beside it" literally, but not the define-file shape that rule shows.

## where
every `.md.min` the three roles boot at say.
