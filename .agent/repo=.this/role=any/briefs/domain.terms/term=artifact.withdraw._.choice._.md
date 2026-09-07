# domain.term: withdraw

term.chosen   = withdraw
term.kind     = verb
term.boundary = artifact     # SETTLED 2026-08-31 — it spans dreams, briefs, and fulcrums alike,
                             # and `artifact` is the one word that covers all three
term.synonyms.forbidden:
- undo
- revert
- retract
- rescind
- cancel

## .what

to withdraw an artifact is **to retract its claim while the record of the claim stays.**

it is the act you perform when an artifact you produced turns out to rest on a premise that does
not hold — a dream for a defect already fixed, a brief that teaches a fiction, a fulcrum whose
decision the wisher overturned.

## 🔴 .withdraw is NOT delete — that is the whole reason it earns a word

| act | the file | the record |
|---|---|---|
| **delete** | gone | gone — no trace the claim was ever made |
| **withdraw** | may be deleted | 🔴 **kept** — what was claimed, why it failed, and what settled it |

⇒ **a claim deleted with no record is a claim the next traveler re-derives.** the withdrawal record
is what stops that, so a withdrawal that leaves no trace has withdrawn naught — it has merely
tidied.

## .what a withdrawal owes

three things, and each one is checkable:

1. **the claim, as stated** — what the artifact asserted
2. **the authority that overturned it** — a source read, a wisher verdict, a measurement
3. **a durable home for both** — a seed (`.said` / `.settled`), a fulcrum entry, or a `status` flip
   on the record it overturns

🟡 **the file may go; the reason may not.** the hazard brief withdrawn on 2026-08-31 was deleted
from disk and its full account survives in `S19` and `F27`.

## .the lifecycle it sits on

`dream` already declares two states — **caught** locally, **dispatched** to the radio.
`withdraw` is the third, and it is terminal:

```
caught  ──►  dispatched
   │
   └─────►  withdrawn        # the premise did not hold
```

## .refs
where the term composes declared contracts:
- `.behavior/*/.fulcrums/inventory.of=fulcrums._.md`      # the `status` column
- `.behavior/*/.seeds/inventory.of=seeds.case=S19-*.md`   # three dreams withdrawn
- `.behavior/*/.fulcrums/inventory.of=fulcrums.case=F27-*.md`  # a brief withdrawn
- `.behavior/*/1.vision.yield.md`                         # F1, F2, F9 withdrawn on wisher verdicts

## .reason
see the ref-level cluster beside this choice:
- `term=artifact.withdraw._.choice.reason.md` — etymology, the rejected synonyms, and the
  boundary, settled 2026-08-31
