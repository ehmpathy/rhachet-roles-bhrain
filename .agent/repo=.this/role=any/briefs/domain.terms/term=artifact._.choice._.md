# domain.term: artifact

term.chosen   = artifact
term.kind     = noun
term.boundary = repo         # the root subject; no wider context to disambiguate against
term.synonyms.forbidden:
- file           # names the STORAGE unit, not the deliverable. a term cluster is three files
                 # and one artifact
- document       # the librarian's declared archetype word (`kno201.documents`) — a
                 # materialization of a concept. a skill is an artifact and is no document
- output         # names the relation to a producer. an artifact outlives its producer
- deliverable    # implies a recipient who asked. most artifacts here are volunteered
- record         # narrower — a record attests. an artifact may also DO work (a skill)
- asset          # finance register

## .what

any durable product this repo makes and keeps — a brief, a skill, a route yield, a fulcrum entry,
a seed, a dream, a term cluster, a review articulation.

**the widest ancestor in this glossary.** it is what a `tool`, a `dream`, and a `withdraw` are
each *of*.

| the word | what it names |
|---|---|
| **artifact** | any durable product. **the umbrella** |
| **tool** | the artifacts a future traveler *reuses* — every rung of the entoolment ladder |
| **skill** | the mechanized rungs, 2 through 4 |

⚠️ **an artifact is not always a tool.** a route yield is an artifact and is not one — nobody
reuses it, they read it once. that is the exact distinction `term=artifact.tool` records when it forbids
`artifact` as its synonym.

## .what it EXCLUDES

- an **act** — a drive, a review round, a sweep. an act produces artifacts and is not one
- a **concept** — the pattern a brief materializes
  (`kno101.primitives.5.concepts`, librarian). the concept outlives every artifact of it
- an **instance** — a raw atom of data or experience (`kno101.primitives.3.instances`)

## .refs

where the term composes declared contracts:
- .agent/repo=.this/role=any/briefs/domain.terms/term=artifact.tool._.choice._.md
- .agent/repo=.this/role=any/briefs/domain.terms/term=artifact.tool.skill._.choice._.md
- .agent/repo=.this/role=any/briefs/domain.terms/term=artifact.dream._.choice._.md
- .agent/repo=.this/role=any/briefs/domain.terms/term=artifact.withdraw._.choice._.md
- .agent/repo=.this/role=any/briefs/domain.terms/term=artifact.seed._.choice._.md

## .reason

see the ref-level cluster beside this choice:
- `term=artifact._.choice.reason.md` — the enumeration, and the three boundaries it closes
