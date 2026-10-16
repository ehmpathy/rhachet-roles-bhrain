# rule.require.exclude-review-scope-polluters

> a review scope carries the work. it does not carry the paperwork about the work.

`rhx review` drops, by default, every route artifact except three, every caught dream, and
every dependency lockfile. what survives a route is an allowlist:

```
.fulcrums/**    the design forks a reviewer must weigh
.seeds/**       the wisher's verbatim words
*.yield.md      what each stage actually produced
```

all else a route holds — the wish, the stones, the guards, the stamps, the passage ledger, the
experience demos, the peer reviews, the self reviews, the appendix, the blocker, the symlinked
dreams — is a polluter, and is dropped.

## .why — it costs twice, and only one of the two is a number

### 1. the money, measured

over the largest real prompt this repo has produced — 2,507.7k chars, 251 targets:

| polluter | chars | share |
|---|---|---|
| the `.dream` queue | 185.2k | 7.4% |
| a route's `dreams` symlink dir — the same bytes, a second time | 131.2k | 5.2% |
| `pnpm-lock.yaml` | 31.4k | 1.3% |
| **total** | **348.0k** | **13.9%** |

the middle row is the one to read twice. `rule.always.catch-dreams-for-followups` requires
a symlink from the route that caught a dream back into `.dream/`, so every caught dream
reaches the scope twice — 22 of 22 slugs duplicated, when measured.

### 2. the independence, which no meter can price

a route's `.reviews/peer/**` holds what other lanes concluded about this very artifact.

- a lane whose scope includes them can read a peer's verdict and echo it
- N reviews report as independent while they are not, and every lane is still well-formed:
  the counts parse, the verdicts render, the guard tallies
- the first cost shows up on a bill. this one shows up as a defect nobody caught, in a round
  that looked like it had nine reviewers and had fewer

### 3. a dream is a future task, and a reviewer grades the present

`.dream/` names work nobody has done. a reviewer that reads one grades an intention. the
commonest failure shape is a lane that raises, as a blocker, a defect the repo has already
caught, argued, and deliberately deferred — which is a round spent to re-derive a decision.

## .the trap that makes this a rule rather than a glob

> a polluter drop expressed as a negative glob binds one of the two target sources, and reads
> as though it bound both.

`--paths-wout` is applied by `enumFilesFromGlob`, which enumerates the `--paths` side. a
`--diffs` range never passes through it. so `--paths-wout '.dream/**'` looks correct, tests
green on a paths-only fixture, and lets every dream through on a diffs-driven lane — which is
every guard-run lane in this repo.

so the decision lands after the join, over the united scope, in one shared transformer
that the filter and the record both read (`isTargetPolluter`). per `isTargetDiffSent`'s
lesson: an extracted decision binds only the call sites someone wired to it.

## .a behavior is a specific kind of route — never the category

`howto.create-routes` declares the shape outright:

```
.route/      the default variant for most routes
.behavior/   behavior-driven routes
.$custom/    custom variants as needed
```

a rule keyed on `.behavior` alone lets every `.route/v*` route's paperwork straight through.
this repo runs seven of them, and `.route/v2026_09_16.goal=acceptance-under-5min` carries
stones and yields exactly as a behavior does.

### and the fix for that is not a structural detector

the obvious repair — "a route is any dir with a `.route/` inside" — is worse than the defect
it repairs. seven dirs in this repo are named `.route` and hold no route at all, and they
carry 33 files between them:

```
src/domain.roles/thinker/.route/                          chance.*.md brief drafts
five more under thinker's .scratch tree                   the same drafts
src/domain.roles/thinker/briefs/thinker.tactics/.route/   [.brief.*].md drafts
```

keyed structurally, "all except the allowlist" drops the entire thinker role — real
source, real briefs — from every review scope. and the review still runs clean, so no
assertion anywhere else goes red.

route discovery may key structurally, and does. `getAllBindFlagsByBranch` globs for a
`.bind.$branch.flag` inside a `.route/`, and can afford it because the bind flag is the
discriminator — the seven dirs above hold none, so they never match. this rule's subject is a
bare path, which carries no flag, so the variant name is the only discriminator left.

the variant is therefore matched at the repo root, as a declared set. explicit beats
clever when the failure mode is a silent deletion.

## .it drops what rode in — never what a caller asked for by name

a polluter is defined against the scope, never against the repo. so the drop parts the two ways
a file enters one:

| the source | what it carries | graded |
|---|---|---|
| `--diffs <range>` | whatever changed | incidental — a polluter here rode in |
| `--paths <glob>` | what somebody typed | deliberate — a polluter here is the subject |

