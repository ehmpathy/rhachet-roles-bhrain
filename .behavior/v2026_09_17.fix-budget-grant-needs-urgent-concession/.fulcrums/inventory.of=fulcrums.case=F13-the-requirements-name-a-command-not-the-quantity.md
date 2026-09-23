# case=F13 · the requirements name a COMMAND, and the invariant is about a QUANTITY

- **rework** = clean — a scope sentence in the wish's terms, plus one predicate at a second call site
- **confidence** = **35%** ⬇ — the lowest on this board, and it fell at `r4`. the hazard is read
  straight from source and is certain; what is open is **whose behavior closes it**.
  🔴 **it fell because one of option C's two arguments was struck**: the fix's mechanism is a shipped
  idiom plus a deny entry, so the CLEAN half does not hold. **the req 7 argument stands alone now**,
  and it is the one a council must rule on
- **status** = best-guessed
- **found by** = `r2` self-review, slug `has-questioned-requirements`, via the guide's own question
  *"is the scope too large, too small, or misdirected?"*

## .the fork

`0.wish.md` enumerates eight requirements, and **every one of them is scoped to one command** —
`rhx route.guard.budget --for review --add N`. req 1 says *"a budget grant is refused by default"*;
the mechanism it names is that command.

🔴 **but the outcome the wish states is about a NUMBER, not a command.** *"the budget is the only
bound that makes a round COST"* — and that number is raisable by two further doors, neither of which
passes through `route.guard.budget` at all.

| option | reads as |
|---|---|
| **A — gate the command only** (as authored) | the wish's letter, discharged. the other doors stay open, and the gate is decorative |
| **B — gate the QUANTITY** — every write that raises a reviewer's unspent rounds | the wish's outcome, discharged. costs a second predicate and a scope sentence |
| 🔴 **C — gate the command here, catch the doors as a dream + fulcrum** ← **taken** | honest: the doors are a **distinct defect with a distinct owner**, and this route cannot close them without a scope grant |

## 🔴 .the two doors, read from source

both begin with one command whose help text says **"human only"** and whose implementation contains
**no actor check of any kind**:

```
route.ts:1838-1855   → validates the action string is allow|block|get
route.ts:1875-1889   → action === 'allow' → mkdir + writeFile(.privilege.mutate.flag) + print
```

⇒ **that is the whole of it.** no meter, no TTY probe, no quota, no `uses` file. *"human only"* is a
string inside a usage block a driver never has to read.

and `rhx` is prefix-approved on the driver's own permission list, so the call raises no prompt.

### the hook it lifts

`route.mutate.guard.sh:94-98` — the pretooluse hook wired on `Read|Write|Edit|Bash`:

```sh
PRIVILEGE_FLAG="$ROUTE_DIR/.route/.privilege.mutate.flag"
if [[ -f "$PRIVILEGE_FLAG" ]]; then
  # privilege granted, allow all operations on this route
  exit 0
fi
```

🔴 **it is a wholesale lift, never a scoped one.** one flag, and every `*.stone`, every `*.guard`,
and all of `.route/**` is writable by the party the hook exists to bound.

### door 1 — edit the cap

`processGuardFileBudgets({ guardPaths, addAmount, … })` at `route.ts:2312` writes `budget:` **into
the `.guard` file**. so the cap is a number in a file the lifted hook now permits.

### 🔴 door 2 — reset the spend, which is strictly stronger

`getAllRouteStoneGuardReviewPeerMeters.ts:16` reads the live spend from
`$route/.route/reviewPeerMeters.jsonl`, and its own `.note` at `:10` states the property that makes
this door worse than door 1:

> *"reviewPeerMeters.jsonl is append-only with **last-entry-wins** per (stone, slug)"*

⇒ **one appended line with `rounds: 0` restores the full budget, and it is repeatable without
bound.** a top-up adds N; this re-buys the whole meter, every time.

## .what each door defeats

| the wish's requirement | the doors |
|---|---|
| 1 · refused by default | 🔴 **bypassed.** the refusal is on a path neither door walks |
| 3 · recorded and machine-readable | 🔴 **bypassed.** no passage row is written, so the ledger records the grant not at all |
| 5 · the refusal names the sanctioned move | never reached — no refusal is rendered |

⚠️ and it needs **no false claim on the record**, which is what parts it from `F07`. `F07` asks
whether a driver may mint its own warrant; this needs no warrant. ⇒ **`case=10` bypasses the warrant
CHECK; this bypasses the GATE.**

## .why C, and not B

three reasons, and the third is the one that decides it:

- **the defect predates this wish.** the privilege command shipped with its own stated bound
  unenforced; this route did not create that, and a fix belongs with the party that owns the command
- **B's radius is unknowable from here.** *"every write that raises unspent rounds"* includes a hook
  rewrite, a privilege scope, and a meter-append guard — three surfaces, none of which `0.wish.md`
  names. that is the **dirty** half `rule.always.fix-forward-under-scouts-honor` sends to a dream

  🔴 **struck in part at `r4` self-review.** the radius of the **broad** form stands; the radius of
  the **actor check itself** was overstated, and that check is the piece this row actually defers:

  | the mechanism | already used by | cost on `route.mutate grant allow` |
  |---|---|---|
  | a **TTY probe** | `git.commit.uses` ×3, `radio.uses` — `require_human()` | ~3 lines. 🟡 a TS CLI, so `process.stdin.isTTY` rather than the bash helper |
  | a **permission-list denial** | the same meters, per `case=4:47` | a deny entry — **no source change** |

  ⇒ **the gate is a shipped idiom plus a config line, never novel work.** the doc and brief updates
  are real, and they are not what *"dirty"* was meant to describe.
