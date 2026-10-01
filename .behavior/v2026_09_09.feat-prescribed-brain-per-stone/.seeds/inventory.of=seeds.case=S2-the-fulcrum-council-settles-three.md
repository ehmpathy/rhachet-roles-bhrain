# seed S2 — the fulcrum council settles three, and asks after the fourth

**source** = the wisher, at the vision stone's fulcrum council · **date** = 2026-09-10

## .said — verbatim, unedited

> lets not;
>
> F4 — should the guard parser reject unknown top-level keys? (65%, 🔴 dirty)
> - reject → case=4 closes: a typo'd model: halts loud instead of vanishing
> - reject → every guard in every downstream repo loses forward compatibility, and the reversal is a teardown
> - measured here: 12 guards, 4 distinct keys, zero unknown. that measurement cannot reach downstream repos — which is why I held it at 65% rather than raised it
>
> ; we want future compat. ; explain? F5 — ask rhachet to grow a brain field on clone whoami? (70%, 🔴 dirty, cross-repo)
> - with it: a refused brain slug halts
> - without it: the record reads requested — unconfirmed, which is true and cannot lie by construction
> - ⇒ a downgrade, not a stall. the feature ships either way; what you lose is a verifiable cost record, and cost is the feature's whole justification
>
> ; for now, lets use the brain-cli's own /model argument ; ; only the driver
> F12 — does brain: govern the driver alone, or the peer reviewers too? (85%)
> - a guard already declares brains — one --brain per reviewer
> - guessed driver-only. three defensible reads differ by 4× in review spend

🟡 **the words are interleaved with the quoted council text, and that is how they arrived.** each
`;` opens a verdict on the fulcrum whose block precedes or follows it. the table below states which
verdict lands on which call, because the interleave is the one part a later reader could read two
ways.

## .settled

| the call | the verdict | the wisher's words |
|---|---|---|
| **F4** — reject unknown top-level keys? | 🔴 **NO. the parser stays permissive** | *"lets not"* · *"we want future compat."* |
| **F5** — ask `rhachet` for a live-brain surface? | ❓ **not settled — an explanation was asked for** | *"explain?"* |
| **F10** — which vocabulary does `brain:` hold? | 🔴 **the brain-cli's own `/model` argument** | *"for now, lets use the brain-cli's own /model argument"* |
| **F12** — driver alone, or the reviewers too? | 🔴 **the driver alone** | *"only the driver"* |

### what each verdict means, stated as a concept rather than as a round

- **forward compatibility outranks a loud typo.** a guard format that refuses an unknown key cannot
  be extended by a newer producer against an older consumer. the cost of that is paid by every repo
  that consumes the format; the cost of a silent typo is paid by one author, once, and is
  recoverable by other means
- **a prescription is written in the vocabulary of the tool that executes it.** the value in a guard
  is handed to `/model` verbatim, so the guard declares what `/model` accepts — no translation layer,
  no second vocabulary to keep in step
- 🟡 *"for now"* is the wisher's own bound on that. it settles the value **today** and does not claim
  the brainslug vocabulary is wrong forever
- **a declaration governs the actor it names.** `brain:` names the driver's brain; the reviewers
  already carry their own `--brain` per lane, and one key does not reach across two scopes

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F4-parser-rejects-unknown-keys.md`
- `.fulcrums/inventory.of=fulcrums.case=F10-the-declared-value-is-a-brainslug.md`
- `.fulcrums/inventory.of=fulcrums.case=F12-brain-bounds-the-driver-not-the-reviewers.md`
- `.fulcrums/inventory.of=fulcrums._.md`
- `1.vision.yield.md`
- `1.vision.experience.case=4.the-field-name-is-misspelled.md`
