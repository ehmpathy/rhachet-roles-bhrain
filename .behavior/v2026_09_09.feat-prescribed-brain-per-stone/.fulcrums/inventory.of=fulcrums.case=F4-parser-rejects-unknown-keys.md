# F4 — the guard parser stays permissive; an unknown key is dropped

**rework** = 🔴 dirty · **status** = ✅ ruled 2026-09-10 — best-guess overturned · **confidence** = settled

## .the fork

`parseStoneGuard` drops unknown top-level keys in silence (`parseStoneGuard.ts:164-430`), so a
misspelled `brain:` vanishes with no throw, no warn, no trace.

- **reject** — close the key set; an unknown key throws and names the valid ones
- **keep the drop** — unknown keys stay ignored

## .the best-guess, and why it lost

the best-guess was **reject**: `case=4` is the one critipath with no natural moment of discovery, and
a contract that accepts a key and discards it is `rule.forbid.failhide`'s shape.

the counter-case decided it: **the silent drop IS the forward-compatibility mechanism.** an older
parser meets `brain:` and ignores it rather than crashes. close the set and every guard that declares
a new field becomes unparseable to every consumer on an older bhrain.

- inside this repo the migration cost is zero: 12 guards, keys only `artifacts` · `reviews` ·
  `judges` · `protect`
- 🟡 the risk that decides the call — a new guard read by an old parser in a downstream repo — is
  unreachable from this worktree, so that count does not discharge it

## .rework — 🔴 dirty

it changes parse behavior for every guard in every consumer repo; a reversal is a teardown across repos.

## .where

`1.vision.experience.case=4.the-field-name-is-misspelled.md` — `[t4]`; `case=_` fact **F-b**.

## .the verdict

**keep the drop.** *"lets not"* · *"we want future compat."* (`.seeds/…case=S2-the-fulcrum-council-settles-three.md`)

> forward compatibility is a property of the format; a loud typo is a property of one author's afternoon.

🟡 **`case=4` is still owed a fail-safe.** the verdict removes the throw and leaves the warn:

| remedy | status |
|---|---|
| throw on an unknown key | 🔴 ruled out |
| warn on a near-miss of a known key | ✅ available, keeps the drop |
| `model:` as a warned alias (`F2`) | ✅ built — now the whole defense for the likeliest typo |

⇒ the full entry, with every re-grade: `../appendix/.fulcrums/inventory.of=fulcrums.case=F4-parser-rejects-unknown-keys.md`