- 🔴 **a human may legitimately want door 1.** `route.mutate grant allow` is *supposed* to be the
  human's lever, and req 7 asks for exactly a human path. ⇒ **to seal it would delete the extant
  answer to req 7 while this design builds a second one** — see `F02`, which this row re-frames

## 🔴 .and it re-frames `F02` — the meter may be UNNECESSARY

`F02` asks whether `#458`'s `route.budget.uses` meter is implemented here as the human lift.

> **a human lever for this already ships. it is `rhx route.mutate grant allow`, and it is documented
> as human-only.**

⇒ the simpler answer to req 7 is not a new meter — it is **an actor check on the extant command**.
one predicate, on a surface that already claims the bound in its own help text, versus a new skill
with three-level precedence.

⚠️ this is not a recommendation to drop `F02`; a meter is finer-grained and scoped to budget alone,
where the privilege flag is wholesale. it is a genuine second option `F02` never weighed, and the
council should see both.

## .the residual

**taken as C, so two artifacts are owed and one of them is not written by this route:**

- a **dream**, for the actor check on `route.mutate grant allow` — the fix that seals both doors at
  their common root
- this **row**, which records that the deferral was a judgment rather than an oversight
  (`rule.always.catch-dreams-for-followups`: *"a dream alone reports the work and hides the call"*)

🔴 **and the honest statement the yield must carry:** under option C, this design bounds the
**sanctioned** path and does not bound the **quantity**. a reader who takes *"the budget becomes a
bound"* literally will over-read it.

## .the verdict

🔴 **RULED — the actor check lands HERE. option C is REVERSED.**

the council closed the door in this behavior. ⇒ **option B's narrow form** — an actor check on
`route.mutate grant allow` — rather than option C's deferral, and rather than option B's broad
*"every write that raises unspent rounds"*.

### what the verdict changes

| | under C (authored) | 🔴 under the verdict |
|---|---|---|
| req 1 | **narrowed** — the sanctioned path alone | ✅ **discharged** — every door onto the quantity is gated |
| req 3 | bypassed by both doors | ✅ a grant that walks either door is refused at the flag |
| the dream | 🔴 the deliverable | **consumed** — it is now a row on the change surface, and the file is retired to a pointer |
| the yield's § *what is awkward* §0 | the design's largest hole, stated | 🔴 **withdrawn** |

### 🔴 and it settles req 7, which was COUPLED to this row

this row's third and decisive argument was that a human legitimately wants door 1, so to seal it
would delete req 7's extant answer.

⇒ **the seal does not delete it; it QUALIFIES it.** an actor check turns
`route.mutate grant allow` from a lever anyone may pull into a lever only a human may — which is
what its own help text has claimed since it shipped. **req 7's answer is not removed. it is made
true.**

🔴 **so the `F02` meter is now genuinely optional, and the council should know it.** this row's
re-frame of `F02` offered *"an actor check on the extant command"* as the simpler answer to req 7;
the verdict takes the actor check. ⇒ **`F02`'s meter is no longer needed FOR req 7.** if it is built,
it is built for its own merits — finer grain, scoped to budget alone — never because req 7 has no
other answer.

### what it adds to the change surface

| site | the change |
|---|---|
| `route.ts:1875-1889` | an actor check on the `allow` branch — `process.stdin.isTTY`, the TS form of the shipped `require_human()` idiom |
| the driver's permission list | a deny entry on `route.mutate grant`, per `case=4:47` — **no source change** |
| `route.ts:1845` | the help text stops to be a claim and becomes a statement of what the code does |
| `rule.always.spend-own-levers-before-escalation` | its owner table lists `budget` under **owner: driver**. ⇒ 🔴 **the brief teaches the bypass**, and it moves with the code |
| `route.mutate.guard.sh:94-98` | 🟡 **unchanged, deliberately.** the wholesale lift is correct once only a human can mint the flag — the defect was never the lift's breadth, it was that the flag was free |

⚠️ **the last row is the one a reviewer should check hardest.** it claims the hook needs no scope
narrow, on the ground that a human-minted flag is a human's deliberate act. a reviewer may fairly
rule that a budget-shaped grant should not lift a `.stone` write too.

## .the amendment

**confidence: 35% → RULED.** 🔴 **the lowest-confidence row on the board was ruled against its own
taken option**, and the row predicted exactly that: it recorded that option C stood on **one**
argument after `r4` struck the other, and named that argument as the one a council must rule on. the
council ruled it, and it did not hold.

🟡 **the class: a row that falls to one argument is a row about to be reversed.** `r4` struck C's
CLEAN half and left its confidence at 35% rather than re-take the fork, because a fulcrum records a
call rather than re-makes it. ⇒ **that is correct conduct and it is also the tell** — the grade
carried the signal, and a council that read for it would have reached this row first, which is where
the read-first table had already put it.

## .see also

`inventory.of=fulcrums.case=F02-…` — the meter this row re-frames, and which the verdict makes
optional · `…case=F07-…` — the warrant a
driver mints, where this needs none · `1.vision.experience.case=11.the-door-beside-the-gate.md` — the
demo · `route.ts:1875-1889` — the unenforced bound · `route.mutate.guard.sh:94-98` — the wholesale
lift · `getAllRouteStoneGuardReviewPeerMeters.ts:10,16` — last-entry-wins
