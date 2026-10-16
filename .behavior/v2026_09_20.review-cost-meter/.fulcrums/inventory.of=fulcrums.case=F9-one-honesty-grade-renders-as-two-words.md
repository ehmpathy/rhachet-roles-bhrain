# F9 — one honesty grade renders as two words across the `--of` axis

- raised 2026-09-22, by the driver, at i010 (re-raised by `enroll-impl-behavior-intent` through i021 — the **most re-raised concern on the board**)
- rework: **clean** — one render string, reversible in one edit
- status: **BEST-GUESSED at i021 — option A taken.** the council may flip it; the rework stays clean
- confidence: **95% that a row was owed / 🔴 40% that A is the RIGHT option, unchanged**

## 🔴 .why the DEFERRAL became the defect, at i021

`enroll-impl-behavior-intent` raised this as a **blocker** at i021, with an argument the prior
re-raises had not made: it is cheap, it is the most-repeated complaint in the whole review trail,
and — unlike `F7`/`F8`/`F17` — it needs neither a live brain nor an architecture call to settle.
one word, and updated snapshots.

⇒ **that lands, and it lands on the DEFERRAL rather than on the option.** re-read
`rule.always.defer-fulcrums-to-last`:

| the fulcrum is | the driver |
|---|---|
| open, rework **clean** | 🔴 **best-guess, note why, flag for the end** |
| open, rework **dirty** | halt — last, and named |

this row declared its own rework **clean** on 2026-09-21 and then took the **dirty** branch for
fifteen rounds. the deferral criterion was misapplied to a field the row had already filled in
correctly — the third occurrence of this inventory's criterion defect (see `F17`'s last section),
and the first where the row's own text held the refutation.

🟡 **a best guess is not a verdict, and that is the point of rung 2.** the row stays, the council
still rules, and a flip costs one string. what the guess buys is that a reviewer stops to spend a
round on a question no artifact could answer.

## .the guess, and why A

**option A — render `unknown` at both breadths.** chosen on a rule rather than on taste, which is
what makes it defensible at 40% confidence in the option:

- `ReviewRunGrade` declares `'metered' | 'refused' | 'unknown'`, and `--json` emits those words
  at every breadth. so `unmetered` on stdout is a **synonym of a declared term on a published cli
  surface** — the case `rule.forbid.domain-term-synonyms` grades a blocker and calls the most
  expensive place to drift
- 🔴 **A is the ONLY option of the four that touches no contract.** B changes the grove render, C
  changes the type AND the json payload, D adds two declared constants and a divergence to tend.
  A changes one render string to match what the type and the json already say
- ⇒ so A is the **minimum** guess: the smallest edit that closes the concern, and the one a
  council flip reverses most cheaply. C may still be the more coherent end state — that argument
  is untouched below, and it is the wisher's to take

🟡 **what A gives up** is the tree's symmetric triple `metered · refused · unmetered`, three past
participles of one verb. the parenthetical `(spend unrecorded, NOT zero)` carries that sense and
states WHY the grade holds, which the single word never did.

## .the clamp the divergence never had

🔴 **the sharpest thing the reviewer said is not about the word at all:** no test asserted the two
surfaces should ever converge. the divergence was pinned as *current* behavior in snapshots, so a
repair had to RED a green test rather than GREEN a red one.

that was exactly true. `reviewCost.acceptance.test.ts:813-818` asserted `1 unmetered ⚠️` under a
comment that named the divergence and pinned it on purpose. ⇒ **the suite was green because the
surfaces disagreed**, and fourteen re-raises could not change that.

`genReviewMeterStdout.test.ts` now carries a convergence clamp that asserts the ABSENCE of every
off-vocabulary word, never the presence of the right one — a presence check passes while a
synonym sits beside it, which is the state this repair found. **proven red**: with the render
word reverted, 9 passed / 2 failed.

## 🔴 .why this row is late, and what the lateness proves

the work has been on record since 2026-09-21 as
`.dream/v2026_09_21.fix.one-grade-renders-as-two-words-across-the-of-axis.md`. that dream is
good — it states the gap, both repair shapes, and a checkable grep. it answers its own
SAFE/CLEAN honestly:

> **CLEAN — no.** it re-snaps every stdout snapshot across `run`, `tree`, and `grove` […]
> ⇒ and the choice between the two shapes above is a **wisher** call, not a driver one.

⇒ **a dirt deferral, admitted in its own text, with a wisher call named in its own text — and no
fulcrum row for a full day.** that is `F6`'s defect, verbatim:

> a dream alone reports the work and hides the call.

🔴 **and `F6` wrote the mechanical detector that would have caught it:**

> a dream whose `.why it is not done in this round` answers **SAFE — no** or **CLEAN — no** is a
> dirt deferral by its own text, and a dirt deferral owes a fulcrum. ⇒ that is a `Glob` over
> `.dream/`, not a judgment.

**the detector was written and never run.** ⇒ see `.the detector this inventory wrote and did
not run` in `inventory.of=fulcrums._.md` for the full sweep; this row is one of its hits.

🟡 **so the reason a peer re-raised this five rounds over is mechanical, not stubborn.** each
round the driver answered *"already caught as a dream, it is a wisher call"* — which was true,
and left the wisher with no place to rule. a deferral with no row is re-litigated every round by
construction, because the only artifact a reviewer can see says *work owed*, never *call made*.

