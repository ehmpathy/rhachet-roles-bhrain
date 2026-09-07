# domain.term: seed

term.chosen   = seed
term.kind     = noun
term.boundary = artifact     # SETTLED 2026-08-31 — a seed is a durable file the repo keeps, and
                             # the boundary is what makes the radio-task sense expressible beside it
term.synonyms.forbidden:
- source
- raw
- notes
- draft

## .what
a **seed** is raw, unrefined source material that a distilled artifact grew from — the words
before they were shaped.

### the two layers, on different contracts

settled 2026-08-31:

| layer | the contract |
|---|---|
| `.said` | **verbatim**, unedited. typos and all; a tidied quote is already a paraphrase |
| every other line | the CONCEPT the utterance planted — what now holds, stated so it stands with no knowledge of the round that heard it |

⇒ **a seed is the seed of a concept, never a chronicle of the round.** the diagnosis trail, the
fulcrum it withdrew, the tool that broke that day — those live in the route's yield and in
`git log`, and a seed that repeats them holds a third copy that drifts from both
(`rule.forbid.chronological-accretion`, ehmpathy/mechanic; the rule's own
`.a seed is the seed of a CONCEPT` section).

🟡 **this is what parts a seed from a bare `.said` block.** the quote is the evidence; the seed is
the concept the quote settled. an entry that stops at the quote plus a changelog has archived the
source and lost the lesson.

### the two names — the split is the itemization one

```
$topic.kind=seed.md                             # a STANDALONE seed — the kind marker carries it
$topic.kind=seed.by_human.md                    # …given verbatim by a human

.seeds/inventory.of=seeds._.md                  # an ITEMIZED set — the summary
.seeds/inventory.of=seeds.case=$id.md           # …and one entry per utterance
```

⇒ in the itemized form the kind marker is **dropped**, because `of=seeds` already declares it —
`rule.forbid.itemization-without-coordinates`'s own line: *the kind decides what each entry
carries; the coordinates decide where each entry sits.* to write `kind=seed` beside `of=seeds`
would state the concept twice.

### the bracket form is forbidden here

🟡 **`$topic.[seed].md` is forbidden** — `[` and `]` are glob metacharacters, so a bracketed name is
silently unmatched by the tools built to find it (`rule.forbid.brackets-in-filenames`, librarian).
the org's published briefs still carry it; that is re-seeded to them, never imported here
(`.dream/v2026_08_14.reseed.kind-coordinate-over-bracket-markers.md`).

### the prose overload against the radio queue

🟡 **`seed` is overloaded in this repo's prose** — the radio queue's tasks are called seeds too.

- that second sense is not this term
- the reason it is tolerated is recorded in the reason file — read it before you use the word in a
  contract

⇒ **the boundary is what makes both senses expressible.**

- `artifact.seed` is the archived source material — a file this repo keeps
- the radio-queue sense names a dispatched task, which is no file here, so it would take a
  different ancestor
- ⇒ that is the flat namespace's one-slot-per-word problem, retired exactly as
  `rule.require.boundary-qualified-terms` prescribes

## .refs
where the term composes declared contracts:
- src/domain.roles/learner/briefs/rule.always.archive-the-wishers-words-verbatim.md  # the rule
                                                                                     # (the driver's copy is a symlink to it)
- .behavior/*/.seeds/inventory.of=seeds.case=*.md                                    # the artifacts
- .agent/repo=ehmpathy/role=mechanic/briefs/practices/code.prod/pitofsuccess.errors/rule.require.failfast.[seed].md
- .agent/repo=ehmpathy/role=architect/briefs/criteria.given_when_then.[seed].v3.md
  🟡 both are org precedent, and both must be quoted LITERALLY — `[` and `]` are glob
  metacharacters, so a tool reaches them only with `--literal` or an escape
  (`rule.forbid.brackets-in-filenames`, librarian). that friction IS the evidence

## .reason
see the ref-level cluster beside this choice:
- `term=artifact.seed._.choice.reason.md` — etymology, the bracket convention, and the radio-task
  overload
