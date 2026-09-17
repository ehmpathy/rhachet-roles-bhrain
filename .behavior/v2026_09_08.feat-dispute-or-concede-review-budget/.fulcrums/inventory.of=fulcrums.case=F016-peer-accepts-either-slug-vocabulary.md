# F16 · `--peer` accepts EITHER slug vocabulary, so the halt's two commands cannot disagree

- **rework** = clean · **status** = best-guessed · **confidence** = **80%**

**raised at `review.self r4`**, when the `--peer` chain was traced end to end and found consistent —
and the inconsistency turned out to sit **between** it and `--that`.

## .the two vocabularies, each correct alone

| flag | vocabulary | verified |
|---|---|---|
| `--that <slug>` | 🔴 **sanitized** — `/[/\\]/g → '-'` | `setStoneAsContemplated.ts:80-81` — *"the sanitize is the WRITE side's grammar … `--that <slug>` names the sanitized form the prompt printed"* |
| `--peer <slug>` | 🔴 **config**, as written in the guard YAML | traced five hops: `getAllReviewPeerMeterStatuses:86,222` → `getExhaustedReviewerSlugs:30` → `getRouteDriveBlockerMessage:70` → `computeBlockRemedyGroups:79-85` → `route.ts:1853` |

⇒ **neither is a defect. the `--peer` chain never drifts, and the `--that` grammar is deliberate** —
a slug is a path segment on the write side, so a separator must be swapped or the `.taken` path
breaks.

## 🔴 .the fork this behavior creates

**this design puts them adjacent for the first time.** `case=6`'s halt emits both commands for one
lane, and `case=9` emits them within one journey. with a slug that holds a separator:

```
rhx route.stone.set   --stone 5.1.execution --as conceded --with bhrain-architect
rhx route.guard.budget --for review --add 2 --peer bhrain/architect --stone 5.1.execution
```

**one reviewer, two spellings, adjacent lines.** `rule.forbid.ambiguous-labels` grades this outright
— *"each name, flag, and output reads one way only; no result invites a re-read"* — and its
enforcement line makes an ambiguous output value a **blocker**.

⚠️ **and the failure is SILENT.** a driver who carries the sanitized form across to `--peer` hits
`:1853`, matches zero budget lines, and the top-up reports no update for that lane. it does not
throw: `route.ts:2065`'s unknown-slug error fires on the **command's own** validation, and a driver
who reads *"no update"* reads it as a budget that was already high enough.

| fork | what it does | what it costs |
|---|---|---|
| **A — sanitize both sides of the `:1853` compare** | `--peer` accepts either form | one line, and it changes an extant CLI's accepted input |
| **B — label each command with its vocabulary** | the halt says which form each takes | cures the READ; the slip still slips |
| **C — leave it** | naught | the ambiguity ships, and it is silent |

## 🔴 .taken: fork A — 80%

`rule.prefer.prevent-over-correct`'s ladder is explicit about the order: **rung 1 is *make it
impossible*, and rung 2 is *make it hard*.** fork B is rung 2 and fork A is rung 1, and rung 1 is
affordable here — a sanitize on both sides of one comparison.

⇒ and it only **widens** what is accepted: every input that works today still works, so no extant
caller moves. that is what makes the rework `clean`.

**the 20%:**

- it changes what an extant, published CLI flag accepts. that is a contract decision, and
  `route.guard.budget` is a driver-facing surface a human also uses
- fork B is cheaper and needs no contract change, and a reader who holds that the two-vocabulary
  split is worth a lesson rather than a cure would prefer it
- ⚠️ **and the whole item rests on a case nobody has hit**: no slug on this route or the prior one
  holds a separator. the hazard is real and its **frequency is unmeasured**

## ⚠️ .why the walk did not catch this, and why that is worth a line

every slug in **every demo** is a single word — `architect`, `ergonomist`, `mechanic`, `counter`,
`cleanly`, `ghost`. **so the two vocabularies coincide in every cell of the walked product.**

🟡 **neither the demo count nor the cell count is stated here, and both were once copied in.** the
cell count read `120` through the `rewind` split that moved it to 135, and the demo count read `nine`
through the addition of `case=10`. ⇒ **the claim does not need either number** — it needs *"every"*,
which is what the sweep actually established and what no later addition can stale.

⇒ **a demo's incidental choice of names concealed a defect class**, and the walk could not have
caught it: the slug's shape is not one of the three axes, and
`rule.require.dimensional-decomposition` earns completeness only over the axes it declares.

🟡 **this is not an argument for a fourth axis.** a `slug-shape` axis would double the grid and
duplicate every verdict outside two rows — the same logic that files `stance-agrees?` and
`why-is-substantive?` as latent axes rather than coordinates. **it is an argument for at least one
demo whose slug holds a separator**, which is a cheap fix and is owed at `2.1.criteria`.

## .what would settle it

one question to the wisher: **"may `--peer` widen to accept the sanitized form too, or should the
halt name the two vocabularies instead?"**

- widen → **fork A**, and the driver never has to know there were two
- name them → **fork B**, and the halt gains a label per command

## .where

`1.vision.yield.md` § *the pit of success* · `case=6` `[t2]` · `case=9` · `F02` (why two statuses) ·
`route.ts:1853` · `setStoneAsContemplated.ts:80-81`

## .the verdict

*(unruled)*

## .see also

`F01` — the per-lane grain that makes `--peer` and `--that` co-occur at all · `F05` — the live
concede's remedy, which emits the `--peer` half
