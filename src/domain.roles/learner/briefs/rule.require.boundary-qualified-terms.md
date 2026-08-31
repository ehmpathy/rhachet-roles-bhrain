# rule.require.boundary-qualified-terms

## .what

> **every term ANSWERS its boundary in its header, and CARRIES it in its filename — always, as the
> full path from the root.**

```
term=$ancestor…$boundary.$word._.choice._.md
term=$ancestor…$boundary.$word._.choice.reason.md
term=$ancestor…$boundary.$word._.choice.example=$id.md
```

```
👎  term=rung._.choice._.md                    # flat — WHOSE rung?
👎  term=guard.rung._.choice._.md              # one segment — disambiguates, and slices none
👍  term=route.guard.rung._.choice._.md        # a gate-position on a stone's review ladder
👍  term=entoolment.rung._.choice._.md         # a position on the determinism ladder

👎  term=stone._.choice._.md                   # flat, though `stone` holds ONE sense here
👍  term=route.stone._.choice._.md             # the path is the same shape for every term
```

⇒ **a term with one sense carries its boundary exactly as a colliding one does.** the form does not
branch on whether a collision happens to exist.

## .why a boundary at all — the flat namespace collides, and this repo holds the proof

**`rung` carries two senses in this repo, and both are correct:**

| the sense | where it is declared | what it means |
|---|---|---|
| a gate-position | `term=route.guard.rung._.choice._.md` | *"a single gate-position in a guarded stone's one ordered ladder"* — peer levels + the judge |
| a determinism position | 🔴 **owed** — `philosophy.entoolment-is-the-pinnacle._.md` carries the sense, and no cluster declares it | rung 0 🧠 tribal → 1 📚 brief → 2 💪💧 fluid → 3 💪🔩 rigid → 4 💪🪨 solid |

both are legitimate. both are ladders. **neither is a synonym of the other**, so
`rule.forbid.domain-term-synonyms` cannot settle it — that rule bans *two words for one concept*
and *one word for two concepts*, and the honest resolution here is not to rename either sense. it
is to **say which ladder you mean.**

⇒ **a flat namespace has exactly one slot per word, so it forces a false choice** between two true
senses. a qualified namespace has one slot per *(boundary, word)* pair, and both fit.

⚠️ **the second sense is the sharper half of the example**, because its boundary would be
`entoolment`, whose own chain reaches no root. so the collision is real, one side is declared, and
the other waits on a family settlement — **that is what an owed boundary looks like in practice.**

### the three costs a flat term imposes

| cost | how it lands |
|---|---|
| **the reader must guess** | a `.refs` line that cites `rung` does not say which ladder; the reader opens the file to find out |
| **the glossary cannot grow** | the next term is one word away from a collision with an extant one, and the author cannot see it approach |
| **a contract reads two ways** | `rule.forbid.domain-term-synonyms` binds a term on every contract. a term that reads two ways binds ambiguously, which is the exact defect the glossary exists to retire |

## 🔴 .why ALWAYS, and why the FULL path

three properties, and each one is lost by a narrower form.

### 1. a name is computable only if the rule that makes it is UNIFORM

this is the decisive one. a reader who knows a term wants to open its file **without a search**.
under a carry-on-collision rule they cannot: the path depends on whether that word happens to
collide *somewhere else in the glossary*, which is a fact about a different file.

⇒ **a conditional naming rule makes every path a lookup.** that destroys the exact property
`rule.forbid.itemization-without-coordinates` exists to protect, and it destroys it for **all 27
terms**, not merely the colliding ones.

### 2. every prefix becomes a real slice

```
term=route.*           # the whole route domain
term=route.guard.*     # the guard subdomain within it
term=glossary.*        # the glossary domain
```

a one-segment boundary gives a reader the leaf's parent and no slices above it. **the full path is
what makes the glossary navigable by subtree** rather than by an alphabetical interleave of 27
unrelated words.

