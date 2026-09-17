# F22 · a top-up lands on EVERY level — does this behavior narrow it to the live one?

- **rework** = clean · **confidence** = ✅ **settled (was 🔴 62%)** · **status** = **ruled — fork E**
- **raised 2026-09-10**, by the wisher's question: *"does this behavior make it so that lower levels
  dont constantly get budget added? i.e., by default, only the latest level gets budget added?"*
- 🔴 **reversed the same day, by the wisher, on the fork this row took.** the full verdict is at the
  foot; read it before the argument above it, which is superseded.

## .the measured answer first — **no, it does not**

| what | where | verdict |
|---|---|---|
| `--add N --stone X` scope | `route.ts:1851-1872` | adds to **every peer at every level** |
| the only filter | `:1853` — `if (input.peerSlug && currentPeerSlug !== input.peerSlug) continue` | one **lane**, never a level |
| a `--level` filter | — | 🔴 **does not exist.** `level:` occurs once (`:1833`), and only to keep the peer-section parse alive |
| the help text | `:1980-1994` | `--for --add --stone --peer --route` |
| this behavior's effect on it | 1.vision.yield § edge cases — *"a multi-level ladder: untouched"* | the stance gates a **lane**; the ladder is unchanged |

⇒ so a driver who concedes on an l3 lane and runs the top-up **this design's own emit prints**
(`case=6` `[t1]`) inflates l1 and l2 in the same stroke, silently.

## .the fork

| fork | the default scope of `--add N` | |
|---|---|---|
| ~~**A**~~ | ~~every peer at every level (**extant**)~~ | 🔴 **taken, then REVERSED by the wisher** |
| **B** | only peers at the **live** level — the lowest not-yet-terminal one | `--level all` opts back out |
| **C** | only peers with a **live verdict that gates** — rejected or exhausted, at any level | keyed on state rather than on ladder position |
| **D** | only peers already **exhausted** — the set the halt already computes | 🟡 drafted after the challenge, and still one notch too generous |
| ✅ 🔴 **E** | **naught by default.** a level stays or becomes exhausted unless it is **explicitly rewound or budgeted** | ✅ **RULED.** the top-up is a deliberate, targeted act |

## ~~.taken, and why — A, at 62%~~ — 🔴 SUPERSEDED

<details>
<summary>the argument as filed, kept verbatim because a wrong call's reason is the evidence</summary>

**A, and the reason is a bound rather than a preference: this is not this behavior's call to make.**

the wish's scope is what a driver may declare **against a verdict**. the budget operation's default
scope is a separate mechanism with its own consumers, and issue `#458` — **OPEN** — is already the
live docket on budget ownership. ⇒ `F011` on this board rules that #458's question is *"left OPEN,
not foreclosed by this behavior"*, and a change to the top-up's default scope would foreclose part
of it.

⚠️ **and the obvious answer is wrong, which is why the row exists rather than a prose line.** I
checked the counter before I filed:

- **lower lanes are not idle.** the review cache is keyed on the **current** artifact hash
  (`runStoneGuardReviews.ts:313-317`, `getAllStoneGuardArtifactsByHash`)
- a **concede obliges an edit** — that is what the stance means
- ⇒ the hash moves, `cachedReviews` comes back empty, and **every lane re-runs**
- and a re-run **spends** a round: `:648-652` increments the meter on any completed review, whatever
  the verdict

⇒ **so budget at a lower level is consumed, not wasted.** starve l1 and a lane that has approved
every round **exhausts** — a lens lost, which is precisely the harm `S03`'s per-generation skip was
ruled to prevent. **B is not obviously safer than A; it trades one silent cost for another.**

</details>

## .rework, and why — clean

the top-up's default scope is one predicate in one operation, and no artifact on disk encodes it. to
narrow it later changes a default, never a stored shape. ⇒ and the extant `--peer` flag means the
narrow behaviour is **already reachable today** — every other fork only changes what a driver gets
when they do not ask.

✅ **the verdict confirms the grade.** fork E adds no field, no file, and no migration: it removes an
implicit reach. the dirt a reversal would cost is the same dirt fork A would have cost.

## 🔴 .confidence, and why it was low — 62%

kept because each hazard scored, and **hazard 4 named the defect that landed**:

1. 🔴 **the harm A permits is real and this design makes it more frequent.** a blanket top-up erases
   the bound the route author set on lanes that were never the problem — and *"budget is the wrong
   instrument to end a disagreement"* is **this wish's own thesis**
2. ⚠️ **I did not measure how often a lower lane actually approaches exhaustion.** the counter above
   establishes that lower lanes **spend**; it does not establish that they spend *enough* to matter
3. 🟡 **C was not weighed properly.** it is narrower than B and keyed on the quantity that actually
   matters — *does this lane's verdict gate?* — and I reached for the ladder axis first because the
   wisher's question named levels
4. 🔴 **the scope argument is a real bound and also a convenient one.** *"not this behavior's call"*
   is correct, and it is the answer that costs me no work

⇒ **hazard 4 was 100% of the defect and I scored it fourth of four.** the reversal did not surface a
consideration the entry lacked; it acted on the one the entry listed last.

## .where

