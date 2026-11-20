# rule.always.itemize-the-fulcrums-you-best-guess

## .what

when you best-guess a design fork mid-drive, **itemize it into the route's fulcrum inventory at
that moment** — never at the end, never only in yield prose.

```
$route/.fulcrums/inventory.of=fulcrums._.md                # the SUMMARY — axes, counts, gaps
$route/.fulcrums/inventory.of=fulcrums.case=F$n-$slug.md   # one ENTRY per fulcrum
```

**both are owed, every time.** the summary is where a council scans; the entry is where a reviewer
cites. neither substitutes for the other.

**the name is not free-form, and this rule coins none of it.** it is the itemization contract
applied to `case`, and every piece of the form is owned elsewhere:

| the piece | owned by |
|---|---|
| `._.` for the summary | `rule.require.summary-at-the-cluster-root` (librarian) |
| `of=fulcrums` + `case=$id` for each entry | `rule.forbid.itemization-without-coordinates` (librarian) |
| the ordinal-plus-slug shape of `F14-entoolment-ladder-is-fluid-rigid-solid` | the same rule, `.the case dimension` |
| the claim that an occurrence axis is inventoriable at all | `rule.require.inventory-for-enumerable-concepts` (librarian) |

⇒ read those for the WHY of the form. this rule says only **which** occurrences a driver owes, and
**when**.

this **mechanizes** `rule.always.defer-fulcrums-to-last`. that rule already says *mark the fork on
your map, drive on, and show the map at the end.* this rule is the map.

## .why

the deferred-review contract only pays off if the end-of-road council is **cheap**. an ad-hoc list
scattered across yield prose makes the council a driver promised the human into a scavenger hunt
through a document they were told they would not have to read.

**the measured case.** on route `v2026_07_26.feat-keyrack-vault-aws-params`, four fulcrums
(#56 general-help pollution, #57 reference-set verify, #59 re-point terminology, #61 github-app
journey) were recoverable **only** by a read of the verification yield's prose. a summary would
have surfaced all four at a glance.

⇒ and the asymmetry is the whole argument: **one row costs the driver seconds; its absence costs
the human a hunt.** the resource the entire escalation ladder conserves is the human's attention,
and a scattered map spends it at the last step, after every other rule spent none.

## 🟡 .append at the moment, never in a sweep

**a fulcrum is itemized the instant it is best-guessed** — not batched at the end of the stone,
not reconstructed from memory at the council.

three things are lost in a sweep, and each is the part a reviewer needs most:

| lost in a sweep | why it matters |
|---|---|
| the **fork you rejected** | by the end, only the choice survives; the alternative is gone |
| the **reason at the time** | a reason reconstructed later is a rationalization of the outcome |
| the **rework judgment** | clean-or-dirty was a live assessment; after the fact it is a guess |

⇒ this is the same claim `rule.always.archive-the-wishers-words-verbatim` makes about a seed
written at the end: *by then the exact words are gone, which is the whole failure it prevents.*

## 🔴 .a FORK is not the only trigger — a call under 93% confidence is one too

> **if you would not defend the call at 93%, it earns a fulcrum — even where you weighed no
> alternative.**

the wisher's threshold, set 2026-08-30:

> *"briefs that are less than 93% confident on, we should capture as fulcrums for human to review
> as separate fulcrum files"*

🟡 **and it catches a class the fork trigger structurally cannot.** a fork is a moment you noticed —
two options in view, one taken. a **low-confidence call has no such moment**: you wrote the claim,
it read fine, and the shakiness stayed a background feel that never became a decision.

| the trigger | what it catches | what it misses |
|---|---|---|
| a **fork** | a choice you weighed | a claim you invented with no rival in view |
| a **confidence floor** | the invented claim, the unverified premise, the n=1 generalization | naught — it fires on the fork too |

⇒ so the floor is the **broader** trigger, and a fork is one way to fall below it.

### the cues — when → then

| when… | then… |
|---|---|
| you generalize a rule from **one** measured case | 🔴 n=1 sits under the floor by default. record it, and say what a second case would settle |
| you build a claim on a premise you did **not** fetch | under the floor. name the premise and how to check it |
| a **wisher clause** was short and your artifact is long — four words in, a taxonomy out | under the floor. the delta between the ask and the output IS the uncertainty |
| you invent a **taxonomy, an axis set, or a state machine** no one named | under the floor until a second reader tests it |
| you act **against a stated bound** because your reason felt stronger | 🔴 the lowest-confidence case there is, and the one most apt to read as settled |
| you would say *"i think this is right"* rather than *"this is right"* | that hedge is the grade. record it |

