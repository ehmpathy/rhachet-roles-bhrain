# F1 — an unenrolled driver halts rather than warns

**rework** = clean · **status** = ✅ ruled 2026-09-15 — halt, upheld · **confidence** = 70% at the time

## .the fork

a stone declares `brain:` and the driver has no clone address (`clone whoami` exits 2).

- **halt** — the stone stops; the human enrolls, or removes the field
- **warn and continue** — a loud line, then the inherited brain

## .taken, and why

**halt.**

- the wish's bound: *"fail loud, never a silent no-op, if the driver clone is unreachable"*
- the harms are asymmetric: a missed warn ships a stone done by the wrong brain and nobody learns
- `rule.require.safe-by-default`

## .the counter-case

unenrolled is the **default** state — `rhx clone list` returned `{"actors": []}` mid-drive (n=1).
a halt gates the default path for a feature nobody asked to be mandatory. a middle exists — halt
once per drive, then warn — at the cost of per-drive state.

🟡 how often drives run unenrolled cannot be counted: an unenrolled drive leaves no record.

## .rework

clean — halt → warn is one branch; no caller is hardened against it.

## .where

`1.vision.experience.case=2.the-driver-was-never-enrolled.md`

## .the verdict

✅ **halt, upheld** — *"halt"* / *"always halt"* (`.seeds/inventory.of=seeds.case=S8-always-halt.md`).
*"always"* strikes the halt-once middle. `case16` / `case16b` already pin it; no rework owed.
