# rule.always.itemize-a-peers-asks-into-tasks.via-systematic-execution

## .what

a **zoom-in** of `rule.always.itemize-a-peers-asks-into-tasks._.md` onto the beat that follows the
receipt:

> **the list is a commitment, not a record. work EVERY task on it to a terminal state — one at a
> time, in order — before you take new ground.**

the parent rule says *emit the list*. this one says *the list is then binding*, and names the
three ways an achiever can satisfy the parent and still drop the work.

## 🔴 .why — a perfect receipt passes every extant check while asks 2..N die

this is the whole argument, and it is mechanical.

the parent's enforcement lines grade **emission** and **marking**:

| the parent forbids | what it grades |
|---|---|
| a batch worked with no itemization | the receipt exists |
| an itemization emitted after the work | the receipt is early |
| several asks collapsed into one task | the receipt is granular |
| a list left stale while work moved | the marks are current |
| an ask dropped from the list | the receipt is complete |

⇒ **an achiever that emits four tasks, completes the first, and never returns violates none of
them.** tasks 2–4 sit `pending`, honestly marked, forever. the receipt is accurate; the work is
abandoned; every check is green.

⚠️ **and the peer is worse off than with no list at all.** an accurate `pending` reads as *queued
and coming*, so the peer waits instead of asks. the receipt converted a silence they would have
challenged into a promise they trust.

## .the three drops — each satisfies the parent

| the drop | what it looks like | why the parent misses it |
|---|---|---|
| **the abandoned tail** | ask 1 done, asks 2–4 `pending`, attention moved on | the marks are true |
| **the absorbed remainder** | *"the rest are covered by the work I did"* — asserted, never checked | the parent permits absorption, and asks only that you say **which** task |
| **the new-ground jump** | a fresh ask arrives, gets itemized, gets worked — over an open list | the new receipt is impeccable |

⇒ the third is the most common, because a new ask is **louder** than an open task. the interrupt
carries urgency; the `pending` row carries none.

## .the rule — one at a time, to terminal

> **work the list in order. one task `in_progress` at a time. each reaches a terminal state before
> the next begins.**

three terminal states, and only these:

| terminal | means | owed to the peer |
|---|---|---|
| **completed** | the ask is satisfied | the marker, at the moment it lands |
| **declined** | you will not do it | the **reason**, so the peer can argue it |
| **deferred** | you will do it later | the **when**, and it stays open |

⚠️ **`pending` is not terminal, and neither is "probably covered."** an absorbed ask is
`completed` **only** after you have checked that the absorbing work actually satisfies it — and
the check is a read, never an assumption.

### one `in_progress` at a time

parallel tasks look like throughput and produce the abandoned tail: attention splits, one branch
finishes, the others stall at 80% with a truthful `in_progress` mark that never moves.

⇒ **serialize.** the peer gets the same total work and can see, at every moment, exactly where it
is.

## .the cues — when → then

| when… | then… |
|---|---|
| a **new ask arrives** while your list has open tasks | 🔴 the sharpest cue. itemize it, and **finish the open one first** — unless the peer says otherwise |
| you finish a task and feel the round is done | 🔴 **read the list before you believe that.** the feeling of doneness tracks the last thing you did, never the list |
| you are about to write *"the rest are covered"* | that is the absorbed remainder. **check** it, then mark each — or say plainly which is uncovered |
| a task is blocked by something outside your reach | that is **deferred**, and it owes a *when*. it never owes silence |
| you catch two tasks `in_progress` at once | serialize them. one is about to become the tail |
| the round ends with open tasks | 🔴 **say so, itemized**, in the same breath as what you delivered |

## .the test — read the list, not your memory

before you report a round done, answer against **the list**, not against what you recall:

> **"is every task terminal — completed, declined, or deferred-with-a-when?"**

- yes → the round is done
- no → **it is not done, and the report must say which are open.** a round reported done over open
  tasks is the stale receipt the parent forbids, one level up

## .the bound — this is not a refusal to reprioritize

the peer owns the order. an ask that says *"drop that, do this"* **re-orders the list**; it does
not violate this rule.

| the peer said | you do |
|---|---|
| *"do this instead"* | the displaced task becomes **deferred** or **declined** — marked, never dropped |
| *"do this first"* | re-order; the open task stays open |
| said naught, and a new ask arrived | finish the open one first, or say why not |

⇒ **the rule forbids a silent drop, never a directed one.** what must never happen is a task that
leaves the list without the peer ever seeing it leave.

## .enforcement

- a round reported done with a non-terminal task on the list = **blocker** — the report is false
- a new ask worked over an open task, with no note of the order change = **blocker**
- an ask marked `completed` by absorption, with no check that the absorbing work satisfies it =
  **blocker**
- a task `deferred` with no *when* = **blocker** — that is a drop wearing a marker
- two or more tasks `in_progress` at once = **nitpick** — it is the abandoned tail as it forms
- a peer who re-orders or cancels the list = **false positive** — the order is theirs

## .see also

- `rule.always.itemize-a-peers-asks-into-tasks._.md` — the parent: emit the receipt, before the
  work
- `rule.always.itemize-a-peers-asks-into-tasks.example=the-seventh-ask.md` — the occurrence behind
  the parent's claim
- `rule.always.converge-to-terminal` (driver) — the same discipline on a review ladder: work every
  reviewer to terminal before a human is pulled
- `rule.always.drive-autonomously` (driver) — why an open task is worked rather than confirmed
- `rule.require.status-feedback` (ehmpathy/ergonomist) — the general claim: a mutation reports
  what changed
