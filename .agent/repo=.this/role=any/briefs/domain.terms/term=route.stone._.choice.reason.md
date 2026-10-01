# domain.term.choice.reason: stone

## .etymology

**stone** — the trail marker.

- the route domain is a *path*, and a stone is what a walker passes on a trail
  - set by those who went before, it tells you where you are without telling you what to do
- **the metaphor is load-bearing rather than decorative** — a cairn on a ridge does not stop a
  hiker; it confirms the way
  - ⇒ that is precisely a stone's job, and the reason the gate is a separate concept

## .the line — stone vs guard

| | is | does |
|---|---|---|
| **stone** | a marker of progress | records that a milestone was reached |
| **guard** | an optional gate on a stone | refuses passage until its conditions hold |

**the decisive case:**

- a stone with no guard is entirely ordinary — it marks progress and lets the traveler drive on
- a gate that validates no condition would be pointless
- ⇒ so the two cannot be one concept: one is meaningful without the other, and not the reverse

## .why not the rejected synonyms

- **checkpoint** — the disputed one; see below. it implies a *gate that validates*, which is the
  guard's job, so it would overload one word onto two concepts
- **waypoint** — navigation jargon, and it names a coordinate to steer toward rather than a
  milestone that was reached. it also breaks the trail metaphor the whole route vocabulary shares
- **step** — silent on the passage record. a step is a thing you do; a stone is a thing that
  **holds state** (`passed`, `approved`, `blocked`, `rewound`). the difference is why the domain
  needs a noun rather than a verb
- **phase** — implies a span of time that contains work, where a stone is the **boundary** of such
  a span. and phases nest and overlap; stones do not
- 🔴 **stage** — added 2026-09-13. the same defect as `phase`, and it reads more innocent: it names a
  span that holds work, so it borrows a stone's identity while it denies a stone's shape. ⇒ see the
  measured case below

## 🔴 .why `stage` slipped past `phase` — the near-synonym a forbid list does not reach

measured 2026-09-13, in `1.vision.yield.md`: `stage` appeared three times as a stone-synonym, and
survived five self-review rounds in a file whose own author had read this list.

| the word | on the forbid list | caught |
|---|---|---|
| `phase` | ✅ since the cluster was written | ✅ never used |
| `stage` | 🔴 absent | 🔴 used three times |

⇒ **a forbid list is a set of strings, and a reader matches against it by string.** `phase` was
present so the author never wrote it; `stage` was absent so no match fired — even though the two
words carry one sense and fail for the identical reason.

🟡 so the general hazard: a forbid list catches the words it lists and licenses their nearest
synonyms. it reads as a semantic guard and behaves as a lexical one.

⇒ the repair is the one taken here — when you forbid a word, forbid its near-synonyms in the same
edit. a list that holds `phase` and not `stage` is one round away from wrong.

### 🔴 and the reach for it was a real distinction with a wrong word

the yield wanted to part *the slot in the route template* from *one drive's transit of it*. that
distinction is genuine, and the glossary already holds both halves:

| the concept | the term |
|---|---|
| the slot in the route template | **stone** |
| one drive's transit of it | **passage** |

⇒ **no third word was owed**, and the third word is what the forbid exists to prevent. 🟡 the tell is
general: a synonym is often reached for to name a distinction the canon already covers — so the
first question is *which extant term names this?*, never *what shall I call it?*

## .disputes

### dispute: checkpoint  —  raised 2026-07-22  —  status: RESOLVED (keep `stone`)
- raised.by  = a traveler
- claim      = "checkpoint" reads clearer to newcomers than "stone"
- counter    = "checkpoint" implies a *gate that validates*; that concept already exists as
               `guard`. a `stone` merely *marks progress*. to merge them would overload one word
               onto two distinct concepts
- resolution = keep `stone`; record `checkpoint` as a forbidden synonym. dispute closed

## .evidence

- **code**: `RouteStone.ts` declares it as a domain object; `RouteStoneGuard.ts`,
  `RouteStoneDisposition.ts`, `RouteStoneDriveArtifacts.ts`, and the four
  `RouteStoneGuard*Artifact.ts` files compose it; `setStoneAsPassed.ts` and the `route.stone.*`
  skills declare it as an operation term
- **the stone/guard split is enforced in code, not merely described**: `define.passage-statuses`
  states that *approval = permission, passage = action*, and only an explicit `--as passed`
  constitutes passage. a guard grants clearance; the stone records the passage. two concepts, two
  mechanisms
- 🟡 the blind-spot instance. `template.domain-term.md` — the repo's own template for how to
  itemize a term — uses `term=stone` as its worked example throughout, and no `term=stone`
  cluster existed until 2026-08-13. the glossary's instruction manual demonstrated the pattern on
  a term the glossary did not contain. the resolved `checkpoint` dispute above was preserved in
  that template rather than in a real cluster, which is where it belongs and where it now sits
- **invariant:** `stone` names a domain object declared in THIS repo and the operation term in
  every `route.stone.*` skill — not generic english