a lane whose subject is a route's own deliverable binds it by name, and this repo holds
78 such binds across 38 guards:

```
--diffs since-main --paths-with '$route/3.3.blueprint.*.md' --join intersect
```

a side-blind drop empties that lane's scope and refuses before the brain is reached. so a
polluter a positive glob named is kept, at the default mode, with no flag.

### the bound — a glob exempts only where every target it matched is a polluter

the naive form ("matched by any positive glob") hands a catch-all a total exemption, which
voids the default on the widest lanes — the ones it most exists for. so a glob earns the
exemption only when it is specific: it named paperwork and named naught else.

it is computed from the matched set rather than parsed out of the pattern, so no glob grammar
is reimplemented and a future wildcard form cannot slip past it.

the residual hole, stated rather than hidden: a catch-all over a corpus that happens to hold
only polluters reads as specific, so no file drops. benign — such a scope would otherwise refuse
as empty, so the caller sees their files either way.

## .the override — a default, never a law

`--polluters keep` restores the full scope. a driver who reviews the route machinery itself
has a real subject, and the default must not become a wall
(`rule.prefer.defaults-match-common-case`: the bare invocation serves the common case; the
flag serves the rest).

and it is the blunt escape, never the everyday one — the by-name exemption above already
serves the common case with no flag at all.

an unrecognized mode refuses rather than falls through to the default — the two modes
sit on opposite sides of a 13.9% scope, so a typo that reads as `drop` hands the caller the
scope they asked to keep, with no signal (`rule.forbid.failhide`).

## .and the drop is reported, by name

`input.scope.debug.json` records `resolution.targetFilesDropped` — every path, not a count.
when the drop empties the scope, the refusal names it and names the flag.

> a drop nobody can see is a drop nobody can debug.

a driver who asks "why is my file absent from the review?" reads the list and has the
answer. with a count alone, the file is simply gone and the next move is a bisect.

and the exemption is recorded beside it — `resolution.targetFilesAskedForByName`. the same
argument, inverted, and this is the half a reader is likelier to doubt: a file absent from a scope
reads as expected, where a `.dream/` file present in one reads as "the filter is broken."

the drop list alone cannot part the two exemptions, because it is empty under both: a polluter
kept by name and a polluter kept by `--polluters keep` look identical in it. the by-name list is
what says which, and `args.polluters` is the discriminator behind it.

| when… | then… |
|---|---|
| you add a new artifact kind to a route | it is excluded by default. argue it in, or it never reaches a reviewer |
| you reach for `--paths-wout` to exclude a class | the strongest cue. it binds the `--paths` side only. the scope filter is the lever |
| a lane cites another lane's verdict | its scope carried `.reviews/**`. the independence claim was false that round |
| you add a route variant (`.$custom/`) | add it to `SEGMENTS_OF_ROUTE_VARIANT`, or its paperwork ships |
| a reviewer raises a defect the repo already deferred | it read a dream. check the scope before you answer the point |
| you would key the route detector on a `.route` dir at any depth | seven non-routes in this repo match, across 33 files. the repo-root bound is what holds |
| a review's scope is empty and the globs look right | read `targetFilesDropped` before you re-tune the glob |
| a lane reviews a route artifact (a vision, a blueprint, a criteria) | bind it by name in `--paths`. it is your subject, so it is kept — no flag owed |
| you would widen a lane's glob to catch one polluter | the widen costs the exemption: a glob that also reaches source stops to be specific |

## .enforcement

blocker: a review scope that carries a route's peer reviews, self reviews, stones, guards,
or wish · a scope that carries `.dream/` or a route's `dreams` symlink · a scope that carries
a dependency lockfile · a polluter drop expressed as a negative glob rather than applied
after the join · a polluter rule keyed on `.behavior` alone · a polluter rule keyed structurally
on a `.route` dir at any depth · a drop with no per-path record · an exemption with no per-path
record (the two are empty under both modes, so neither alone parts them) · a drop that is blind to
which source carried the file (it empties every lane that reviews a route deliverable) · an
exemption granted to a glob that also matched a non-polluter.
nitpick: a new route artifact kind added with no note on why it is or is not allowlisted.
false positive: a scope that carries them under an explicit `--polluters keep` · a scope that
carries a polluter a specific positive glob named.

see also: `isTargetPolluter` (the one shared decision) · `getAllTargetsAskedForByName` (the
by-name exemption, and its bound) · `isTargetDiffSent` (the precedent — one decision, every
reader) · `rule.always.catch-dreams-for-followups` (why a dream is present twice) ·
`howto.create-routes` (the variant grammar) · `research.review-cost-and-cache` (the measurement).
