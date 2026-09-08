# domain.term.choice.reason: review.focus

## .etymology

**focus** names *what the brain's attention rests on*. under `push` it rests on the content, which
is already in front of it; under `pull` it rests on a list of paths, and the brain chooses where to
look next. one word, one axis: **the shape of the target set as the brain receives it.**

the rejected candidates each failed on a different count:

| candidate | why not |
|---|---|
| `mode` | the emptiest word available. every enum is a "mode" — it names the axis for none of them |
| `strategy` | names a plan the brain executes, and the brain executes no plan here. the caller decides |
| `delivery` | half right — it names the `push` direction and misnames `pull`, where the caller delivers a path and the brain fetches the rest |
| `ingestion` | names the brain's act, so it reads backwards: the flag is the caller's decision, never the brain's |

⇒ `push` / `pull` for the positions is adopted, never coined — the standard pair for *"the source
sends"* vs *"the sink fetches"*, and the two are already symmetric (`rule.prefer.symmetric-term-pairs`).

## ⚠️ .the `push` overload — noted, and NOT resolved here

`push` already names a different concept in a booted dependency: `radio.task.push`
(`repo=bhuild/role=dispatcher`) — *transmit a task to a channel*. that is one word across two
unrelated concepts, which `rule.forbid.domain-term-ambiguity` names.

**it is not resolved in this cluster, for two reasons:**

1. the two live in **different boundaries** — `review.focus` and `radio.task` — and
   `rule.require.boundary-qualified-terms` is the repair for exactly that case: the flat namespace
   has one slot per word, a qualified one has as many as the domain does. neither use is flat
2. the `radio` side is a **dependency's** term. this repo re-seeds a convention to the tree that
   owns it; it does not adopt one

⇒ recorded here so the next reader finds the collision already named rather than re-derives it.
the glossary readme's census lists `push · transmit · dispatch` as a **synonym** gap on the radio
side; this is the **overload** on the same word, and it is the other half of that row.

## .evidence

### the measured case — 2026-09-07, this repo, stone 5.3

nine peer-review lanes had to be re-graded by hand. the guard's own configuration overflowed on the
wide ones, and the question was whether any lane could be run at all.

| the run | targets | context |
|---|---|---|
| `--focus push` (the default) | 172 | **100.2–101.3%** — overflow, the lane grades naught |
| `--focus pull` | 172 | **5.3–8.5%** — fits, the lane grades in full |

⇒ the flag is the difference between a lane that returns a verdict and a lane that returns none.
**that is why it earns a cluster** rather than reads as an implementation detail.

### 🔴 the misread that made the gap visible

the refusal at `stepReview.ts:254` was read as *"pull needs `ANTHROPIC_API_KEY`"*, filed under a
credential gate, and escalated to a human on that basis — into five `.taken` files and two
escalation documents.

**the message names one requirement — a brain CLASS — and says naught about a key.** the correction
came from a **different lever** (`rhx review --help`, which lists four repl brains), never from a
re-read; a re-read had already passed the same sentence twice.

⇒ the durable lesson is caught as
`.dream/v2026_09_07.enbrief.a-lever-check-must-read-the-tool-not-the-error.md` — a **capability**
refusal (a class, a mode, a flag, a shape) is a configuration you can clear; an **entitlement**
refusal (a key, a quota, an account, a grant) is a gate a human clears. the two look alike and only
one is a wall.

### why the term was absent until now

`focus` is a declared field on a CLI this repo publishes (`review.ts:111`), with a flag, a default,
and a pass-through — so `rule.require.domain-term-itemization` bound it the whole time, and no
census row named it.

⇒ the same shape as `review.scope`, whose own `.reason` states it: *a census records the gaps
someone looked for; it cannot record the ones nobody did.* both surfaced only when a claim about
them had to be checked rather than assumed.

## .disputes

none raised.
