# F02 · `#458`'s meter is implemented as the second lift, never closed

- **rework** = clean · **confidence** = 85% · **status** = 🔴 **RULED — REVERSED.** the meter does not
  ship here; `#458` stays open. see `.the verdict`

## .the fork

`ehmpathy/rhachet-roles-bhrain#458` is OPEN and proposes `rhx route.budget.uses allow|block` on the
three-level `git.commit.uses` pattern, **unset ⇒ blocked**. the predecessor's `F011` left it open
deliberately and predicted this moment:

> so this behavior may be the **prerequisite** for `#458` rather than its replacement. that is a claim
> for the wisher to rule on, and a reason to keep the issue open.

| option | what this behavior does to `#458` |
|---|---|
| A | close it — this wish's urgent predicate supersedes the meter |
| B | leave it open and untouched — two designs, one subject, neither built |
| 🔴 C | **implement it here**, as the second of two lifts |

## .taken, and why

**option C.**

`case=4` forced it. axis A of the walk — *who attempts the grant* — **is not observable at the call
site**: one command, one syntax, two actors. the three reaches all fail, and a `--as human` flag is
forbidden outright by `rule.forbid.self-grant-human-gates`.

⇒ **so req 7 ("a human may still grant") is unimplementable as an actor check.** the human's
permission must be **reified on disk**, written by a party the bot cannot impersonate — which is
precisely what `#458` designed, and precisely the pattern `git.commit.uses` already defends via the
permission list rather than via cleverness in the skill.

the result is a disjunction:

```
permitted  ⟺  a live urgent concession stands        (the bot's earned path)
           ∨  the human's `uses` quota has a grant left   (the human's granted path)
```

🔴 **that reconciles three dated wisher positions that have never been reconciled** — see `case=4`'s
table. `#458`'s default-block is right; its *"human-only"* was too narrow, because the second lift is
not a human but a recorded harm claim.

## .rework, and why

**clean.** the meter is additive — a new skill on a paved three-level pattern, plus one clause in the
gate's disjunction. to reverse is to drop the clause and close the issue.

⚠️ **it does widen the behavior's scope**, from one predicate to one predicate plus a meter. that is a
scope judgment the council may reverse; it is not a ripple.

## 🔴 .the cost the meter INHERITS, unpriced until `r4`

the paved pattern's human gate is **two mechanisms in series**, and `case=4` named only one:

| gate | where | strength |
|---|---|---|
| a permission-list deny on the bot's copy | the harness | the one `case=4` cited |
| 🔴 a **TTY probe** — `require_human()`, `[[ ! -t 0 ]]` | inside the skill | 🔴 the reach `case=4` calls *brittle* |

⇒ **so the reification does not escape the brittle detector; it relocates it one hop back.** the
quota the gate reads is a strong fact; **what writes that quota is a weak probe.**

✅ **the meter call still stands, and on a better argument than the one recorded:** two gates in
series beat one. a bot must defeat the harness deny **and** the probe. that is defense in depth, and
it is the argument `F02` should be ruled on.

⚠️ **and the hatch the meter inherits:** every probe reads
`if [[ ! -t 0 && "${__I_AM_HUMAN:-}" != "true" ]]` — *"allows integration tests to run mutations"*.
`__I_AM_HUMAN=true` is **a bot that passes its own human flag**, which `case=4` row 1 forbids
outright and `0.wish.md` § *what is NOT wanted* names as *"laundered the grant, not gated it."*

🟡 **whether a driver can reach it turns on the harness matcher**, which keys on a command prefix —
so it is an **open cost, never a proven hole.** ⇒ a council that reads *"the meter is the human path"*
should know the path has a documented side door, and that the door's bound lives in a **different
mechanism, in a different tree** — this route's own recorded leak shape.

## .confidence, and why it is 85%

`case=4`'s argument is mechanical rather than aesthetic: the actor cannot be detected **reliably**, so
it must be reified, and the reification already has a paved shape. **the 15%:** the wisher may prefer
the human simply run `--add N` and accept that a bot *could* forge it — a trust model, not a gate —
which would halve the work and leave req 7 honored in spirit.

🟡 **the grade is UNCHANGED at `r4`, and the reason is worth a line:** the `__I_AM_HUMAN` hatch is a
real cost and it argues against **no available alternative** — `F13`'s rival option inherits the same
idiom, and the trust-model option has no gate at all. ⇒ a cost that every option shares moves no
grade; it belongs in the record, never in the arithmetic.

⇒ **what would settle it:** the wisher rules on whether req 7 needs a mechanism or a convention.

## .where