### 3. the header and the filename cannot drift

with the boundary in both, one is a copy. **with it in the filename, the filename IS the
declaration** and the header restates it for a reader who has the file open — a restatement a
`Glob` can check mechanically.

## .the counter-argument — the case for a narrower form, and why it loses

the strongest case against this rule is that it over-reaches: *answer the boundary always, but
carry it in the filename only where a word actually collides.* three claims support it, and each
one has an answer.

| the claim | why it does not hold |
|---|---|
| *"the blanket form is unsatisfiable — most terms have no boundary settled"* | an **unfilled field is not an unanswerable question.** once every cluster answers its header, the blanket form binds every settled term; the unsettled ones are a recorded gap, not a reason to weaken the form |
| *"the rename buys no clarity where there is no ambiguity"* | it buys **uniformity**, which is worth more than the disambiguation. a carry-on-collision rule optimizes the one term that collides and taxes the twenty-six that do not |
| *"a boundary answers 'which one?', not the whole taxonomy"* | `repo=bhrain/role=driver/` **is** a taxonomy path, and this repo dereferences by it everywhere. an exception for terms would have to be argued, and there is no argument for it |

⇒ **the through-line: the narrow form weighs the COST of a rename against the BENEFIT to the one
term that collides, and never prices the benefit to every other term.** a scoped benefit against a
real cost loses; a universal one wins.

⇒ the wisher settled this directly — see
`$route/.seeds/inventory.of=seeds.case=S16-a-term-carries-its-full-boundary-path.md`.

## ⚠️ .this exposes a prerequisite — the boundary taxonomy must reach a ROOT

a full path is computable only if **every boundary name itself reaches a root**. that holds today
for some chains and not others:

| chain | reaches a root? |
|---|---|
| `rung` → `guard` → `route` → `repo` | ✅ `route.guard.rung` |
| `articulation` → `progress` → `sweep` → `glossary` → `repo` | ✅ though four deep |
| `tallier` → `review` → **?** | 🔴 `review` is not a declared term |
| `inventory` → `itemization` → **?** | 🔴 `itemization` is not a declared term |
| `body` → `stdout` → **?** | 🔴 `stdout` is not a declared term |

⇒ **a boundary that names no declared term is a term this glossary owes.** that is a new and
checkable gap class, and it is invisible under a header-only rule — a header accepts any word,
where a path demands the word have a recorded place.

⚠️ **a boundary may still be a subdomain name rather than a term** (see below); what it may not be
is a name whose own place is unrecorded. the fix is to declare it, or to re-settle the child's
boundary onto one that does reach a root.

## .the boundary is the SUBDOMAIN, never the role

this is the call that decides every filename, so it is stated plainly:

| axis | example | verdict |
|---|---|---|
| the **role** — who tends the word | `term=driver.rung`, `term=learner.rung` | 👎 |
| the **subdomain** — where the word holds its sense | `term=review.rung`, `term=entoolment.rung` | 👍 |

**why the role fails the very case that motivates the rule.** a driver cares about *both* ladders —
it climbs review rungs and it reads entoolment rungs. so `driver.rung` disambiguates neither, and
the collision survives the rename.

⇒ a role names **who tends the word**. a subdomain names **where the word means what it means.**
only the second one disambiguates, because ambiguity is a property of context, never of ownership.

## .the cues — when → then

| when… | then… |
|---|---|
| you **pave a new term** | 🔴 name its boundary **first**, then the word. the boundary is not a suffix you add later |
| you **touch** a flat term's cluster for any reason | fix it forward — rename it on the way through (*.fixforward*) |
| you cannot name the boundary in one word | 🔴 **the strongest signal there is** — you have not settled what the term is *of*. that is a discovery gap, not a name gap |
| two candidate boundaries both fit | the term is doing two jobs. **split it into two terms**, one per boundary |
| you cite a term in a `.refs` or `.see also` | cite the qualified form — an unqualified citation is the ambiguity, relocated |
| a term's boundary is *this repo itself* | it still gets one. `repo` is a boundary; *"it is obvious"* is not |

