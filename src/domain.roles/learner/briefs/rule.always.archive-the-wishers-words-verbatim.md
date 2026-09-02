# rule.always.archive-the-wishers-words-verbatim

## .what

when the wisher says a word that **changes the work**, catch it **verbatim** into the route's seed
inventory before you distill it.

```
$route/.seeds/inventory.of=seeds._.md                # the SUMMARY — the axis, the counts, the gaps
$route/.seeds/inventory.of=seeds.case=S$n-$slug.md   # one ENTRY per utterance
```

the distillate is what the next traveler reads. **the seed is what they check it against.**

**both are owed, every time** — the same contract `.fulcrums/` obeys, and for the same reason: a
set of entries with no summary declares no axis and reports no gaps.

## .why

a distillation is lossy by design, and the loss is invisible once the source is gone. three
failures this prevents:

1. **drift** — a quote paraphrased into a vision, then into a rule, then into a term's
   `.evidence`, is a telephone game with no way back to the original
2. **unfalsifiable claims** — a line that reads *"the wisher asked for X"* cannot be checked
   unless the words are on record. a reviewer must either trust it or re-litigate it
3. **lost sharpness** — the exact words often carry a constraint the paraphrase drops.
   *"catalog = ref w/ preview of each concept"* is sharper than any restatement, and the
   restatement is what a later reader would otherwise inherit

⇒ and the cost is near zero: the words already exist. to keep them is a copy, not an authorship.

## .the cues — when → then

| when… | then… |
|---|---|
| the wisher **settles a question** you had escalated | archive it — the settlement is the answer future rounds inherit |
| the wisher **corrects you** | 🔴 archive it. a correction is the highest-value quote there is: it records both the wrong path and the right one |
| the wisher **names a new concept or convention** | archive it — the coinage's source is its etymology |
| the wisher **specifies a contract verbatim** (a path shape, a flag, a format) | archive it. a specification paraphrased is a specification changed |
| the wisher **asks a question** whose answer changes the work | 🔴 archive it — see below. this is the cue this list lacked until 2026-08-31 |
| you are about to write *"the wisher asked for…"* anywhere | that citation needs a source. archive first, then cite |

## 🔴 .a QUESTION is a kind, and it is the cheapest one to lose

the four cues above are all **verdicts** — a matter settled, corrected, coined, or specified. a
question is none of those, and it changes the work just as much.

**measured, 2026-08-31.** two questions — *"is it super clear howto declare fulcrums?"* and
*"the catalog of entoolment? enbrief vs enskill vs enroute?"* — carried no verdict at all, and
between them produced a catalog, two caught dreams, and a glossary gap
(`.seeds/inventory.of=seeds.case=S22-two-questions-found-two-gaps.md`).

⚠️ **and it is the kind that vanishes with no trace.** a correction announces itself in the
record; a question that found a gap reads, in hindsight, **as though the driver found the gap.**
the archive is the only artifact that says otherwise.

⇒ the tell: **you answered from the repo and the answer was "no".** that is a gap the wisher
located from outside, and the question is what located it.

## .what a seed holds

```markdown
# seed: $what-it-settled

**$date. $what-it-changed.**

## .said
> the words, verbatim, unedited

## .settled
what changed because of them

## .landed
the paths the settlement was written into
```

⚠️ **`.said` is verbatim — do not clean it up.** typos, lowercase, mid-thought corrections, and
all. the value is that it is unedited; a tidied quote is already a paraphrase.

## 🔴 .a seed is the seed of a CONCEPT — never a chronicle of the round

> **`.settled` states what now HOLDS. it does not narrate how the round came to know it.**

`.said` is exempt — a quote is a quote. **every other line states the concept**, in a form that
stands with no knowledge of this route, this round's tools, or this round's own history.

| belongs in the seed | belongs in git, and nowhere else |
|---|---|
| the concept the utterance planted | the diagnosis trail that preceded it |
| what now holds, and why | the fulcrum it withdrew, the yield section it corrected |
| the bound — where the concept stops | the tool that was broken that day, and its error code |
| the durable lesson, if the concept carries one | *"the driver had escalated…"*, *"an earlier draft claimed…"* |

⇒ **this is `rule.forbid.chronological-accretion` (ehmpathy/mechanic), specialized to a seed** —
the exact peer of `rule.always.yield-the-output-not-the-archaeology` (driver), which makes the same
specialization for a yield. neither is a new claim; both name where the general rule bites.

⚠️ **and a seed gets no `appendix/`.** a yield may eject its history to a peer dir; a seed may not.
the route's yield and `git log` already hold the trail, so a seed that carries it holds a **third**
copy that will drift from both.

### the test — strip the round, keep the concept

> **delete every reference to this route, its tools, its fulcrums, and its errors. does the concept
> still stand?**

