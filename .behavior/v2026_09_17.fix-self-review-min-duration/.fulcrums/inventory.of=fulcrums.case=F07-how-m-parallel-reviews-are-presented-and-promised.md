# fulcrum F07 — how M parallel reviews are presented, and promised

**rework** clean · **status** 🔴 **RULED — the drive's call was OVERRULED** · **confidence** 70% ·
**where** `findNextUnpromisedReview.ts`, `setStoneAsPassed.ts`, `formatRouteStoneEmit.ts`

> 🔴 **the drive guessed *"hand out all M"* at 70%. `S17` ruled *"hand out ONE"*.** the 30% was the
> live half, and `research.importance-of-focus` — the counter-argument the drive named and set
> aside — is the half that won. ⇒ read `.the verdict` at the foot.

## .the fork, stated fairly

`S06` asks that the driver be able to *"fork and repair in parallel."* the mechanism half is
settled — the hashless report makes concurrent lanes safe. **the surface half is not.** two
questions, and they are separable:

### 1. what the guard hands out

| | **one slug per run** (today) | **all M at once** |
|---|---|---|
| a fork | impossible — the driver cannot see review 2 until review 1 is promised | natural: M slugs, M paths, M lanes |
| the M clocks | serial — `M × 30s` | concurrent — `30s`, once |
| the prompt | one `patience, friend`, focused | M paths in one emit; longer, and `research.importance-of-focus` argues focus is the point |

### 2. what a promise may name

| | **one call per slug** (today) | **one call, several slugs** |
|---|---|---|
| a forked lane | each subagent promises its own — natural | a lane must speak for its siblings |
| `--into` | one path, one claim | M paths, and the claim shape gets murky |
| `rule.forbid.suppression-of-undeclared-concerns` | ✅ one declaration, one subject | 🔴 the shape that rule forbids elsewhere: a coarse declaration that discharges several fine ones |

## .taken, and why at the time

**hand out all M; keep one promise call per slug**, at 70%.

question 1 must change or `S06` is unbuildable. question 2 must **not** — a promise names one slug,
one path, one claim, and that is what makes a forked lane able to speak only for itself.

⚠️ **the reason confidence is 70%:** question 1 pulls against `research.importance-of-focus`, which
this repo boots at say-tier and which argues a driver who chases many paths reaches none. **the
counter-argument is that the fork is exactly how a driver holds focus at scale** — each lane has one
review — but that is an argument, and the brief was written against the serial ladder.

⇒ **a shape worth the council's glance:** hand out all M, and mark one as **next** — so a serial
driver reads a focused prompt and a forked driver reads a list. it costs one line of emit and
serves both.

## .the rework

**clean** on question 1 — the hand-out is one operation, and its inputs are unchanged.
🟡 **dirtier on the emit**: `formatRouteStoneEmit`'s `selfReview` block takes one review plus an
index; a list changes that shape and re-takes its snapshots. still contained to one formatter.

## 🔴 .the verdict — `S17`, and it is the opposite of the drive's call

| the question | the drive's call, 70% | 🔴 the verdict |
|---|---|---|
| **1. what the guard hands out** | all M at once | 🔴 **ONE.** the next is reachable only once this one is promised |
| **2. what a promise may name** | one slug per call | ✅ **upheld.** one slug, one path, one claim |

⇒ **the drive was right about the half it was confident in and wrong about the half it flagged.**
that is a fulcrum list at work: the 30% was written down, the council read it, and the council ruled
against the 70%.

### .why it went that way — the argument the drive could not see

the drive weighed *focus* against *throughput* and judged throughput the winner at 70%. the wisher
weighed a third question the drive had not checked: **can a forked lane actually get its GUIDE?**

| where the guide could come from | why a forked lane could not get it |
|---|---|
| the ask emit | renders for the **next-unpromised** slug only |
| a challenge verdict | renders for the slug in hand, and **only on a refusal** |
| the `.guard` file on disk | the route is **sealed** — a driver cannot read the rubric |
| a read-only retrieval command | 🔴 **there is none** |

⇒ the lane's one move was to promise blind to provoke `challenge:absent` and read the guide off the
refusal — forbidden by `rule.always.bear-every-self-review`, and it burns the attempt the haste cue
reads. **the hand-out question was never a focus-vs-throughput tradeoff. it was a capability the
surface could not deliver**, and the drive's table above does not contain that row.

🟡 **the "mark one as next" shape the drive offered the council is moot** — it served both a serial
and a forked driver, and there is no forked driver.

### 🔴 .the cost the verdict exposed, one call site away

question 1's *"hand out all M"* had a twin the drive never itemized: `setStoneAsPassed` **minted a
trigger for every unpromised review** at the first `--as passed`. correct under a fork. serially it
is a defect — `.since` **is** the ask, and the haste cue reads elapsed-since-the-ask, so a mint-all
stamps review 4's ask when review 1 was asked and `patience, friend` is dead for every review after
the first.

⇒ **so this fulcrum was wider than its own `.where` line said.** the emit and the mint were one
premise at two grains, and only the emit's `.why` said `fork` out loud.

## .the residual

naught open. `F08` (*the attempt counter under a fork*) 🌙 **moots with this** — its subject was a
race between lanes, and there are no lanes.
