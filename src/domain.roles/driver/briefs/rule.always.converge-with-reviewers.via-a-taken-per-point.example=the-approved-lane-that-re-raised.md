# example: the approved lane that re-raised

- **date** — 2026-09-21
- **repo** — `ehmpathy/rhachet-roles-bhrain`
- **branch** — `beav/feat-review-cost-meter`
- **stone** — `1.vision`, route `.behavior/v2026_09_20.review-cost-meter`
- **rule** — `rule.always.converge-with-reviewers.via-a-taken-per-point`

the occurrence that establishes the approved-lane hole: **the engine told the driver, in
writing, that no response was needed — and the reviewer re-raised every point anyway.**

## .what happened

two peer lanes at l1, `dimensional-decomposition` and `experience-coverage`. both **approved**
the stone at i001, and both approved it again at i002.

| round | verdict, both lanes | nitpicks | takens authored |
|---|---|---|---|
| i001 | approved | 3 | **0** |
| i002 | approved | 5 | **0** |
| i003 | approved | 0 | 2 (one per lane) |

at i002 every one of the five read as a re-raise. verbatim from the reports:

> this was raised in the prior review (dimensional-decomposition nitpick.1) and the target still
> contains it verbatim — no repair present.

> this was raised in the prior review (experience-coverage nitpick.2) and the target still
> contains it — no repair present.

the driver had done **no** repair work between the rounds — so at i002 the re-raise was simply
correct, and the reports named that plainly.

## .the part worth the file — the tool argued for the defect

the driver, mid-call, reached for the absorb command. it replied:

```
🦉 absorbed: dimensional-decomposition
   └─ this reviewer raised no blockers — no concern to absorb, no response needed
```

that reply is correct and it is about the gate. the entrance gate keys on a rejected lane's
debt; an approved lane carries none, so there was genuinely no concern for the engine to hold
the door with.

but it reads as a statement about the work, and it arrives at the exact moment the driver must
judge whether a `.taken` is owed. an absent gate is merely silent. this one affirms.

## .the close, in one round

four repairs landed, and two `.taken.by_self` files were authored — one per lane, each with a
`[REPAIR]` or `[REFUTE]` per point, each with a quote of the **current** file:

| lane | points | shapes |
|---|---|---|
| `dimensional-decomposition` | 2 | one `[REPAIR]`, one `[REPAIR + REFUTE]` |
| `experience-coverage` | 3 | three `[REPAIR]` |

the re-arrival that followed returned **`0 blockers`, `0 nitpicks`, both lanes**, in 99.8s and
87.6s.

the one `[REFUTE]` is worth its own note: the reviewer asked that an honesty `grade` axis be
promoted beside `quantity`, with `chars × grade` cells verdicted `impossible`. the refutation
conceded the stated justification (which was weak and genuinely wrong) and refused the
promotion on the rule's own orthogonality bar — `grade` is collinear with the extant `intent`
axis. the reviewer dropped it. a `[REFUTE]` converges when it cites; a skip never does.

## .what it cost

two review rounds — four lane-runs, ~6 minutes of brain time, two budget rounds per lane —
bought a verdict the driver already held at i001. the repairs themselves took one round.

## .the residual

the hole is in the **engine**, and this record does not close it: an approved lane with nitpicks
still has no gate, and `--as absorbed` still replies that no response is needed. the rule now
carries the cue and the blocker; the mechanism does not.

`philosophy.entoolment-is-the-pinnacle` (bhrain/role=learner, this repo): the capacity was not mechanized, so the concept is
the only enforcement — which is exactly when a cue has to be sharp.

up: `rule.always.converge-with-reviewers.via-a-taken-per-point`