## .the test — forced articulation

before the cluster lands, answer on the page:

> **"$word, of WHAT?"**

- you can answer in one word → that word is the boundary. **write it into `term.boundary`**
- you can answer only in a sentence → the boundary is undiscovered. **record the gap in the
  `.reason`, and say what the candidates are** — an unnamed boundary is a discovery gap, and a
  recorded gap is what lets the next reader close it
  (`rule.require.domain-discovery-for-term-proposals`, architect)
- you can answer **two** ways → 🔴 the term holds two senses. **carry the boundary in the filename**,
  one cluster per sense

⚠️ this test is answerable at **authorship**, which is the whole point. a collision found later
costs a rename plus every citation; a boundary named up front costs one word.

## 🔴 .a FAMILY is settled once, never one term at a time

when several terms share one ladder and one verb-shape, their common boundary is one decision. a
per-term guess fractures a family that is coherent today, and the fracture is invisible until a
reader tries to slice on the prefix and gets half the set.

⇒ **the live gaps are recorded in `domain.terms/.readme.md`**, which is where a census belongs: a
gap list inside a rule rots the moment a gap closes, and the rule outlives every one of them.

## 🔴 .answer the test from the term's own `.what`, never from the family it sits near

**a gap claimed from adjacency is a gap that was never checked.** the `"$word, of WHAT?"` test
reads one thing: the cluster's own declared sense. a word that *feels* adjacent to an unsettled
family reads as unsettled too, and it often is not.

two terms in this glossary sit one row from the `en-` family and answer in one word each:

| the term | what an adjacency read suggests | what its `.what` declares | boundary |
|---|---|---|---|
| `body` | the `en-` family's subject matter | *"the body of a captured skill **stdout**"* — no relation to externalization at all | `stdout` |
| `sweep` | *"the learner's pass over WHAT?"* reads open-ended | *"over the **domain terms** a round touched"* — the glossary, in one word | `glossary` |

⚠️ **this is the actor-over-subject error, one level down.** a brief's home is its actor, not its
topic (`rule.require.specialize-a-rule-its-readers-look-past`, and the S13 seed); a term's
boundary is its **declared sense**, not the family it sits near.

⚠️ **and `malfunction` is a watch, not a gap.** its boundary is `review`, and it holds one sense
there — but the word also grades a skill's exit code. that becomes a second sense the day the
exit-code use is declared, and then the boundary is carried.

## .a boundary is a SUBDOMAIN NAME, and the path is its ANCESTRY

`rung`'s boundary is `guard`; `guard`'s is `route`; `route`'s is `repo`, the root. so the filename
is the chain, from the root down:

```
👍  term=route.guard.rung._.choice._.md
```

⇒ **a boundary names the context in which the word means what it means. the path names every
context that contains it.** the first answers *"which one?"*; the chain answers *"where does it
sit?"* — and only the chain makes `term=route.*` a slice.

⚠️ **the root itself is dropped.** `repo` is the universal ancestor of every term in this glossary,
so it adds one segment to all 27 paths and distinguishes none of them. a segment that appears
everywhere carries no signal — the same claim `rule.forbid.brackets-in-filenames` makes about a
repeated archetype marker.

### the depth is whatever the ancestry is — long is legal

```
👍  term=glossary.sweep.progress.articulation._.choice._.md    # four deep, and correct
```

a deep path is a fact about the domain, never a smell. **the shorter path is available only by a
drop of a real ancestor**, and a dropped ancestor is the slice that stops working.

⚠️ **the one thing to check at depth: is each segment a real ancestor, or did you name a topic?**
`articulation` sits inside `progress` inside `sweep` because each is declared so in the header
above it — the chain is read, never composed by feel. that is the same defect the adjacency test
above catches, one level up.