### the row carries the number, never a flag

`confidence` is a **percentage** column in the summary, so the council can sort on it. a row at 40%
and a row at 88% want different amounts of attention, and a boolean hides that.

🟡 **the grade is self-assessed, and that is its known weakness.** a call you are confident in and
wrong about scores 100% and earns no row. so the floor is a **net, never a proof** — it catches the
doubt you can feel, and `rule.always.get-a-second-opinion-before-foreman` stays the only move that
catches the rest.

## .the summary — `inventory.of=fulcrums._.md`

one row per fulcrum, and no narrative about any one of them
(`rule.require.catalog-is-an-index`). **every column except the title derives from the entry's
frontmatter**, so the row and the entry never disagree. the columns:

| column | holds |
|---|---|
| **case** | the id — the coordinate, and the path to its entry |
| **title** | one line: what forked, or what call was made |
| **rework** | `clean` or `dirty` — per `howto.navigate-fulcrum-choices`'s ladder |
| **status** | `open · held · ruled · superseded` — the closed set. a `ruled` entry records its verdict, in the home `verdict` below names |
| **confidence** | a percentage, the frontmatter's `confidence` × 100. a call under **93%** earns a row, fork or not |

## .the frontmatter — the entry's record, and the one home of its attributes

every entry opens with this yaml block. it is the record: the summary row derives from it, a dispute
only links the file, and the approval halt reads it to name each deferral the human owes a verdict.

the block below backs a dispute. a plain best-guess fulcrum, which no dispute cites, carries
`owed: none` and `holds: []`, and holds no gate.

```yaml
---
case: F44
rework: clean
ground: wrong
confidence: 0.65
status: open
owed: human
holds: [rules-lane/i003/blocker.2]
lean: the reviewer read a rename table as a contract change
verdict: null
---
```

| field | holds |
|---|---|
| `case` | the id, equal to the `case=` coordinate in the filename |
| `rework` | `clean` or `dirty` |
| `ground` | `wrong` (not a defect) or `dirty` (a real defect, a massively dirty fix) |
| `confidence` | `0.00`–`1.00`, **the weakest call the fulcrum holds**, never an average |
| `status` | `open · held · ruled · superseded` |
| `owed` | `human · reflect · none`, derived at write: `reflect` iff `ground = wrong ∧ confidence ≥ 0.90`, `human` for any other dispute, `none` for a fulcrum no dispute backs |
| `holds` | the reviewer concerns it holds, as `lane/round/ordinal`; `[]` if none |
| `lean` | one line: your lean, what the halt shows the human |
| `verdict` | `null` until a human rules, then `{ by: human, at: <date>, ruled: upheld \| conceded }`. **you never write it** — only `rhx route.fulcrum.rule` does, and its log backs it. that lever rules a dispute only, so a design call the wisher settles at a stone gate (`owed: none`) keeps `null` here, and its verdict lives in the entry body's **the verdict** |
| `reflect` | `<owner>/<repo>#N`, required when `owed: reflect`, absent otherwise |

an entry without valid frontmatter holds the stop (the onStop linter names the file and the absent
fields), and a dispute whose `--why` fulcrum lacks it is refused at write. the law and its reasons:
`define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home`.

🟡 **`rework` is the column the council actually sorts on.** a human scans the `dirty` rows first,
because those are the only ones where a late reversal costs more than a rename. a summary without
it is a list of decisions with no priority.

## .the entry — `inventory.of=fulcrums.case=$id.md`

the full record, ejected so the summary stays a summary. it opens with the frontmatter above, then
carries the prose below:

| field | holds |
|---|---|
| **the fork** | option A vs option B, stated fairly. **on a confidence-floor entry with no rival**, state what you would have weighed had one been in view |
| **taken, and why** | the best guess, plus the reason **as it stood at the time** |
| **rework, and why** | what a reversal would cost, judged live |
| **confidence, and why it is low** | the percentage, plus the specific premise, sample size, or bound that holds it down |
| **where** | a back-ref: the stone, or the yield line the decision lives in |
| **the verdict** | once the wisher or the human rules, what they ruled. the frontmatter `verdict` carries the machine form; the body states it in words |

