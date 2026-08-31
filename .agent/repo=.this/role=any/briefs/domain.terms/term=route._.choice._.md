# domain.term: route

term.chosen   = route
term.kind     = noun
term.boundary = repo         # the root subject; no wider context to disambiguate against
term.synonyms.forbidden:
- workflow
- pipeline
- process
- playbook
- procedure

## .what
a **route** is a **paved** path of **stones** a brain walks — the artifact you lay when work needs
judgment at several points, in an order that matters.

it does not remove the brain. it removes the brain's **overhead**: the order, the omissions, the
rediscovery of a path a prior traveler already walked.

⇒ **a solid skill removes the brain. a route removes the wrong turns.**

⚠️ **"paved" above is the declared verb `term=pave`, never loose prose.** the two words name one
concept from two angles: `pave` is the act, `route` is the artifact — and **a route is the one
paved artifact where the metaphor is literal.** a route has an actual path, actual markers, an
actual order a traveler may not skip; a brief and a term cluster are pavement only by analogy. that
asymmetry, and the 🛣️ glyph that was coined at this seam and reverted, are recorded in
`term=externalize.pave._.choice._.md`.

## .a route IS a 🔩 rigid skill

a route is **not** a category beside tools — it is a tool at **rung 3** of the entoolment ladder,
and it meets rhachet's definition of 🔩 **rigid** — *"deterministic entrypoint, mixed operations +
orchestration"*, its words, unedited — exactly:

- 🪨 **deterministic** — the stones, their order, their guards
- 💧 **probabilistic** — the work performed at each stone

and the deterministic half **drives** the probabilistic half: the guard refuses, the prefix computes
what is next, the stophook re-emits the current stone, the ledger holds state on disk. a brain does
not advance because it chose to — a mechanism advances it, or blocks it.

⇒ **a deterministic transport with probabilistic cargo.**

⚠️ **a route is the most GENERAL shape at rung 3, never one shape among several.** rung 3 also
holds a skill that computes its setup and hands one probabilistic step to a brain, and a wrapper
that batches the deterministic half — and **both are specializations of a route**: a route is an
ordered set of stones with guards, so a one-stone route is the first and an all-deterministic route
is the second. any rung-3 shape can be expressed as a route; the reverse does not hold.

⇒ that generality is *why* this org reaches for it most — never a preference.
`philosophy.entoolment-is-the-pinnacle` carries the full argument.

## .refs
where the term composes declared objects & operations:
- src/domain.objects/Driver/RouteStone.ts, RouteStoneGuard.ts, RouteBouncerCache.ts
- src/domain.operations/route/                                  # the operation namespace
- src/domain.roles/driver/skills/route.stone.set.sh             # and every route.* skill
- src/domain.roles/driver/briefs/howto.create-routes.[ref].md
- src/domain.roles/learner/briefs/rule.always.enskill-the-tactics-you-discover.md
- .agent/repo=.this/role=any/briefs/domain.terms/term=externalize.pave._.choice._.md   # the verb this noun instantiates

## .reason
see the ref-level cluster beside this choice:
- `term=route._.choice.reason.md` — etymology, why not `workflow`/`pipeline`, and the
  route-vs-skill line