### a multipart SEGMENT is still one segment

```
👍  term=route.guard.review.peer.rung     # `review.peer` is one subdomain whose name is two words
```

the test is not *"how many dots?"* — it is **"is each name in the chain either an ancestor, or part
of one subdomain's own NAME?"** an ancestor is kept; a two-word subdomain keeps both words.

## .fixforward — never a sweep

**an extant flat term is left in place until disturbed.** when you touch its cluster for any
reason, rename it on the way through. rename **files** first, then fix references — and leave prose
alone: a `sedreplace` sweep cannot tell a **citation** of a flat term from an **instance** of one,
and this repo has already watched one rewrite a rule's own counter-examples
(`rule.forbid.brackets-in-filenames`).

this reuses the exact clause `rule.forbid.domain-term-synonyms` already carries — *"it may be left
in place until disturbed (no forced mass-rewrite)"* — rather than a second convention
(`rule.always.reuse-pavement-before-improvise`).

✅ **a rename needs zero `boot.yml` edits.** the glossary is loaded by `term=*._.choice._.md`
globs, and a `*` matches dots within a path segment — which is what makes fix-forward cheap enough
to be the default rather than a concession.

## .the anti-patterns

- **the obvious boundary, omitted** — *"everyone knows which `guard` this is"*. everyone in the
  room today. the glossary outlives the room
- **the role as a boundary** — `driver.rung`, which fails to disambiguate a word two roles share
- **the qualified file, unqualified citation** — the cluster is renamed and 12 `.refs` lines still
  say `rung`. the ambiguity moved; it did not leave
- **the boundary invented at rename time** — a word picked to satisfy the form rather than
  discovered from the domain. that is a label, not a bounded context
- **the sweep** — 26 clusters renamed in one pass by find-and-replace, counter-examples and all

## .enforcement

- a term cluster whose header omits `term.boundary` = **blocker** — the forced articulation is what
  catches a discovery gap at authorship
- a **flat filename on a settled term** = **blocker** — the form does not branch on whether a
  collision happens to exist, because a conditional rule makes every path a lookup
- a filename that carries **one boundary segment where its ancestry is deeper** = **blocker** — the
  dropped ancestor is the slice that stops working
- a filename that carries `repo` as its leading segment = **blocker** — the universal ancestor
  distinguishes no term and taxes all of them
- a boundary segment that **reaches no root** — a name with no declared term and no recorded place =
  **blocker**; declare it, or re-settle the child's boundary
- a term whose boundary is a **role** rather than a subdomain = **blocker** — it does not
  disambiguate the case the rule exists for
- a `term.boundary` answered only in a sentence, with no gap recorded in the `.reason` =
  **blocker** — an unrecorded gap is re-derived by every later reader
- a citation of a term in an **unqualified** form = **blocker** — the ambiguity is merely relocated
- a **deep path whose every segment is a real ancestor** = **not a violation** — depth is a fact
  about the domain
- a term whose boundary is genuinely **UNSETTLED**, left flat with the gap recorded = **not a
  violation** — an unnameable boundary cannot be carried, and a guessed one is worse
- an **untouched** extant term = **not a violation** — fix forward, never sweep
- a bulk find-and-replace across the glossary = **blocker**

## .see also

- `rule.forbid.domain-term-synonyms` — the peer rule; it bans one word for two concepts, where this
  one makes both senses expressible instead
- `rule.require.domain-term-itemization` — the FLOOR that says a term must exist; this says what
  its name must carry
- `template.domain-term` — the cluster shape this qualifies
- `rule.forbid.itemization-without-coordinates` (librarian) — the same claim for inventories: a name
  must declare the axis it sits on, never imply it
- `rule.forbid.brackets-in-filenames` (librarian) — why the rename is file-first and why the sweep
  is forbidden
- `rule.require.domain-discovery-for-term-proposals` (architect) — an unnameable boundary is a
  discovery gap
