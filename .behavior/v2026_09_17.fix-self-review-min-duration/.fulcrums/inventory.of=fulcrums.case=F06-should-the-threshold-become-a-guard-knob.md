# fulcrum F06 — should the 30s threshold become a guard knob

**rework** clean · **status** 🔴 **RE-OPENED — the threshold is back** (`S13`) · **confidence** 85%
**where** `getSelfReviewChallengeDecision.ts:55`, `RouteStoneGuard.ts`

## 🔴 .this fulcrum was marked MOOT and the mootness was WRONG within a day

it read 🌙 **moot** on one premise: *"`S11` removes the elapsed measurement entirely, so there is no
threshold left to expose or to hard-code."*

**`S13` restores the measurement.** the challenge now fires on `attempts == 0 ∧ elapsed < 30s`, so a
30s threshold exists again — and the fork below has its operand back, unchanged.

⇒ **the drive's guess stands and is no longer retired: keep it hard-coded, at 85%.** the argument is
the one the fork always carried, and `case=7` sharpened it mid-round: `hashbar: 0` was a bug report
written in yaml **and a fix that never fired**, so the knob let a defect persist by offering its
victims a place to hide it.

## 🔴 .the lesson, and it is the one `r5` predicted in this exact shape

`r5` wrote a check into the fulcrum index and this fulcrum is its first live catch:

> *"for every resolved fulcrum, ask what open fulcrum could change what its answer is worth."*

**`F06` was closed by `S11` and re-opened by `S13`, one open fulcrum away.** the mootness was
correctly derived from the state of the round at the hour it was written, and it was falsified by the
next utterance — because `F11` was open, and `F11`'s answer sets whether a threshold exists at all.

⇒ 🟡 **a 🌙 MOOT marker is more dangerous than a ✅ RULED one**, and this is the transferable part. a
ruled fulcrum invites a re-read of its verdict; a moot one asserts *the question itself is gone*, so
nobody re-checks the premise that killed it. **mootness is a claim about another fulcrum's answer,
and it must be re-verified whenever that answer moves.**

## .the fork, stated fairly — the operand is BACK

this round **deletes** one guard knob (`hashbar`). the timer lives on (`F01`), and its threshold has
never been configurable. so: does the mechanism that lives on earn the knob the deleted one had?

| | **keep it hard-coded** | **expose `patience:` on the guard** |
|---|---|---|
| a large artifact | 30s, same as a one-line one | the author can ask for more |
| a route author | no lever, no decision | a lever, and a decision on every guard they write |
| the precedent | — | 🔴 `hashbar` was a knob, and it became a bug report |

## .taken, and why at the time

**keep it hard-coded**, at 85%.

`case=7` names the reason in one line: **`hashbar: 0` was never a config — it was a bug report
written in yaml.** every author who set it was routed around a defect. the knob let the defect
persist, because it handed its victims a place to hide it, and the defect went unrepaired for
months.

⇒ **a threshold knob would be the same trap**: a driver held too long would ask the author to lower
it, the author would, and the signal that the threshold is wrong would never reach this repo.

⚠️ **the counter:** artifacts genuinely differ in size, and a `1.vision` yield of 400 lines is not a
one-line stone. a fixed 30s is arbitrary for both. but that argues for **a better default**, or a
threshold derived from the artifact, never for a per-route override.

### 🔴 .`S13` WEAKENS the counter, and that is why the guess holds at 85%

under the old design the threshold decided **how long a driver waits**, so a too-short value on a
400-line yield was a real injustice and a route author had a real grievance.

**under `S13` the threshold decides only WHO HEARS A PARAGRAPH.** nobody waits either way. so the
cost of a wrong value falls from *a held driver* to *a prompt shown, or not shown, to one driver
once*:

| a mis-set threshold | under B — the clock gates | 🔴 under `S13` — the clock targets |
|---|---|---|
| too **short** | the hasty driver is waved through | the hasty driver misses one prompt |
| too **long** | 🔴 **the thorough driver is held** for work they did | the thorough driver reads one paragraph they did not need |

⇒ **the knob's whole motive was the bottom-left cell, and that cell is gone.** a route author with a
large artifact no longer has a grievance worth a lever, so the case for `patience:` is materially
weaker than when this fork was written.

🟡 **and the residual argument for a knob inverts.** what a large artifact now wants is a **longer**
window, so the prompt reaches a driver who promised at 45s — which is an argument about the
**default**, not about per-route override. the counter's own last clause already said so.

## .the rework

**clean**, and asymmetric: to add a knob later is additive and safe; to **remove** one after routes
in the wild set it is the migration `case=7` demos. ⇒ the cautious direction is the one taken.

## .the verdict

_unruled, and LIVE again._ ⇒ out of scope for this wish either way — no utterance asks for a knob.
recorded because the round is the moment the question is visible, and a later author will otherwise
re-derive it.

⚠️ **the drive's guess is *keep it hard-coded* at 85%, and `S13` strengthened it** — the cost of a
wrong threshold fell from a held driver to an unheard paragraph, so the lever has less to buy.

🔴 **but the council owes `30` a look on its own account.** the number was never measured, `F01`
recorded that as a standing con of option B, and the round has now re-endorsed it twice by silence.
⇒ **the question worth a verdict is not *"expose it?"* — it is *"is 30 the right default for a
message trigger?"***, which is a different question from the one this fork asks and has never been
put.
