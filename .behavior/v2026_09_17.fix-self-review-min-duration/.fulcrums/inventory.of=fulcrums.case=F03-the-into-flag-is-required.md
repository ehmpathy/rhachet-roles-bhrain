# fulcrum F03 — is `--into` required, or optional

**rework** clean · **status** ✅ **RESOLVED — REQUIRED**, and for the **diff** (`S15`) ·
**confidence** 97%
**where** `src/contract/cli/route.ts:323` (beside `--that`), `stepRouteStoneSet.ts:260`

## ✅ .what was ruled

> *"yeah require `--into`; forces them to say where it is, so we can show them the diff too"* (`S15`)

**required** — and the clause after the semicolon is the part that matters, because it is a reason
this fulcrum never tabled.

| the guard holds | the best it can report |
|---|---|
| the computed path alone | a **boolean** — *"the articulation is absent"*. true, and it names no cause |
| 🔴 the computed path **and** the declared one | a **diff** — which segment diverged, and the move that closes it |

🟡 **the transferable rule** (`S15`): *a check with **one** operand can report a failure; it takes
**two** to report a difference.* the party under a check holds half the evidence, and a check that
never asks for it is condemned to say *"no"* with no *"because"* attached.

## 🔴 .the drive guessed RIGHT, argued it WRONG, and then talked itself out of it

this is the round's only fulcrum where the verdict was on the page from the start and the **reason**
was not — and the consequence was concrete rather than cosmetic:

| | the drive's case | the wisher's case |
|---|---|---|
| what the flag is for | **detection** — an inferred path always matches itself | **diagnosis** — a declared path is the second operand a diff needs |
| what `S12` did to it | 🔴 **gutted it.** the path now keys on `(stone, slug)`, both of which the driver holds, so there is no un-computable component left to hold a wrong belief about | ✅ **untouched.** an easier path makes a mismatch **rarer**; it does not make the rare one easier to explain |

⇒ so when `S12` landed, the drive **revised its own guess to *optional*** and said so to the wisher.
the guess was right; the argument under it had collapsed, and the drive read the collapse of the
argument as the collapse of the claim.

🔴 **the check that would have caught it, stated mechanically:** *did this new fact kill the CLAIM, or
merely the REASON I gave for it?* — `S12` killed a reason. the claim had a better one available and
the drive had not found it.

## .the fork, stated fairly

`S01` clause 5 says **"maybe"**: *"maybe we require a --$flag input to specify the filepath and
complain if that filepath was wrong."* it is a proposal, and the drive must not read a "maybe" as a
settlement.

| | **required** | **optional** | **absent** |
|---|---|---|---|
| `case=3` (misplaced, and the driver says so) | ✅ caught, with a move command | caught only when the driver volunteers the flag | 🔴 reported as `absent` — the extant defect |
| cost per promise | one copied line, every time | naught | naught |
| `S04`'s *"eliminate friction"* | 🔴 **adds** friction | neutral | neutral |

## .taken, and why at the time

**required**, at 65%.

the case for it: an inferred path always matches itself, so an **optional** flag detects a mismatch
only from the driver who was careful enough to pass it — and the driver who needs the check is by
construction the one who did not. the flag's whole value is that it makes a **belief** visible, and
a belief nobody states cannot be corrected.

⚠️ **the reason confidence is 65% — the lowest of the round:**

1. it is the only clause in this wish that **adds** friction, inside a wish whose subject is
   friction removal (`S04`). that is a real tension, not a rhetorical one
2. `rule.prefer.defaults-match-common-case` grades a required flag whose value the surface could
   infer as *"friction with no payoff"* — and the guard **does** compute this path already
3. the alternative recovers most of the value for free: `case=4`'s upgraded message (name the path,
   say no file was found) is owed **regardless** of this fulcrum, and it repairs the confusion in
   the common case. the flag buys exactly one further case — `case=3`
4. it is a **contract change** on a command every route in this repo and downstream calls

⇒ **this is the fulcrum most likely to be overruled, and the drive says so plainly.**

## .the rework

**clean.** required → optional is a relaxed validation plus a fallback to the computed path; every
verdict below it is unchanged. `case=5` is the only demo that moves, and it is written with both
readings in its sketch (`[t0]` and `[t0']`).

🟡 the reverse — optional → required later — is **dirtier**, since callers in the wild would break.
⇒ if the council is undecided, **optional is the cheaper place to start**, and that argument cuts
against the drive's own guess.

🔴 **and the verdict took the dirtier direction deliberately.** the asymmetry argument above is real
and was overruled on its merits: *optional* buys a cheap reversal and **forfeits the diff in exactly
the cases the diff exists for**, since the driver who omits the flag is the driver whose path is
wrong. ⇒ a cheap escape from a gate that cannot explain itself is not a bargain.

## .the verdict

✅ **ruled: required** (`S15`). `--into` is a mandatory input on `--as promised`.

⇒ the question was: **is a declared path worth one copied line per promise?** the answer is **yes**,
and the reason is that the declaration is the **only** artifact from which the guard can render a
difference rather than a refusal.

### ⚠️ .what it still costs — carried, not waived

1. it remains the one clause in this wish that **adds** friction, inside a wish whose subject is
   friction removal (`S04`). the residual is one line per promise, and it is now a **stated** price
   rather than an unnoticed one
2. `rule.prefer.defaults-match-common-case` still grades a required flag whose value the surface can
   infer as *"friction with no payoff"*. ⇒ **the payoff is named**: the surface can infer the path it
   wants, and cannot infer the path the driver used. the rule's premise — that the two are the same
   quantity — does not hold here
3. it is a **contract change** on a command every route in this repo calls, so `case=5`'s usage-error
   path is now on the critical path for every promise rather than an edge

🟡 **`case=5` is promoted by this verdict.** a required flag means a malformed or absent `--into` is
the **first** step a driver can get wrong, and `S13` made the attempt count the gate itself — so a
usage error that burns an attempt no longer costs a round trip, it **clears a review unread**.