- yes → it is a seed
- no → what survives is the seed; the rest is archaeology, and it goes

### ⚠️ the tell: a `.landed` list longer than the concept

`.landed` names where the concept was written, in one line each. the moment it grows a **reason**
per row — *"corrected, because it had wrongly claimed X"* — it has become a changelog of the round,
and the concept it was meant to serve is now the shortest section on the page.

### 🔴 and a durable concept is owed a BRIEF, not merely a seed

a seed lives in `$route/` and dies with it. so when the concept generalizes past this round,
`rule.always.scope-onetime-lessons-to-the-behavior` fires: **the instance stays in the seed, the
kernel is owed a durable brief, and the two cite each other.**

⇒ a seed with a `.the lesson kept` section and no brief behind it is a kernel already lost.

## .the form — an inventory over the `case` axis

**this rule coins none of the form.** a seed set is an **occurrence set**, exactly as a route's
fulcrums are, so it takes the itemization contract every occurrence set takes:

| the piece | owned by |
|---|---|
| `._.` for the summary | `rule.require.summary-at-the-cluster-root` (librarian) |
| `of=seeds` + `case=$id` per entry | `rule.forbid.itemization-without-coordinates` (librarian) |
| `S$n-$slug` — an ordinal for the sequence, a slug for the sense | the same rule, `.the case dimension` |
| the claim that an occurrence axis is inventoriable at all | `rule.require.inventory-for-enumerable-concepts` (librarian) |

⇒ **the summary is what a `refs/`-flat seed set could never have.** `refs/` holds mixed input — a
feedback template lives there too — so the set has no axis to declare and no census to take. its
own directory is what makes the axis nameable and the gaps checkable.

⚠️ **`.seeds/` sits beside `.fulcrums/`, and the symmetry is the point.** one convention, learned
once, applied to every occurrence set a route accumulates.

## .the anti-patterns

- **the summary that replaced the source** — the quote distilled into a vision section, and the
  words discarded. every downstream citation is now unverifiable
- **the tidied quote** — a `.said` block that has been spellchecked and reflowed. it reads better
  and is no longer evidence
- **the seed written at the end** — quotes reconstructed from memory after the round. by then
  the exact words are gone, which is the whole failure this prevents
- **the entries with no summary** — ten seed files and no `._.md`. the set has no axis, no count,
  and no way to report what is absent
- **a bracketed kind marker** (`$topic.[seed].md`) — brackets are glob metacharacters, so the set
  is unmatched by the tools built to find it (`rule.forbid.brackets-in-filenames`, librarian)

## .enforcement

- a wisher utterance that changed the work, with no seed = **blocker**
- a `"the wisher asked for X"` citation with no seed to source it = **blocker**
- a `.said` block that has been edited, tidied, or paraphrased = **blocker**
- a seed filed outside `$route/.seeds/` = **blocker**
- seed entries with no `inventory.of=seeds._.md` summary beside them = **blocker** — the census
  claim is what makes this an inventory
- a seed under a prose filename, or with a bare-ordinal `case=` and no slug = **blocker**
- a wisher **question** whose answer changed the work, with no seed = **blocker** — the cue list
  omitted this kind until 2026-08-31, and it is the kind that leaves no other trace
- a seed whose body narrates the round — the diagnosis trail, the withdrawn fulcrum, the corrected
  yield section, the broken tool — = **blocker**; that is a third copy of what git and the yield
  already hold
- a `.landed` row that carries a **reason** rather than a path = **blocker** — it is a changelog
- a seed whose concept generalizes past the round, with no durable brief behind it = **blocker**
  (`rule.always.scope-onetime-lessons-to-the-behavior`)

## ⚠️ .whose rule this is — the learner's, borrowed by the driver

the act is **capture before the context fades**, which is this role's whole subject
(`im_an.obsessive_learner`, `.the tension`). so the file lives here, and
`src/domain.roles/driver/briefs/` holds a **symlink** to it.

⇒ **the reason is not tidiness.** filed under the driver, the rule was reachable only by a
driver-enrolled clone — and **any** role enrolled with the wisher can be settled, corrected, or
asked. a learner alone, a reviewer alone, an achiever alone. the driver borrows it back because
that is where it fires most often, never because it owns the act.

⚠️ **do not read `$route/.seeds/` as evidence of a driver home.** that is where the artifact
LANDS, never who acts — the same distinction `term=artifact.seed` draws when it settles its own
boundary as `artifact` rather than `route`.

## .see also

- `rule.always.itemize-the-fulcrums-you-best-guess` (driver) — the peer occurrence set, same form
- `rule.require.inventory-for-enumerable-concepts` (librarian) — why an occurrence axis is
  inventoriable
- `philosophy.pavement-saves-nature` — an unread source drifts; this keeps it readable
- `rule.require.timeless-comments` (ehmpathy) — why a record must stand without its conversation
