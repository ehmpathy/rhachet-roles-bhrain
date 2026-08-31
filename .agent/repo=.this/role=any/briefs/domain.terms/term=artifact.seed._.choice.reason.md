# domain.term.choice.reason: seed

## .etymology

**seed** — what a grown form came from, and what more can be grown from. it carries two senses
at once, and the practice needs both: a seed is **prior to** the artifact, and it **remains
fertile** after it.

that second half is why `source` was rejected. a source is merely where a work came from; a seed
can be planted again. a seed file is re-read when the distillate is questioned, and it can grow a
*different* brief than the one it first grew.

## .the document-kind marker

`seed` is a **document kind**, and this repo marks a kind with a coordinate: `kind=seed`.

```
$topic.kind=seed.by_human.md
```

⇒ the marker carries weight, not decoration. it states **what kind of document this is**, which is
exactly what distinguishes this sense of the word from the prose sense below. a bare `.seed.md`
would have blurred them; `.kind=seed.` cannot — and unlike a bracket form, it stays addressable:
`*.kind=seed.*` returns the whole set.

⚠️ **the marker is for a STANDALONE seed.** where seeds are itemized — a route's `.seeds/` set —
the concept is carried by the `of=seeds` coordinate instead, and the marker is dropped as a second
statement of the same fact (`term=artifact.seed._.choice._.md`).

**precedent, in a dependency — and why it was NOT copied.** the org marks this same kind with
brackets: `rule.require.failfast.[seed].md` holds the rough notes that `rule.require.failfast.md`
was distilled from; `criteria.given_when_then.[seed].v3.md` likewise. that convention predates
this capture by the whole of the ehmpathy role set.

⚠️ **the marker was not copied, and the reason is mechanical.** `[` and `]` are glob
metacharacters, so `[seed]` reads to every path tool as *"one character from `s,e,d`"* — the file
becomes hard to reference, which is the one job a filename has.
`rule.forbid.brackets-in-filenames` (librarian) carries the full argument and the evidence.

⇒ **the KIND was adopted from the org; the MARKER was not.** precedent is a reason to look, never
a reason to conform. the bracket family (`[article]`, `[catalog]`, `[demo]`, `[lesson]`,
`[guide]`, `[ref]`, `[philosophy]`, `[seed]`) is owed a re-seed to the repos that publish it.

## ⚠️ .the overload — `seed` also means a radio task, in prose

**this repo calls its radio-queue tasks "seeds."** `0.wish.md` uses the word ~15 times that way:
*"the radio queue holds 41 open seeds"*, *"claim each seed you choose"*.

so `seed` carries **two senses** in this repo:

| sense | example | is it a contract? |
|---|---|---|
| raw source a distillate grew from | `$topic.kind=seed.by_human.md` | **yes** — a declared file kind |
| a task in the radio queue | *"41 open seeds"* | **no** — prose only |

### why this is tolerated rather than forbidden

`rule.forbid.domain-term-synonyms` binds **contracts**: dobj/dop names, internal contracts, and
published interfaces. it explicitly permits an alternate-perspective word in prose. applied here:

- the **declared object** for a radio task is `RadioTask`, in `rhachet-roles-bhuild` — imported
  vocabulary, out of this glossary's scope by the itemization rule's own exclusion
- so "seed" for a radio task is **prose about an imported concept**, never a contract of this repo
- and the metaphor is apt in both senses — a queued task is also a form not yet grown

⇒ **no contract is at risk, so no rename is owed.** but the collision is real, and a reader who
meets both in one document will stumble.

### the guard against drift

if a **contract** ever needs to name a radio task in this repo — a `Seed` domain object, a
`--seed` flag, a `getSeed` operation — **that is the moment this tolerance ends.** use `RadioTask`
(the imported canonical), or open a dispute here. the `kind=` marker holds the line until then:
`kind=seed` is always the document kind, never the task.

## .why not the rejected synonyms

- **source** — names only the origin, and drops the *fertile* half. it is also overloaded to
  exhaustion in software (source code, a data source, an event source)
- **raw** — an adjective in a noun's job, and silent on what the material is raw *for*
- **notes** — implies informality and low stakes. a seed may be the most precise artifact in the
  round — a verbatim specification is a seed, and it is no mere note
- **draft** — a draft is an early version of **the same artifact**; a seed is a **different kind**
  of artifact that a distillate grew from. the wisher's words are not a draft of a rule

## .disputes

none open. the radio-task collision above is recorded as a **tolerated prose overload**, not a
dispute, because the two senses live in different registers and only one is a contract. it is
written down so the next traveler judges it rather than rediscovers it.

## .evidence

- **org precedent for the KIND**: `[seed]` files ship in `rhachet-roles-ehmpathy` for both the
  mechanic and architect roles — the *concept* was adopted, not invented, this round
- **the filename form**: `$topic.kind=seed.by_human.md`. it carries two properties, and a shorter
  form drops one of them — `kind=` marks the document kind, so the prose overload above cannot
  reach the file; and the coordinate form stays addressable, so `*.kind=seed.*` returns the whole
  set. ⚠️ the org's bracket marker `[seed]` delivers the first and destroys the second, since `[`
  and `]` are glob metacharacters — see `rule.forbid.brackets-in-filenames` (librarian), which
  owns that case and its measurement
- **invariant:** `kind=seed` names a document kind used in THIS repo's routes — the prose sense
  (a radio task) belongs to `RadioTask`, an imported term
