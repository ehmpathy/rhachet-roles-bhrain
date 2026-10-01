# S8 — always halt

**source** = the wisher, 2026-09-15 · **settles** = `F1`

## .said

> halt

> always halt

## .settled

> **when a mechanism cannot ENFORCE a prescription and the failure is asymmetric — a silent wrong
> outcome on one side, a loud stop on the other — HALT is the default. and it halts EVERY time, never
> softens to a one-time warn.**

that is the whole concept, and it holds with no reference to brains, clones, or this feature.

### 🔴 the "always" is the decisive word

the fork offered three answers: halt · warn-and-continue · **halt-once-per-drive, then warn**. the
middle option was the ergonomic compromise — loud on first contact, permissive after — and it was
the recommendation on the table. *"always halt"* rejects it outright.

⇒ **the verdict is not merely "halt over warn"; it is "halt is not a first-contact courtesy to be
spent, it is a permanent gate."** the reason a prescription exists is that its absence is a real
harm; a gate that opens itself after one warn is a gate that stops to guard exactly the drives that
run longest past the warn.

### 🔴 safe-by-default beats convenience-by-default even when the safe path is the COMMON path

the counter-case was strong and measured: unenrolled is the DEFAULT state, so a halt gates the
default path for a feature nobody asked to be mandatory. the verdict weighs that and still chooses
halt.

⇒ **the blast-radius argument — "but this fires on the common case" — is not a reason to soften a
safety gate; it is a reason the gate matters MORE.** a gate that only ever fired on the rare case
would protect little. one that fires on the default path does its whole job, and the friction it
adds is the cost of the guarantee, paid loudly and once per fix rather than silently and forever.

🟡 the shape is `rule.require.safe-by-default` at its sharpest: the easy path (an unenrolled drive)
is made to STOP until it is the correct path (an enrolled one), rather than allowed to proceed
wrongly with a note.

## .landed

- `.fulcrums/inventory.of=fulcrums.case=F1-unenrolled-driver-halts-vs-warns.md`
- `.fulcrums/inventory.of=fulcrums._.md`
- `1.vision.experience.case=2.the-driver-was-never-enrolled.md`
