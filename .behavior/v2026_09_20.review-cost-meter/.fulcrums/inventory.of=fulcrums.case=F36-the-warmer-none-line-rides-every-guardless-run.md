# F36 — the `warmer: none` line rides every guard-less run, and that placement is a RULING

- rework: **clean** — one `if` moved, one snapshot family resnapped
- status: 🟡 **BEST-GUESSED 2026-09-25 — option A: keep it on stdout, outside the lane gate**
- confidence: 🟡 **85%**

## .the fork, stated fairly

every completed `rhx review` that a guard did not drive emits
`🦉 warmer: none — this run carries no lane identity…` on **stdout**. a peer lane read that as
unrequested output on the common no-lane invocation, and offered stderr or suppression.

the fork is **where the emit sits relative to the lane gate**:

| | option A — emit outside the gate, on stdout | option B — inside the gate (suppress) | option C — outside, on stderr |
|---|---|---|---|
| a driver at the default `--warmer on`, run by hand | ✅ learns no warmer guards their prefix | 🔴 a promise from `--help` and **silence** from the run | ✅ learns it |
| `rule.require.status-feedback` | held — the subsystem they enabled reports | 🔴 broken in the one direction that costs money | held |
| `rule.forbid.stdout-on-exit-errors` | held — stderr is scoped to error paths that exit non-zero; this run exits **0** | n/a | 🔴 **broken** — a successful review's status put on the error stream |
| the scroll on a hand review | one extra line | clean | one extra line, on the stream a pipe does not carry |

⇒ **A was taken**, and it was taken *before* the round — the argument is in the code at
`src/contract/cli/review.ts:508-513`, with its dogfood citation.

## .why A, at the time

🔴 **`--warmer` defaults to `on`, so a driver who runs a review by hand ASKED for a warmer.** to
spawn no process *and* say no word leaves them with a promise from `--help` and silence from the
run — and they would believe a warmer guards a prefix that no warmer touches. that is
`rule.require.status-feedback` broken in the one direction that costs money.

🟡 **and the words are honest in a way a shorter line could not be.** it says *"this run carries no
lane identity"* — what was **unrecoverable** — rather than *"no guard drove this review"*, which is
FALSE for a guard-driven `review.by` call and would be an `unknown` asserted as a FACT
(`rule.forbid.failhide`, `0.wish` bar 4). ⇒ that exact defect was live in the line's earlier text
and is recorded at `F33`; the repair is why the sentence reads as it does.

⇒ measured **2026-09-24** in a live dogfood rather than reasoned out:
`appendix/i014.the-warmer-dogfooded-against-a-live-provider.md`.

## .why the rework is clean

one `if` moves, and one snapshot family resnaps. no caller changes, no type changes, no peer file.
⇒ **this row exists because the CALL was a judgment, not because the diff is hard** — the peer seat
and the driver seat read the same three rules to opposite conclusions, and that is what a fulcrum
list is for.

## .where

- `src/contract/cli/review.ts:496-513` — the emit, outside the lane gate, and the two `.note`s
- `src/domain.operations/review/warmer/emitReviewWarmerDisowned.ts` — the peer surface
- `appendix/i014.the-warmer-dogfooded-against-a-live-provider.md` — the measurement

## .confidence, and why it is not higher

**85%.** the three rule readings are firm and the dogfood is dated. what is soft: the lane's root
complaint — *"the common no-lane invocation now carries a line nobody asked for"* — is a real
ergonomic cost, and A pays it on **every** hand review to serve the driver who would otherwise be
misled. whether that trade is the right default is a taste call a wisher may reverse, and the rework
is clean, so reversal is cheap.

🟡 the alternative nobody costed: a **once-per-session** emit rather than once-per-run. it would
serve the same driver at a fraction of the scroll, and neither the code's `.note` nor the fork above
weighs it.

## .the verdict, once ruled

OPEN — the placement stands; the default is offered for reversal at a clean cost.
