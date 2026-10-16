# seed S15 — the pid is a LOCK, so spawn is a findsert

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> we should use that process.pid per reviewer to ensure no dupes. idempotent

## .what it did

🔴 **it re-read the pid file it had just asked for, and found a second job for it.** S14 named
`process.pid` as a **handle** — a way to find and stop a live warmer. this clause makes it a
**lock**, and the two are not the same artifact even though they are the same file.

| the role | what it buys |
|---|---|
| a **handle** | a driver can `kill $(cat process.pid)` |
| 🔴 a **lock** | a second spawn for the same reviewer is REFUSED rather than run |

⇒ the word `idempotent` is what makes it the second. spawn is now a findsert keyed on a live pid
(`rule.require.idempotent-operations`).

## 🔴 .why the duplicate is expensive, and why it reads as harmless

two warmers on one reviewer never conflict. they poke the same prefix with the same head, and
both succeed. so the defect has no error, no crash, and no wrong output — the only symptom is
the bill.

> **spend grows with the round count while coverage does not.**

a guard re-drives a lane many times per route, so an unlocked spawn multiplies by exactly the
number of rounds the stone took — which is the number nobody predicts up front.

⇒ **a defect that costs only money is the kind a test suite catches worst**, and the kind this
whole behavior exists to surface.

## 🟡 .the half the utterance does NOT settle, and the code had to

a pid FILE is not a live process. it outlives a warmer that was killed, crashed, or spent its
budget and exited cleanly — which is the **normal** end state, not an edge case.

⇒ so a lock keyed on the file's presence would latch shut on the first completed warmer and leave
that lane cold forever. the check probes **liveness**:

```
process.kill(pid, 0)
  ok     → ALIVE   → refuse the spawn
  EPERM  → ALIVE   → refuse the spawn   # 🔴 a permission error proves the pid EXISTS
  ESRCH  → dead    → take the lock
```

🟡 the `EPERM` row is the one a first draft gets wrong: an error reads as failure, and here it is
the strongest proof of success.

## .the lesson

**"idempotent" is one word and it names a whole mechanism.** the wisher spent four words; the
implementation owes a liveness probe, a stale-lock repair, and a clamp for each. a request that
compresses that far is worth a re-read for the half it left to the reader.

## .landed in

- `src/domain.operations/review/warmer/genReviewWarmer.ts` — the findsert
- `src/domain.operations/review/warmer/isReviewWarmerAlive.ts` — the liveness probe
- `0.wish.md` bars 14, 15
- `term=prompt.cache.warmer._.choice._.md` — the invariant
