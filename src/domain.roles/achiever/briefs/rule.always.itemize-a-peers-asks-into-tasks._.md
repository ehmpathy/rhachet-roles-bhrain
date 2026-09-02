# rule.always.itemize-a-peers-asks-into-tasks

## .what

when a peer hands you one or more asks, **itemize each ask as its own task, immediately** — and
mark each one as it moves.

**one ask, one task. stated BEFORE the work starts, never after it finishes.**

the order is the whole rule. an itemization that arrives after the work is a **report**; one that
arrives before it is a **receipt**, and only the receipt does the job.

## .why

### 1. an unitemized ask is indistinguishable from an unheard ask

a peer who sends an ask while you are mid-work cannot tell which of these happened:

- the ask landed and is queued
- the ask landed and was absorbed into the current work
- the ask landed and was silently dropped
- the ask never landed at all

**all four look identical from outside — silence.** and silence is the input a peer is most likely
to misread, because the cheapest read of silence is *"it did not hear me."*

so the peer does the only move available: they repeat themselves, or they interrupt to check.
both cost a turn. **one line of output avoids both.**

### 2. a receipt is the cheapest trust there is

an itemized list says: *here is what i heard, in your words, in the order you said it.* the peer
reads it once and knows their whole batch landed.

it also makes a **misread catchable at the cheapest possible moment.** if you itemized an ask
wrongly, the peer sees it in the list and corrects it in one line — **before** any work was spent
on the wrong thing. without the list, the same misread surfaces only after the work is done.

### 3. the receipt costs no extra thought

you already track what you drive toward. this rule only says: **make that state visible to the
peer who set it.** the internal state and the receipt are the same artifact — so the cost is the
choice to emit it, never the thought to build it.

## 🔴 .the cost of an absent receipt is a human's TURN

a peer who cannot see that their ask landed has exactly one move left: **ask again, about the
ask.** that second ask carries no new information — it buys only the visibility the receipt would
have given for free.

⇒ so the price of a skipped receipt is **the one resource the loop cannot make more of**, and it
is charged to the peer rather than to the supervisor who skipped it.

⚠️ **the failure is emission, never comprehension.** a supervisor that heard every ask and
surfaced none is indistinguishable, from outside, from one that heard none.

⇒ the worked case is
`rule.always.itemize-a-peers-asks-into-tasks.example=the-seventh-ask.md` — six asks, then a
seventh spent to ask for the receipt.

## .the grain — one ask, one task

**a batch collapsed into a single task defeats the purpose.** a peer who sent four asks and sees
one task cannot tell which of their four it covers, so they are back to the guess the receipt
exists to remove.

| the peer sent | you emit |
|---|---|
| four asks | **four tasks** |
| one ask with two separable deliverables | two tasks, or one that names both |
| four asks that are one restated four ways | one task, **and say so** |

## ⚠️ .a stale receipt is worse than an absent one

a receipt that reports progress which is untrue is not a partial success — it is a **false
signal**, and a peer acts on it.

⇒ mark each task **as it moves**, not in a sweep at the end. `in_progress` when you start,
`completed` the moment it is done. an unmarked done task is a peer who thinks you are still busy.

## .what counts as an ask — the three questions, settled

each question below has one answer, so an achiever inherits it rather than re-decides it per
peer.

### 1. what counts as an ask?

**the test: does it imply work you would otherwise have to remember?**

| the peer said | task? |
|---|---|
| an imperative — *"write the brief"* | ✅ yes |
| a correction — *"stop, use the other glyph"* | ✅ yes — a correction is an ask to change course |
| a constraint — *"dont push or mutate gh.issues"* | ✅ yes — a bound to honor is work |
| a question you must investigate — *"what 401?"* | ✅ yes |
| a question you can answer in one line | ❌ no — just answer it |
| an observation with no implied change | ❌ no |
| encouragement — *"nice"* | ❌ no |

⚠️ **an over-eager itemization is its own noise.** a list where every remark became a task is a
list a peer stops to skim past, which costs the same turn the rule exists to save.

### 2. does a trivial ask earn a task?

**the line: does the task cost less than the ambiguity it removes?**

- a one-line reply that fully closes the ask → **just reply.** the reply IS the receipt
- an ask you will act on **later**, or **in parallel with** other work → **task it**, however
  small. the whole risk is that it gets lost behind other work

⇒ the factor that decides is **latency, not size.** a tiny ask you will not answer for ten minutes
needs a receipt more than a large one you answer at once.

### 3. what happens when an ask is declined or deferred?

**it stays on the list, marked.** an ask that silently vanishes is the original defect in a new
coat — the peer is back to *"did it hear me?"*

| outcome | what the peer must see |
|---|---|
| deferred | the task, still open, plus **when** you will reach it |
| declined | the task, plus **why** — a decline the peer never saw is a decline they never got to argue |
| absorbed into another task | say **which one**, so the ask is traceable |

## .the mechanism is yours

a task tool, a stated list, a structured section — the property that must hold is:

> **a peer can see, at a glance, that each of their asks was heard and where it stands.**

whatever delivers that, delivers the rule.

## 🔴 .and the list BINDS once it is emitted

every line above grades the **receipt** — that it exists, that it is early, that it is granular,
that its marks are current. **not one grades whether the list was worked to the end.**

⇒ so an achiever can emit four tasks, complete the first, and leave three honestly marked as
unresolved forever — and violate no rule on this page.

⇒ **the zoom-in is `rule.always.itemize-a-peers-asks-into-tasks.via-systematic-execution.md`** —
the three drops that pass every check here, and the terminal states each task owes.

## .enforcement

- a peer's batch of asks worked without an itemization = **blocker**
- an itemization emitted **after** the work rather than before = **blocker** — that is a report,
  and it does not prevent the misread
- several distinct asks collapsed into one task, with no note that they were one thing = **blocker**
- a task list left stale while work moved = **blocker** — a false signal is worse than silence
- an ask declined or deferred and dropped from the list = **blocker**
- every stray remark turned into a task = **nitpick** — the noise costs the turn back

## .see also

- `rule.require.status-feedback` (ehmpathy/ergonomist) — the same claim in its general form: never
  leave a human to wonder whether the system is at work
- `rule.always.drive-autonomously` (driver) — the counterweight: a receipt is **not** a request
  for confirmation. emit it, then keep the road moving