`src/contract/cli/route.ts:1851-1872` — the parser, and its one filter ·
`:1980-1994` — the help text that enumerates the flags ·
🔴 `formatBlockRemedyGroups.ts:79-85` — **the discarded set**, see below ·
`runStoneGuardReviews.ts:313-317` — the hash-scoped cache · `:648-652` — the meter increment ·
`1.vision.experience.case=6` `[t1]` — the emit that prints a top-up after a concede ·
`1.vision.experience.case=9` §2 — the emit that must name a conceded and a disputed lane at once.

## ✅ .the verdict once ruled — 2026-09-10, fork **E**

the wisher, in three consecutive utterances, verbatim:

> *"explain. we DO want to do this, right?"*
>
> *"its fine if l1 becomes exhausted after a conceded on l3"*
>
> *"we want to prioritize budget right now"*
>
> *"so unless a level is explicitly rewound or budgetted, it should stay|become exhausted"*

### what the verdict settles

| the claim | its fate |
|---|---|
| a top-up reaches every level by default | 🔴 **overturned.** a top-up is deliberate and targeted |
| a lower level that exhausts is a **harm** to prevent | 🔴 **overturned.** *"its fine if l1 becomes exhausted"* — it is the **intended** resting state |
| budget is plentiful enough that a blanket add is cheap | 🔴 **overturned.** *"we want to prioritize budget"* — it is scarce, and scarcity is the point |
| the two ways out of exhaustion | ✅ **enumerated by the wisher, and the enumeration is closed**: an explicit **rewind**, or an explicit **budget** |
| this is not this behavior's call | 🔴 **overturned.** the emit this design prints is what reaches every level, so the reach is this design's to bound |

### 🔴 why fork E, and not the D I drafted after the challenge

I reversed to **D** — *"auto-extend exactly the lanes that are already exhausted"* — on the strength
of the discarded set below. **the wisher went one notch further, and the notch is the whole verdict:**

| | fork D | ✅ fork E |
|---|---|---|
| a lane that exhausts | is topped up **automatically**, since the halt already knows it | **stays exhausted** |
| the default | still a reach, merely a narrower one | **naught. no reach at all** |
| what a top-up costs a driver | one command, and it guesses the scope for them | one command, and **they name the scope** |
| what exhaustion means | a state to repair | 🔴 **a state to accept** |

⇒ **D still treats exhaustion as a defect the engine should heal.** E treats it as the meter that
works — *"unless a level is explicitly rewound or budgetted, it should stay|become exhausted."*

### 🔴 the mechanism that makes E cheap, and the comment that confesses it

`formatBlockRemedyGroups.ts:79-85` already computes the exact set of lanes that need budget, then
throws it away:

```ts
const exhaustedSlugs = exhaustedMatch?.[1]
  ? exhaustedMatch[1].split(',').map((s) => s.trim())
  : [];
// one slug → name it with --peer; several → omit, since the top-up affects them all
const peerArg = exhaustedSlugs.length === 1 ? ` --peer ${exhaustedSlugs[0]}` : '';
```

⇒ **the comment is the defect stated in the engine's own hand.** *"several → omit, since the top-up
affects them all"* is a render decision that treats a **scope defect** as a **format convenience**.
the set is on hand; the flag cannot carry it; so the emit prints the widest command available and
says naught about the width.

⚠️ **under E the repair is not to auto-apply that set — it is to PRINT it.** the halt names each
exhausted lane, the driver picks, and the lanes they did not pick stay exhausted. ⇒ that is the
smallest change that honours *"explicitly … budgetted"*: `--peer` gains a repeatable or
comma-joined form, and the emit enumerates rather than widens.

### 🔴 the shape of the error, and it is the third instance on this board

my counter-argument was **true in every premise and false in its conclusion**:

- ✅ *"a starved l1 exhausts, and a lens is lost"* — true
- 🔴 **and unreachable under the fix**, because a lane that exhausts **enters `exhaustedSlugs` at
  that moment**. the halt names it. the driver can budget it. the harm I named had a remedy the same
  mechanism supplies

⇒ **I checked a counter, found it true, and stopped — without a check of whether the harm it named
was reachable under the proposed alternative.** ⚠️ **a counter-argument is graded against the
alternative, never against the status quo.**

🟡 **and the wisher's answer moots the check anyway:** the lens loss I feared is not a harm at all.
*"its fine if l1 becomes exhausted after a conceded on l3."*

### what it costs the design

| artifact | the bill |
|---|---|
| `case=6` `[t1]` — the concede emit | it prints a top-up. under E it must print a **scoped** one, or name the lanes and let the driver pick |
| `case=9` §2 — the two-lane emit | unchanged in shape, sharper in force: the enumeration is now the **contract**, not a nicety |
| `case=1` `[t4b]` — the disputed-lane top-up note | unchanged. a disputed lane buys naught from a top-up either way |
| `F011` — #458 stays open | ✅ **unharmed.** E narrows a **default**; #458 asks **who may spend**. the two axes do not touch |
| 1.vision.yield § edge cases | *"a multi-level ladder: untouched"* is now **false** and must say so |

⇒ the dirt is a render change and a flag widened to carry a list. **no stored shape moves**, so the
`clean` grade holds.