## .the fork, stated fairly

`ReviewRunGrade` declares `'metered' | 'refused' | 'unknown'`. two surfaces on one axis print
that one grade with two words:

| surface | prints for grade `unknown` |
|---|---|
| `--of run` / `--of tree` | `unmetered ⚠️` |
| `--of grove` | `unknown` |

the `--json` payload emits `unknown` at every breadth, so the **data** already agrees and only
the **render** diverges.

| option | the claim |
|---|---|
| **A — render `unknown` at both** | matches the type, the json, and the grove. one word, one concept (`rule.forbid.domain-term-inconsistency`). cheapest |
| **B — render `unmetered` at both** | keeps the tree's symmetric triple `metered · refused · unmetered`, which reads as three past participles of one verb. but the render word still differs from the TYPE word, so it repairs the axis and leaves the code/render seam |
| 🔴 **C — rename the GRADE to `unmetered`** | one word in the type, the json, and both renders. it also matches the peer axis exactly — `attributed` / `unattributed` — so the two grade vocabularies would finally rhyme. **the only fully coherent option, and the only one that touches the json contract** |
| **D — two words, DECLARED as a pair** | `WORD_OF_UNKNOWN_TREE` / `WORD_OF_UNKNOWN_GROVE` with a `.note`. the precedent is real: `WORD_OF_ABSENT` answered this same question with a deliberate divergence |

🔴 **option C did not exist in the dream, and it is the coherent one.** the dream framed the
question as *"which of the two RENDER words wins"*, which silently assumes the type word is
fixed. it is not — every surface here is unreleased.

## .taken, and why at the time

### at i010 — no change, and the row was the change

- 🔴 **the driver cannot rule it.** the dream is right that this asks whether a human at a
  terminal is better served by one vocabulary or two registers, and `WORD_OF_ABSENT` answered the
  same question the other way — so the answer is genuinely not obvious
- **option C reaches the json**, which is the one part of this that is a consumer contract rather
  than a render choice. that raises the stake past a snapshot sweep
- **a fix chosen now would be chosen blind.** four options, one of which nobody had written down
  until this row existed

### 🔴 at i021 — option A taken, and the i010 reasons re-read

each of the three above is still TRUE, and none of them warrants a fifteenth deferral:

| the i010 reason | what i021 makes of it |
|---|---|
| *"the driver cannot rule it"* | correct — and rung 2 does not ask a driver to RULE, it asks for a **best guess** the council can flip. the row is what preserves the ruling |
| *"option C reaches the json"* | 🔴 **an argument against C, never an argument for no change.** A reaches no contract at all, and it was available the whole time |
| *"a fix chosen now would be chosen blind"* | it would have been at i010, before the four options were written down. they are written down now, so the choice is informed — which is precisely what the row bought |

⇒ **the row did its job and then outlived its own reason.** the argument that justified the
deferral was the argument that made the deferral unnecessary one round later, and nobody re-read
it for fifteen rounds because a reviewer's re-raise does not prompt a re-read of the row that
answers it.

## .rework, and why

**clean**, for A, B, and D — two render strings, ~6 test assertions, 2 snapshot files.

🟡 **C is clean too, and larger**: the type, every `grade === 'unknown'` comparison, the json
payload, and both renders. no external consumer (unreleased), so it ripples past no boundary —
but it is the one option a later reverse would find dear.

## 🔴 .confidence, and why it splits

**95% that a row was owed** — the dream names a wisher call in its own text, and five rounds of
re-raises are the evidence that no row means no verdict.

🔴 **40% on which option wins.** genuinely open, and the `WORD_OF_ABSENT` precedent cuts toward
D while `rule.forbid.domain-term-inconsistency` cuts toward A or C. a driver guess here would be
a coin flip dressed as a decision.

## .where

- `src/domain.operations/review/meter/genReviewMeterStdout.ts` — `asUnknownCaveat` (was
  `asUnmeteredCaveat`) and the census line, both now `unknown`. the header carries the rule that
  decided it, so a council flip reads WHY before it flips
- `src/domain.operations/review/grove/genReviewGroveStdout.ts` — `asCensusLine`, untouched. it
  said `unknown` all along, and A is the option that makes the tree agree with IT
- 🔴 `src/domain.operations/review/meter/genReviewMeterStdout.test.ts` — **the convergence clamp**,
  which is the part that outlives whichever word wins. flip to B, C, or D and this test is what
  forces the flip to reach every surface at once
- `src/contract/cli/reviewCost.acceptance.test.ts:807-825` — the assertion that **pinned** the
  divergence, now converted to the assertion that forbids it
- `.dream/v2026_09_21.fix.one-grade-renders-as-two-words-across-the-of-axis.md` — the work, now
  done at option A
- `src/domain.operations/review/meter/asFigureHuman.ts` — `WORD_OF_ABSENT`, the precedent for D

## .the verdict, once ruled

> _unruled — and the guess is A._ the council rules between A (shipped), B, C, and D. a flip to
> B or D is one render string plus a resnap; a flip to C additionally moves the type and the json
> payload, which is the only option that reaches a consumer contract.
