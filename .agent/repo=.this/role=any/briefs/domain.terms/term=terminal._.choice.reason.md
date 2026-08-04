# domain.term.choice.reason: terminal

## .etymology

`terminal` comes from latin *terminus* — a boundary, an end, the post that marks where a path
stops. a **terminal** verdict is one that has reached its end-state: the driver, on their own,
cannot move it any further. the word names the *end property*, not a value judgment on the
outcome.

chosen over the rejected synonyms because each of those loses the one sense that matters here —
"the driver can no longer change this alone":

- `final` — reads as "the last one in a sequence" (ordinal), not "cannot be moved" (modal). a
  rejected reviewer is often the last one seen, yet it is NOT terminal.
- `done` / `finished` / `complete` — all imply *success* or *fullness*. but `malfunction` and
  `constraint` are terminal precisely because they are **not** done well — they are stuck. a word
  that whispers "success" would mislead on exactly the verdicts that most need a human.
- `closed` — implies the matter is settled and needs no further act. but an `exhausted` or
  `malfunction` terminal still **requires** an explicit human act (`--as approved` /
  `--as overruled`) before passage. "closed" would hide that obligation.

`terminal` carries none of that baggage: an end-state can be a good end (`approved`) or a stuck
end (`malfunction`) — the word stays neutral on quality and precise on the modal fact.

## .the two senses (one concept)

the same word reads at two scopes, but it is one concept — *a guard at an end-state*:

1. **terminal-for-unlock** — a level is terminal when every guard at it is terminal, which lets
   the next level run. this is the *order* use: it decides *when* a dearer level executes.
2. **the passage gate** — a stone cannot pass until **every** peer-review guard is terminal. this
   is the *gate* use: it decides *whether* the stone moves.

both read the same predicate `isReviewPeerVerdictTerminal`. the whole regression this term was
added to fix was a place where these two senses were conflated — a *prior* level as terminal
(unlock) was wrongly taken to clear a *later* level (passage). the term file exists to keep the
one concept sharp so the two uses never drift apart again.

## .terminal is necessary, not sufficient

terminal gates passage; it does not grant it. once **all** guards are terminal, a per-verdict
consequence still applies:

| terminal verdict | consequence for passage |
|---|---|
| `approved` | clears autonomously — the only verdict a driver can pass on alone |
| `exhausted` | needs a human `--as approved` |
| `malfunction` | needs a human `--as overruled` |
| `constraint` | needs a human `--as overruled` |
| `overruled` | already forgiven (a human act put it here) |

so `approved` is the sole terminal verdict that lets the driver proceed without a further human
act. every other terminal state is an end the driver reached but cannot pass alone.

## .disputes

none. the four-verdict set (`approved | exhausted | malfunction | constraint`) predates this
capture as the codebase's `isReviewPeerVerdictTerminal`; `overruled` is the human-added fifth. the
term merely names, in the glossary, a concept the code already carried.

## .evidence

- **code**: `src/domain.operations/route/guard/review/peer/meter/isReviewPeerLevelTerminal.ts`
  declares `isReviewPeerVerdictTerminal` = `approved | exhausted | malfunction | constraint`; the
  ladder reads it in `isReviewPeerLevelUnlocked.ts` (unlock sense) and the passage flow reads it in
  `setStoneAsPassed.ts` (gate sense).
- **domain-expert (wisher), 2026-07-24**: "you can't pass a stone until all the peer review guards
  are terminal … all reviewers must be terminal before a stone can be moved past." this quote made
  terminal the **core invariant** of the `fix-route-overruled` behavior — the strongest possible
  evidence that the term is load-bearing, not incidental.
