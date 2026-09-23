# F06 · req 4 is read as SEVERITY, never as concern-kind

- **rework** = clean · **confidence** = 🔴 **62%** ⬇ · **status** = best-guessed · **triage** = the
  feasibility half is `[answered]`; the intent half is `[wisher]`

🔴 **this row's FIRST argument was struck at `r5` self-review, and it was the mechanical one.** it
read *"the kind is not recorded on the stance … prose in a string, never a parsed field."* the source
refutes it outright, and § *the correction* carries the record. **the row still stands — on two
arguments rather than three, and both of them are aesthetic.**

## .the fork

`0.wish.md` req 4 says *"a **nitpick-only** round can never be the concession that lifts the
refusal."* but `nitpick` is a **kind** (does it hold the stone?), and `urgent`/`better` is a
**severity** (does harm ship?). the two axes are orthogonal, and `contract.reviewer-output` says so
outright — **all four pairs are legal**, `[nitpick][urgent]` among them.

⇒ so req 4 names an axis the gate does not read, and the wish never says which one it meant.

| option | the predicate |
|---|---|
| 🔴 A | **severity** — a `conceded` stance whose `--severity` is `urgent` lifts it, whatever the concern's kind |
| B | **kind** — the concern the driver conceded must have been a `blocker` |
| C | **both** — `blocker` ∧ `urgent` |

## .taken, and why

**option A.**

1. ~~**the kind is not recorded on the stance.**~~ 🔴 **STRUCK at `r5` — see § *the correction*.**
   the kind is parsed, typed, branched on, and persisted. option B is **fully implementable**, at the
   cost of one call to a shipped parser.
2. **the invariant already rules the axis.** `define.invariant…urgent-earns-budget` is written over
   `concession.severity` end to end — *"only an urgent concession qualifies"*. no clause of it
   mentions kind.
3. **the harm test is the same test in both seats.** `rule.forbid.overzealous-blockers` grades a
   blocker by *"name the harm that ships"*; `rule.require.grade-a-concession-by-its-harm` grades a
   concession by the identical test. ⇒ **severity already IS the "is this taste?" axis** req 4 was
   reaching for. kind answers a different question.

🟡 **and the reading is not lossy where it matters.** a `[nitpick][better]` concession — the churn
the wish's cue describes — is refused under option A, which is the outcome req 4 wants. what option
A additionally permits is `[nitpick][urgent]`: a shipped harm the budget already conceded, which is
precisely a case that deserves a round.

## 🔴 .the correction — the kind IS a parsed field, read from source at `r5`

the struck argument claimed option B would need *"a new parse of a free-text flag."* four lines of
shipped source say otherwise:

| the source | what it shows |
|---|---|
| `asReviewConcernRef.ts:7-10` | `interface ReviewConcernRef { kind: 'blocker' \| 'nitpick'; ordinal: number }` — a **typed, closed-set** field |
| `asReviewConcernRef.ts:33-54` | the parse itself: `<kind>.<ordinal>`, with a loud `BadRequestError` on a malformed input |
| `setStoneAsConcernAbsorbed.ts:121`, `:215` | the command already **calls it and branches on it** — `concern.kind === 'blocker' ? given.blockers : given.nitpicks` |
| `asReviewConcernRef.ts:62-64` | the persisted `about` is `` `${ref.kind}.${ref.ordinal}` `` ⇒ **the kind survives onto the stance row, and re-parses with the same operation** |

⇒ **option B costs one call to a shipped parser over a persisted field.** that is the same cost as
option A, so the feasibility argument does not part them at all.

🟡 **the sub-clause about renumbered ordinals is TRUE and IRRELEVANT.** the parser's own docblock at
`:18-19` confirms ordinals renumber each generation — and that bounds the **ordinal**, never the
**kind**. `nitpick` is `nitpick` in every generation. ⇒ a true fact was recruited to support a claim
it does not touch, which is the sharper half of this correction.

## .rework, and why

**clean.** the gate is one filter over one field. to take option B is to swap the filter — one call
to `asReviewConcernRef({ about: stance.about })` in place of a `severity` equality. no caller is
hardened against any of the three.

## .confidence, and why it fell 80% → 62%

**one of three arguments was struck, and it was the only MECHANICAL one.** what is left is two
aesthetic arguments — the invariant's axis, and the harm test's symmetry — and both are claims about
what req 4 *ought* to mean rather than about what can be built.

⚠️ **the evidence AGAINST the read is unchanged and now carries more relative weight**: the wish wrote
**`nitpick`** in bold, which is a kind-word, and a wisher who meant severity would more likely have
written `better`. ⇒ before `r5` that word choice was the lone counter to a mechanical case; now it is
the lone counter to two aesthetic ones.

🔴 **and the practical consequence is that req 4 as WORDED is implementable**, so the yield may no
longer say the other read is unavailable. it must say the design **prefers** severity, and say why.

⇒ **what would settle it:** the wisher says whether *"nitpick-only"* meant `[nitpick]` the kind or
`better` the severity. **that is now the sole remedy.**

## .where

`1.vision.experience.dimensions.md` § axis B · `1.vision.experience.case=3.the-strand.md` ·
`asReviewConcernRef.ts:7-10,33-54,62-64` · `setStoneAsConcernAbsorbed.ts:121,215`

## .the verdict

🔴 **RULED — option A. the severity is the gate's input, and it is the DRIVER'S RANK.**
`$route/.seeds/…case=S04…`.

the council settled the sole open half — *did the wisher mean kind, or severity?* — and it settled
more than this row asked:

> **the driver marks the concession with a severity, and that severity is the driver's own rank of
> it. the gate reads the rank.**

### 🔴 what it settles beyond option A

| | authored | 🔴 ruled |
|---|---|---|
| req 4 | *"served in intent, not in letter"* | ✅ **served.** the wish wrote a kind-word and meant the harm axis |
| req 3 (*"a fact the tool reads, never a judgment a clone asserts"*) | 🔴 graded unsatisfiable by ANY design that reads a driver-written field | ✅ **served.** the RECORD is the fact; the rank is the driver's by design. the wish never asked for an external assessor |
| `[nitpick][urgent]` lifts the refusal | a divergence to confess | ✅ **correct by design.** harm earns the round; kind does not |

⇒ **the row's own §*confidence* paragraph is vindicated and inverted at once.** it said the wish's
bold **`nitpick`** was the lone counter-evidence and now carried more weight than before. it carried
none — the word was a slip in the wish's prose, and the two aesthetic arguments were right.

### 🟡 what it does NOT settle

req 2's freshness gap. this row never touched it, and `F10` still owns it — a lane that sat dry
mints no `.given`, so a stale stance stays live there. ⇒ **one of the three letter-vs-intent rows
survives the verdict**, and it is a mechanism gap rather than a prose one.

## .the amendment

**confidence: 62% → RULED.** 🔴 **the strike at `r5` was correct and its CONCLUSION was wrong.** the
row fell 80% → 62% because its mechanical argument collapsed and only aesthetics were left — and the
aesthetics were what the wisher actually meant.

🟡 **the class, and it is worth more than this row: a struck argument is not evidence against the
call it supported.** `r5` re-graded the conclusion on the strength of the argument set, which is the
natural move and is wrong here — three arguments for a true claim and two arguments for the same
true claim are equally true. ⇒ **confidence should have fallen for the ARGUMENT's quality and held
for the CALL**, and this board has no axis that parts those two.
