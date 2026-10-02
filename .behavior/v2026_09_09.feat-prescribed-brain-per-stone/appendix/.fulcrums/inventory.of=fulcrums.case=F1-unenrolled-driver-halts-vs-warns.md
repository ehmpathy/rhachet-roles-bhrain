# F1 — an unenrolled driver halts rather than warns

**rework** = clean · **status** = ✅ **ruled 2026-09-15 — HALT, upheld** · **confidence** = 70%

## .the fork, stated fairly

a stone declares `brain:`. the driver has no clone address (`clone whoami` rejects — measured). two
answers:

- **halt** — the stone stops. the human re-enrolls, or removes the field
- **warn and continue** — a loud line, and the stone proceeds on the inherited brain

## .taken, and why at the time

**halt.**

1. the wish's own bound: *"fail loud, never a silent no-op, if the driver clone is unreachable"*
2. the harms are asymmetric. a missed warn ships a verification stone done by the wrong brain and
   **nobody ever learns**. a halt costs one command and teaches at once
3. `rule.require.safe-by-default` — the easy path should be the correct one

## .the counter-case, stated fairly

⚠️ **unenrolled is the DEFAULT state** — measured below, not estimated. a halt turns a convenience
feature into a gate on the default path, for a route that would otherwise run fine. that is a large
blast radius for a feature nobody asked to be mandatory.

⇒ a defensible third answer exists: **halt once per drive, then warn** — loud on first contact, and
permissive after. it is not best-guessed here because it adds per-drive state, and `F6` already
argues that state which does not exist cannot drift.

## .rework, and why

**clean.** halt → warn is a branch on one condition. no caller is hardened against it, no artifact
records it, no later stone builds upon it.

## 🔴 .the frequency premise was UNMEASURABLE as stated — restated at self-review r1

this fulcrum rested on *"most drives today are unenrolled"*, flagged in the yield as **estimated,
never counted**. r1 tried to count it and found the claim cannot be counted **by anyone**:

| the source | why it cannot answer |
|---|---|
| `passage.jsonl` | `PassageReport` carries `stone`, `status`, `blocker?`, `level?`, `reason?` — **no enrollment field** |
| the clone registry | 🔴 **an unenrolled drive leaves no record.** that is fact **F-a** itself — so the population is invisible by construction |

⇒ **the denominator does not exist.** a fraction over "all drives" is unmeasurable in principle, not
merely unmeasured — and a premise nobody can ever check is a poor thing to weigh a call on.

### what IS measurable, and was measured

```
$ rhx clone whoami        →  ConstraintError: not run inside an enrolled clone   (exit 2)
$ rhx clone list --output json
{
  "actors": []
}
```

**zero enrolled clones on this host, while a drive was underway.** n=1, first-party, and it settles
the structural half rather than the frequency half:

> **unenrolled is the DEFAULT state.** enrollment is a deliberate act (`rhx enroll`); a drive
> launched any other way has no clone address, and no surface prompts the human toward one.

⇒ the counter-case now rests on **that**, which is checkable, rather than on a majority nobody can
count. the argument's force is unchanged — a default-state gate has a large blast radius either way
— and it is now falsifiable: run `rhx clone list` and see.

## .confidence, and why 70% — unmoved, and now for a stated reason

the *harm* argument is strong and measured. the *blast radius* argument is equally real, and it no
longer rests on an uncountable frequency — it rests on a measured default state.

⚠️ **the number does not move**, because the measurement did not settle the fork; it repaired the
premise. the wisher's call is still a judgment between two real harms, and it is theirs.

🟡 **and n=1 is a fulcrum cue in its own right** (`rule.always.itemize-the-fulcrums-you-best-guess`:
*"an n=1 generalization"*). one empty registry on one host is evidence, not a survey. it is recorded
as what it is.

## .where

`1.vision.experience.case=2.the-driver-was-never-enrolled.md` — the demoed critipath.

## .the verdict

✅ **ruled 2026-09-15 — HALT, upheld.** the wisher: *"halt"* / *"always halt"* (archived verbatim at
`.seeds/inventory.of=seeds.case=S8-always-halt.md`).

the best-guess (halt) is upheld, and the *"always"* explicitly rejects the halt-once-then-warn
middle that was on the table: a safety gate is permanent, never a first-contact courtesy to spend.
the code already implements this (case16 + case16b pin the halt at acceptance grain), so no rework
is owed — the verdict confirms the shipped behavior.
