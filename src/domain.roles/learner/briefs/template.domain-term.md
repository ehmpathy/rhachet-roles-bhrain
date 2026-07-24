# template.domain-term

## .what

the shape of a `choice._.` cluster under `.agent/repo=.this/role=any/briefs/domain.terms/`. one
cluster per term (one word), reused across every domain object/operation that word composes.

each cluster has two levels:

- **say-level** — `term=<x>._.choice._.md` — lean, always booted into context. carries only the
  data: the chosen word, its kind, its forbidden synonyms, the refs, a one-line `.what`.
- **ref-level** — `term=<x>._.choice.reason.md` (**required**) — deep, surfaced on demand:
  etymology, disputes, evidence. plus optional `term=<x>._.choice.example=<abc>.md`, one per
  notable example.

## .why the `term=<x>._.choice.*` shape

- `term=<x>._` marks the term as a **cluster root**, so future facets beyond `choice` can be
  added later (e.g. `term=<x>._.usage.*`)
- within it, `.choice.*` is the term-choice facet: a lean `.choice._.md` root, plus ref-level
  members `.choice.reason.md` and one-per-example `.choice.example=<abc>.md`
- the say/ref split keeps the always-booted footprint lean while the full record lives on demand

---

## the say-level template — `term=stone._.choice._.md`

```md
# domain.term: stone

term.chosen   = stone
term.kind     = noun                 # noun | verb | adj — the part of speech, reused across objects & operations
term.synonyms.forbidden:
- checkpoint
- milestone-marker
- waypoint

## .what
a single milestone on a route.

## .refs
where the term is declared / used, plus notable examples (a term is reused across many):
- src/domain.objects/Stone.ts            # the domain object
- src/domain.operations/route/getStone.ts
- src/domain.operations/route/genStone.ts

## .reason
see the ref-level cluster beside this choice:
- `term=stone._.choice.reason.md` — etymology, disputes, evidence
- `term=stone._.choice.example=<abc>.md` — one file per usage example
```

> the say file carries **data only** — no `.forbid` prose. the rule
> `rule.forbid.domain-term-synonyms` governs the forbid once, for all terms; the file just lists
> which words are the forbidden synonyms of this term.

---

## the ref-level template — `term=stone._.choice.reason.md`

```md
# domain.term.choice.reason: stone

## .etymology
why `stone`: the route domain is a *path* of markers; a stone is a marker you pass on a trail.
chosen over `checkpoint` (implies a gate/validation — that is the `guard`'s job) and `waypoint`
(navigation jargon, not the trail metaphor).

## .disputes
### dispute: checkpoint  —  raised 2026-07-22  —  status: RESOLVED (keep `stone`)
- raised.by  = <traveler>
- claim      = "checkpoint" reads clearer to newcomers than "stone"
- counter    = "checkpoint" implies a *gate that validates*; that concept already exists as
               `guard`. a `stone` merely *marks progress*. to merge them would overload one word
               onto two distinct concepts.
- resolution = keep `stone`; record `checkpoint` as a forbidden synonym. dispute closed.

## .evidence
- discovery: <dimensional decomposition / scenario narrative / citation — per architect howto>
- invariants: <forbidden combinations / states / refs, if a dobj>
```

---

## the example-level template — `term=stone._.choice.example=trail-marker.md`

```md
# domain.term.choice.example: stone — trail-marker

a route is walked one stone at a time, the way a hiker passes one trail-marker at a time.
each stone marks *how far along* — it does not gate passage (that is the `guard`).
```

---

## .the rules this template serves

the glossary dir's own `.readme.md` names the rules by name — read it there so this template
never drifts from the canon:

- `.agent/repo=.this/role=any/briefs/domain.terms/.readme.md` — names the rules that rule the dir
- `howto.domain-term-disputes.[guide].md` — the dispute pattern the `.reason` file records

## .mantra

> one word, one cluster — say lean, reason deep 📜
