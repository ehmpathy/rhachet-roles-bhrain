# F17 · a post-rewind dispute mints a FRESH entry — the findsert keys to the given

- **rework** = clean · **confidence** = 65% · **status** = 🔴 **MOOT — the findsert is retired,
  2026-09-09**

## 🔴 .this row's subject no longer exists

> *"but the `--as disputed --why $path` shoould reference fulcrums"*
> *"each fulcrum is a single dispute; and they can reuse fulcrums from past disputes"*
> — the wisher, 2026-09-09 (`S05`)

**`--why` takes a path the driver authors. so the command performs no findsert, and holds no key.**

| this row's question | its fate |
|---|---|
| *"does a post-rewind dispute find the stale entry, or mint fresh?"* | 🔴 **moot.** the driver passes whichever path they choose |
| *"what does the findsert key to — the given, or `(stone, reviewer)`?"* | 🔴 **moot.** there is no findsert |
| 🔴 *"does a rewound dispute's entry owe a `rewound` mark?"* | ⚠️ **survives** — see below |

### ⚠️ the ONE half that survives, and it is smaller

`rewindAffectedStones` deletes the givens (so the **stance** voids ✅) and does no `.fulcrums/`
cleanup. under the old findsert that was a **correctness** defect — a fresh dispute would have
*inherited* the stale rationale. **it cannot now**, since the driver names the path.

⇒ what remains is **hygiene**: a fulcrum entry whose dispute was rewound sits on the board with no
mark, so the council reads a live-seeming row for a dispute that no longer stands.

🟡 **and that is a `fulcrum.set --status` job**, never a stance-gate one ⇒
`.dream/v2026_09_09.entool.a-fulcrum-inventory-has-no-operation.md`. this row's own `.rework` already
called the mark *"additive and separable"*, and it is now separable from a mechanism that does not
exist.

---

**everything below predates the verdict and is kept as the argument's record.**

## 🔴 .why this row exists at all — it was an ABSTENTION at three sites and a row at none

three artifacts state this question and hand it to the wisher:

| the site | its words |
|---|---|
| `1.vision.yield.md` § *the contract*, invariant 4 | *"the two cheap answers are in the pit-of-success table; the wisher picks"* |
| `1.vision.yield.md` § *the pit of success* | *"⚠️ **unresolved, and the wisher picks.**"* |
| `1.vision.experience.case=8.the-flip-flop-refused.md` | *"the two candidate answers, both cheap, and the wisher's to pick"* |

⇒ **and it appeared in no triage question row and no fulcrum row.** so the one index the council
reads did not carry it. an abstention with no row is not deferred — **it is dropped**, and the three
sites that name it are prose a council has no reason to open.

🔴 **`review.self r4` had already recorded this exact defect, one round earlier, on F15.** the
inventory's own words: *"F15 was first written as an abstention — **that was over-caution**,
corrected in the same round."* ⇒ the lesson was written down and **not applied to its neighbours**,
which is what `review.self r5` caught.

## .the fork

`rewindAffectedStones` calls `delStoneGuardArtifacts`, which **deletes the givens**, so a stance
voids by construction. it performs **no `.fulcrums/` cleanup**, and `passage.jsonl` is append-only.
⇒ a rewound dispute leaves a **live** fulcrum entry and a live summary row.

**option A** — a `rewound` state on the entry, written by a rewind hook.
**option B** — the mint's findsert keys to the **given**, as the stance does, so a post-rewind
dispute mints a fresh entry by construction.

## .taken, and why

🔴 **B — and what is sharper is that A and B were never alternatives.**

- **B is not a choice; it is CONSISTENCY.** invariant 3 already keys a stance to *the slug's latest
  given* — argued twice in the yield, once against `F04`'s rejected fork C and once from the
  entrance gate's placement contract. **the mint needs a findsert key regardless**, and any other
  key puts the mint and the stance on two different clocks
- ⇒ **so B is owed whatever the wisher rules.** to present it as fork-half A-or-B invited the
  council to pick A and leave the mint keyed to a value invariant 3 forbids
- **B forecloses the SILENT harm.** `case=8` `[t0]`'s *"findsert, never insert"* would otherwise
  **find** the stale entry, and a genuinely new post-rewind dispute inherits the old rationale — a
  council reads an argument the driver never made, with no mark that it is inherited

## 🔴 .what B does NOT fix, and that is the live question

B stops the **inheritance**. it does not clear the **moot row**: the old entry and its summary line
persist, so a council that opens `.fulcrums/` sees two rows for one reviewer and cannot tell that
the first was rewound out from under.

⇒ **the fork collapses to one narrower question, and it is A on its own:**

> **does a rewound dispute's fulcrum entry owe a mark, or is the `rewound` row in `passage.jsonl`
> enough for a council to cross-check?**

⚠️ **that is a genuinely open call and it is the wisher's** — it trades one new dependency
(`rewindAffectedStones` would have to reach into `.fulcrums/`, which no engine operation does today)
against a council that must cross-reference two files by hand.

## .rework, and why

**clean.** B is a key choice inside an operation this behavior writes from scratch — no caller
exists to harden against it. A is additive and separable: a hook that marks an entry can land later
with no change to the mint.

## .confidence, and why it is 65%

**B itself is near-certain** — it follows from invariant 3, which is argued twice and grounded in
`getLatestPeerGivensPerSlug`'s own `.why`.

the 35% sits on the re-frame: I am the party that benefits from *"A is separable, so it need not
block"*, and a council may hold that a record which misleads is not separable from a record that is
correct. ⚠️ **`review.self r4` measured that 5 of 6 adjudicated fulcrums on the peer route were
reversed, and confidence protected none of them** — a 65% here should be read against that rate,
never against intuition.

⇒ **what would settle it:** whether the wisher wants the mark (A) in this behavior's scope, or as a
follow-on. ⚠️ **it is NOT a member of the F04 · F13 · F14 trio** — those three ask when and whether a
second look happens; this asks what the record looks like once a human has already intervened.

## .where

`1.vision.yield.md` § *the contract* invariant 4 · § *the pit of success* ·
`1.vision.experience.case=8.the-flip-flop-refused.md` § *what `[t4]`'s rewind LEAVES*

## .the verdict

_not yet ruled._
