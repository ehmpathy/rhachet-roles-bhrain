# S10 · the driver must be TAUGHT to protect budget — and a rewind has a grain

- **said 2026-09-10**, in four messages — a question about the **briefs**, then a scope proposal,
  its ground, and the wisher's own answer to it

## .said

> and how are our briefs updated, for the driver, to teach them about the new dispute|concede
> paradigm ? we gotta teach the driver to expect and adhere to this pattern, to protect budget
> unless they detect a true severe | frequent blocker that they want reviewed. (or, in case there
> was a severe restructure, in which case they need to --as rewound --grain peer|self|both

> and can we add --as rewound --grain peer|self|both ? as part of this too

> since we typically want to rewound peer reviews in case of severe refactors, but not self reviews

> or should that be separate and we just teach --as rewound, and the dream for --grain
> peer|self|both can be later

🟡 the unclosed parenthesis is the speaker's and it stays — a mid-thought turn is the record.

🔴 **the fourth message is the wisher's answer to their own second, and it arrived before I gave
mine.** ⇒ a shape worth the note: **a scope proposal put as a question, then bounded by its author
within one minute.** the row I owed was never *"should we build it?"* but *"is the bound right?"*

## .settled

### 1. 🔴 the design is not delivered until the DRIVER BRIEFS teach it

> **we gotta teach the driver to expect and adhere to this pattern**

⇒ the vision's §*the rules that must move* listed six briefs and graded them as **contradiction
repair** — *"left unchanged, these braid against the new gate."* **that is the smaller half.** the
wisher asks for a **norm the driver holds**, not merely an absence of contradictory prose.

| the ask I had recorded | the ask the wisher states |
|---|---|
| six briefs must stop to say the opposite | six briefs must **teach the pattern**, plus a norm none of them holds today |
| the driver learns the stance from a **halt** | the driver **expects** the stance before a halt names it |

🔴 **and `rule.require.discoverability` grades the gap I had: *"a required step reachable only from
memory or source"* is a blocker.** a stance is required by acceptance #1, so a driver who meets it
first at a halt has met it too late.

### 2. 🔴 the bar names the DISPUTE — ⚠️ and this section said the opposite until `S11`

> **to protect budget unless they detect a true severe | frequent blocker that they want reviewed**

🔴 **read it as: concede-and-fix by default; DISPUTE only at the bar.** the wisher corrected this
section's first draft the next day, in one sentence — *"dispute is not a default; the reviewer should
concede by default and fix the flagged blockers|nitpicks; dispute is only an escalation path."*

⇒ **the full correction, and the one word I mis-scoped, are `S11`.** what stays true here:

| `S09` | this |
|---|---|
| a top-up reaches naught by **default** | a driver reaches for a lever only at a **named bar** |
| a mechanism | a **norm** |

**the bar has two clauses, and the wisher joined them with `|` rather than `&`:**

- **severe** — the concern's harm is real if it ships
- **frequent** — the concern recurs, so one council read settles a class rather than an instance

⚠️ **the draft that stood here read *"reviewed"* as *"reviewed by the peer, next round"*, and built a
dispute-default on it.** it means **reviewed by the COUNCIL** — which `--why`'s own purpose already
stated (`S05`: *"to guarantee to review it later"*). ⇒ `S11` carries the inversion and what it
dissolves.

🟡 **the wish's own thesis, arrived at from the driver's side:** *"budget is the wrong instrument to
end a disagreement."*

### 3. 🔴 a REWIND is the third lever, and it is the one the halt never names

> **in case there was a severe restructure, in which case they need to `--as rewound`**

⇒ a driver who restructures an artifact has invalidated every peer verdict on it. **neither stance
fits**: a dispute asserts the concern is fine to continue, a concede asks for one more round on
prose that no longer exists. **the correct move is to void the verdicts.**

✅ **and it is already the driver's lever.** `setStoneAsRewound.ts` carries **no human gate** — no
approval check, no TTY guard. ⇒ **the vision was wrong to call it *"a human `--as rewound`"***
(§ edge cases, `case=8` `[t4]`), and the correction costs a brief line rather than a build.

### 4. 🔴 a rewind has a GRAIN, and today it has none

> **since we typically want to rewound peer reviews in case of severe refactors, but not self reviews**

**this is a defect, and it is measurable.** `delStoneGuardArtifacts.ts:24-51` sweeps **five** globs in
one pass:

| the glob | its grain |
|---|---|
| `enumRouteGuardReviewPeerFiles` | **peer** |
| `enumRouteGuardJudgeFiles` | the judge — shared |
| `.route/${stone}.guard.promise.*.md` | 🔴 **self** |
| `.route/${stone}.guard.selfreview.*.triggered.*.md` | 🔴 **self** |
| `.route/${stone}.blocked.triggered` | the halt marker |

⇒ **a rewind wipes the self-review ladder along with the peer verdicts**, so the driver re-bears
every self review after a refactor that changed no self-review answer. ⚠️ and
`rule.always.bear-every-self-review` states the cost outright — *"the count is the WORK, never a
budget"* — so the re-bear is not a formality.

🟡 **the grain split is already latent in that function**: three globs are self, one is peer, one is
the judge. `--grain` names a partition the code has drawn and never exposed.

### 5. ✅ and the wisher bounded it themselves — the grain is a DREAM

> **or should that be separate and we just teach `--as rewound`, and the dream for
> `--grain peer|self|both` can be later**

✅ **yes, and the bound is the correct one.** run the two questions
(`rule.always.fix-forward-under-scouts-honor`):

| | verdict |
|---|---|
| **SAFE?** | 🔴 **no.** `--as rewound` is shipped and every route in every repo passes through it; a grain flag changes what it deletes |
| **CLEAN?** | 🔴 **no.** it ripples into `rewindAffectedStones`, the cli union, the emit, and the self-ladder's own trigger state — a promise kept rather than deleted changes whether the ladder re-fires |

⇒ **a deferral for DIRT, which owes a dream AND a fulcrum.** and it crosses the wish's own boundary:
*"do not touch the SELF-review ladder."*

⚠️ **what stays in scope is the TEACH, and it is not free of the defect.** the brief must name
`--as rewound` **with its cost stated** — it voids the peer verdicts **and** re-arms the self ladder
— or a driver takes the lever and meets the second half as a surprise.

## 🔴 .the through-line — a MECHANISM is not a PARADIGM until a brief carries it

`S09` settled what the engine does with budget. **this settles what the driver believes about it**,
and the two are different deliverables:

| | the artifact | the failure if absent |
|---|---|---|
| `S09` | a default in `route.guard.budget` | a driver widens a top-up by accident |
| `S10` | a norm in the driver's booted briefs | a driver **concedes by habit**, and the default protects naught |

⇒ **a scarcity mechanism whose norm is untaught is a mechanism that measures the wrong quantity.**
the top-up narrows, the driver concedes on every lane, and the budget drains one explicit command
at a time — every one of them sanctioned.

🟡 **and this repo has the rule that predicts it:** `research.selfreview-effectiveness` measures a
when-then **cue** at `d = 0.65` against a bare principle at `d = 0.05`. ⇒ so the brief owes a **cue
table**, never a paragraph — *"when a reviewer rejects and you disagree → dispute"*, over
*"protect budget."*

## .landed

- `.dream/v2026_09_10.feat.a-rewind-has-no-grain.md` — the `--grain` deferral
- `.fulcrums/inventory.of=fulcrums.case=F023-the-rewind-grain-is-deferred-to-a-dream.md`
- `1.vision.yield.md` § *the rules that must move* — the teach half, and the rewind row
- `1.vision.yield.md` § edge cases — *"a human `--as rewound`"* corrected
