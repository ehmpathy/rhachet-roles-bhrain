# seed S14 — a warmer that spends unseen owes TWO records, on two axes

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> warmer should emit logs too so we can see its cost btw

and, when asked where:

> next to the review output logs

and, on a second axis entirely:

> it should also leave the processid in
> `.agent/.cache/repo=bhrain/role=reviewer/skill=review/warmers/reviewer=$xyz/process.pid,output.$attempt.log`

## .what it did

🔴 **it settled that the warmer's spend is RECORDED, and then — in a separate breath — that it is
recorded TWICE.** a first read of the two clauses reads as a contradiction, and it is not: they
are keyed on different axes, so neither can answer the other's question.

| the sink | keyed by | the question it answers |
|---|---|---|
| `$logDir/warmer.pokes.jsonl` | the **RUN** | *"what did this round cost?"* — so a cost surface reaches it where it already looks |
| `.agent/.cache/…/reviewer=$xyz/output.$attempt.log` | the **REVIEWER** | *"is a warmer alive for this lane, and what has it done?"* — a driver `cat`s it mid-flight |

⇒ so the warmer writes **both**, from one `setOnePokeRow`, which is what keeps the two in step.

## 🔴 .why "next to the review output logs" is the load-bearing half

the obvious home for a warmer's record is the warmer's own directory, and that home is **where a
cost surface would never look**. the run dir is where every other figure for that round already
lives.

⇒ the placement is not tidiness. it is the difference between a row a reader finds and a row that
merely exists.

🟡 and the bar that clause created is the one this branch left half-built: the row lands in the
run dir, and no cost surface reads it yet (`F27`).

## 🟡 .why `$attempt` is in the second filename

a guard re-drives a lane many times per route. a single `output.log` would be overwritten by the
next round, so the record of what the first warmer did would be erased by the warmer that
replaced it.

⇒ one file per attempt makes the log **append-only across rounds** with no append-mode race
between two processes that may briefly overlap.

## .the lesson

**an engine act with no record is the defect this wish opened on, one layer lower.** this whole
behavior exists because `rhx review` spent money that could not be attributed. a warmer that
spent money with no row would have reproduced that defect inside the instrument built to fix it.

## .landed in

- `src/domain.operations/review/warmer/runReviewWarmer.ts` — `setOnePokeRow`, both sinks
- `1.vision.experience.case=7.a-warmer-spends-while-nobody-watches.md`
- `0.wish.md` bars 9, 9b, 17