`1.vision.yield.md` § *how it relates to `#458`* · `1.vision.experience.case=4.the-ungated-human.md`

## .the verdict

🟡 **NOT ruled — and its GROUND moved, so the open question is a different one.**

`F13` was ruled: **the actor check lands on `route.mutate grant allow` in this behavior.** that
command is documented human-only, and now enforces it.

🔴 **so req 7 has a mechanism, and it is not this meter.**

| this row's premise | after `F13`'s verdict |
|---|---|
| *"req 7 needs a human path, and the meter is it"* | 🔴 **false.** req 7 has a shipped path, now enforced |
| the fork was *implement the meter, or leave req 7 unanswered* | 🔴 **the fork is now: is a SECOND human path worth its cost?** |
| the 15% was *"the wisher may accept a trust model"* | that option is gone — a gate ships either way |

### what the row now asks

> **does budget deserve a lever of its own, finer than the wholesale privilege flag?**

| for the meter | against |
|---|---|
| the privilege flag lifts **every** write on the route — `.stone`, `.guard`, `.route/**`. a budget grant should not also unlock a stone | one gate is shipped and enforced; a second is a new skill, a new file, a new precedence rule |
| a meter records **who granted, how many** — the flag records only that a grant was permitted | the meter inherits the `__I_AM_HUMAN` hatch priced above, and adds a surface to keep in step |
| `#458` asked for exactly this, by name | `#458`'s stated goal — *"only human"* — is met by the actor check alone |

⇒ **the row's defense-in-depth argument survives and is now its PRIMARY one.** it was the better
argument before; it is the only one left.

## .the amendment

**confidence: 85%, unchanged — and the number now measures a different claim.** it graded *"the
meter is how req 7 gets answered."* req 7 is answered. ⇒ the grade should be **re-derived against the
new question** rather than carried forward, and this row does not carry it forward: **it is re-opened
at a confidence this route declines to set**, because the call is a scope judgment the council makes
with the `F13` verdict already in hand.

🔴 **the class: a verdict on one row can invalidate a neighbour's PREMISE and leave its claim
intact.** `F13` ruled a door shut; `F02`'s call — *implement the meter* — is unchanged in its words
and hollow in its reason. ⇒ **a council that rules rows in sequence must re-read the rows it already
passed**, and this board has no mechanism that flags a row whose ground has shifted beneath it.

## .the verdict

🔴 **RULED 2026-09-18 — the meter does NOT ship. the taken option is REVERSED.**

> **one human gate, on the lever that already claims to be human-only.** `route.budget.uses` is not
> built here, and `#458` stays **open** as a refinement rather than a prerequisite.

⇒ the third reversal of the council, and the only one whose **premise** was overturned before its
**call** was. this row was re-opened by `F13`'s verdict and then ruled against on the re-opened
question — *does budget deserve a lever finer than the wholesale privilege flag?* **not yet.**

### 🟡 the for-column survives the verdict, and it is why `#458` stays open

the two arguments left after `F13` hollowed the first are both **true** and neither is **urgent**:

| the argument | where it lands |
|---|---|
| the privilege flag lifts every write on the route — a budget grant also unlocks a `.stone` | ✅ **true, and deferred.** the flag's breadth is a real coarseness, and it is one only a human can now invoke |
| a meter records **who** granted and **how many**; the flag records only that a grant was permitted | ✅ **true, and deferred.** the `passage.jsonl` row records the grant either way; what the meter adds is the grantor's identity |

⇒ **the deferral rests on one fact: after `F13`, a human is on the other side of that flag.** a
coarse lever a human must pull deliberately is a materially different object from a coarse lever any
clone may pull — so the case for a finer one is weaker than when this row was authored.

### .what moves

| artifact | change |
|---|---|
| this behavior's surface | 🔴 **shrinks.** no new skill, no three-level precedence, no `.meter/` file, no `__I_AM_HUMAN` hatch inherited |
| `#458` | a comment: req 7 is met by an actor check on `rhx route.mutate grant allow`; the meter remains a live refinement for **scope granularity**, never for the gate itself |
| 🟡 `1.vision.yield.md` | every row that names the meter as the human lift moves to the actor check. **`F05`'s fork shrinks too** — *"the gate inside `routeGuardBudget`, with the meter beside it"* loses its second clause |

🟡 **and the deferral is this design's own argument applied to itself.**
`rule.always.fix-forward-under-scouts-honor` grades a fix by SAFE and CLEAN; a new skill on a paved
pattern is safe and **not** clean — it ripples into a precedence rule, a storage path, and a help
surface this wish never opened. ⇒ the row was right that the meter is good work, and wrong that this
behavior is where it belongs.