🟡 **`confidence, and why it is low` is the field that does the work.** a bare percentage tells the
council to look and not what to look at; the *why* is what makes the entry actionable in one read.
close it with **what would settle it** — the check, the second case, or the one sentence you need.

## .it is an INVENTORY over the `case` axis

**do not coin a name for this artifact.** the wisher settled the form directly:

> *"keep the `.fulcrums/` dir and also enumerate into `inventory.of=fulcrums._.md` and
> `inventory.of=fulcrums.case=$case.md`… thats the inventory pattern… always the inventory manifest
> file itself, along with each entry of each case in the inventory."*
>
> — the wisher, 2026-08-28
> (`.behavior/*/.seeds/inventory.of=seeds.case=S09-fulcrums-are-an-inventory.md`)

a drive's forks cannot be listed before the drive, so `case` is an **occurrence axis** — and an
occurrence axis is inventoriable. `rule.require.inventory-for-enumerable-concepts` carries that
claim and its census check; this rule only composes it.

## .what it does NOT change

this rule is **only** about the record. it does not touch **when** a fulcrum blocks versus
best-guesses — that ladder stays exactly as `rule.always.defer-fulcrums-to-last` states it:

| the fulcrum is | you |
|---|---|
| impliedly answered | take the answer — it was never a fulcrum, and it gets no row |
| open, rework **clean** | best-guess it, **itemize it**, drive on |
| open, rework **dirty** | halt with `--as blocked` — last, and named. **itemize it too** |

🟡 a blocked fulcrum still gets its row and its entry. the block is the escalation; the record is
the record, and the human reads both.

## .enforcement

- a fulcrum best-guessed and never itemized = **blocker**
- a summary row with no `case=$id.md` entry beside it, or an entry absent from the summary =
  **blocker** — the census claim is what makes this an inventory
- a record written in a sweep at the end rather than appended at each decision = **blocker** —
  the reconstructed reason is the part that was worth the record
- a row with no `rework` column = **blocker** — it is the column the council sorts on
- a fulcrum record under a prose name (`fulcrums.md`, `register.md`, `catalog.md`) = **blocker**
- a `ruled` entry whose verdict is not recorded = **blocker** — a settled fork that reads as
  open will be re-litigated. a dispute records it in the yaml `verdict`; a design call with
  `owed: none`, in the body's **the verdict**
- an entry with absent or invalid frontmatter = **blocker** — the stop holds, and the linter names
  the file and the absent fields
- a summary row typed apart from its entry's frontmatter, or one that disagrees with it = **blocker**
- a `status` outside `open · held · ruled · superseded` = **blocker**
- a `verdict` a driver wrote by hand = **blocker** — only `rhx route.fulcrum.rule` writes it
- a call made **under 93% confidence** and never itemized = **blocker** — the floor is a trigger in
  its own right, not a note on the fork trigger
- a confidence row that carries **a number and no reason** = **blocker** — the council cannot act
  on a percentage alone
- a call you graded at 100% that a reviewer then overturns = **not a violation** — the floor nets
  the doubt you can feel, and a peer catches the rest

## .see also

- `rule.always.get-a-second-opinion-before-foreman` — what catches the calls a self-grade rates 100%
- `rule.always.defer-fulcrums-to-last` — the WHEN; this is the RECORD
- `howto.navigate-fulcrum-choices` — the ladder the `rework` column encodes
- `define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home` — the frontmatter law
- `rule.require.deferrals-accrue-in-the-blocker-list` · `rule.forbid.deferrals-hidden-from-the-human`
  — what the record is for: the halt names each deferral from it
- `rule.always.yield-the-output-not-the-archaeology` — why the fulcrum row belongs beside the
  yield rather than narrated inside it
- `rule.forbid.itemization-without-coordinates` (librarian) — the coordinate contract this obeys
- `rule.require.summary-at-the-cluster-root` (librarian) — why the summary takes `._.`
- `rule.require.catalog-is-an-index` (librarian) — the summary's shape: one row per member, no
  narrative about any one of them
