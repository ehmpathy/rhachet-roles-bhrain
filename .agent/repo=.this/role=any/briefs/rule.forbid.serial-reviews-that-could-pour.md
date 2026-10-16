# rule.forbid.serial-reviews-that-could-pour

> **reviews that do not depend on each other run concurrently. always. a serial loop over
> independent reviews is a defect, however well its header argues for it.**

independent = no review reads another's output. partitions of one lane, lanes of one level,
reruns of one rubric over disjoint scopes — all independent, all pour.

## .why

- wall time is the driver's scarcest resource. nine partitions in series cost nine waits; in a
  pour they cost one
- a serial loop multiplies the exposure to every transient fault: the longer the run, the more
  sockets drop inside it
- the reasons offered for a serial loop are almost always a shared mutable global the author
  did not want to fix — a stdout swap, a module flag, a lock. **that global is the defect.**
  make it concurrency-safe (a refcount, a scoped buffer, an injected writer), then pour

## .the test

> **does review B read any output of review A?**

- no → they pour. `Promise.allSettled`, or the guard's bounded pour
- yes → that edge is the only serial step. all else still pours

| when… | then… |
|---|---|
| you write `for … of` with an `await` over reviews | 🔴 stop. are they independent? then map + settle |
| a header says "one after another, by design" | 🔴 name the shared state that forces it, and fix that state |
| a process global must be swapped per run | make the swap reentrant (refcount the install, restore on the last exit) |
| rate limits worry you | bound the pour (a concurrency cap) — never collapse it to one |
| a sum of times is reported as the lane's time | in a pour the lane's time is the max, not the sum |

blocker: a serial loop over independent reviews · a shared global left non-reentrant as the
reason for a serial loop · a pour cap of 1.

⇒ see also: `rule.forbid.dropped-partial-review-progress` (the peer: a pour must settle, never
fail fast) · `term=route.guard.concurrency._.choice._.md` (the guard's bounded pour).

worked example: `stepReviewByPartitions` ran partitions in series behind a non-reentrant
`withStdoutToStderr`, so a nine-partition lane took nine round-trips of wall time.
