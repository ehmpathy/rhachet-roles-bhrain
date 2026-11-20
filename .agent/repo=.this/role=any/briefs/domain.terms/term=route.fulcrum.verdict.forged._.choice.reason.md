# domain.term.choice.reason: forged

## .etymology

a verdict carries authority only because a human lever wrote it. a verdict in a human's name that no
human lever wrote is a **forgery** of that authority, whoever typed it and whyever. the word names the
act the gate refuses to trust, not the intent behind it.

| word | what it loses |
|---|---|
| `unproven` | it reads as "not yet checked"; the ledger was checked, and it disagrees |
| `fake` | it reads as a test double, a word this repo's tests already use |
| `tampered` | it implies a prior valid verdict was altered; most forgeries write a verdict where none stood |

## .evidence

the vision's invariant 2 lets only a human rule a dispute. a yaml field alone cannot prove that, so
the lever writes a ledger row (`.route/fulcrum.verdicts.jsonl`, fulcrum F11) and every gate proves the
yaml against it. the cases the proof must part:

| yaml verdict | newest ledger row | read |
|---|---|---|
| `null` | any | unruled |
| `upheld` | `upheld` | ruled |
| `upheld` | none, or `conceded` | **forged** |

## .the invariant

a verdict is ruled ⟺ the newest ledger row for its case names the same verdict. else it is forged,
and it counts as unruled.
