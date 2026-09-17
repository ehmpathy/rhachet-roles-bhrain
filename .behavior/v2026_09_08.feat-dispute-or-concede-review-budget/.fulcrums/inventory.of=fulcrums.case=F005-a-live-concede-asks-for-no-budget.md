# F05 · a concede at `live` surfaces a re-arrival, not a budget ask

- **rework** = clean · **confidence** = 82% · **status** = best-guessed

## .the fork

acceptance #3, literally: *"on `<concede>`, the route halts and surfaces a budget ask."*

**option A** — obey it literally: every concede prints the budget-add command.
**option B** — the halt names the remedy that **fits the reviewer's meter**: a top-up when the lane
is `exhausted`, a plain re-arrival when it is `live`.

## .taken, and why

**option B.**

a concede at `live` means *"the reviewer is right, and I will fix it"* — and that lane **still has
rounds**. to print `--add N` there tells the driver to buy a round it already owns.

⇒ `rule.require.errors-name-the-fix` (ergonomist): *"a bad input says what to do, not just that it
failed"* — and `rule.forbid.surprises`: a remedy that does no work is the surprise.

**the halt still happens in both cases**, so the half of acceptance #3 that carries the load is
honored. what varies is only the line under it:

```
🗿 conceded — architect (l1), 1 round left
   └─ fix, then re-arrive
      └─ rhx route.stone.set --stone 5.1 --as passed
```

```
🗿 conceded — architect (l1), budget spent
   └─ buy the round — yours to spend
      └─ rhx route.guard.budget --for review --add 2 --peer architect --stone 5.1
```

🟡 **the `--peer` is not incidental.** a concede names its lane, and
`formatBlockRemedyGroups.ts:83-88` already appends `--peer <slug>` when exactly one lane is
exhausted. to emit the bare form here would widen a top-up the extant halt already scopes.

⇒ **this deviates from the wish's literal words and not from its outcome.** stated here per
`rule.require.wish-outcome-over-proposal`: *"if you deliver the acceptance criteria with a shape
this wish did not imagine, that is a success, never a deviation. say why in your yield."*

## .rework, and why

**clean.** the remedy block is computed by `computeBlockRemedyGroups`, which already branches on the
block reason and already carries the owner labels. one more branch on the meter.

### 🔴 `review.self r4` — that paragraph names ONE surface, and this fork spans TWO

*"the remedy block is computed by `computeBlockRemedyGroups`"* holds for the **halt** (`case=5`
`[t1]`/`[t2]`) and fails for the **ack**. the two blocks quoted above open `🗿 conceded — …`: that is
the `--as conceded` emit, which is `formatRouteStoneEmit`'s action branch, and
`computeBlockRemedyGroups` does not run there.

🔴 **and the ack is the surface that lacks the data.** the meter — `(l1), 1 round left` versus
`budget spent` — is exactly what B branches on, and `setStoneAsContemplated`, the operation this
design reuses whole, emits a **two-line ack with no meter** (`:113-122`) and never calls
`getAllReviewPeerMeterStatuses`. its own note argues against the extra read: *"the ready path — the
common one — pays no git subprocess"* (`:131-134`).

| the surface | the operation | what B needs there |
|---|---|---|
| the halt — `[t1]`, `[t2]` | `computeBlockRemedyGroups` | ✅ one more branch, exactly as the paragraph says |
| 🔴 the ack — `[t0]` | `formatRouteStoneEmit`'s action branch | 🔴 a **new meter read** on the stance path |

⚠️ **this moves neither the 82% nor the `clean` label.** a meter read is additive and reversible, and
option A needs no meter at all — it prints the top-up always. ⚠️ **that is the honest asymmetry to
hand the wisher: B costs a read A does not**, with the mitigation that a stance is rare where a
contemplate is common, so the cost lands on the rare path.

## .confidence, and why it is 82%

the ergonomic argument is solid and the mechanism already branches. the 18%: a **uniform** remedy is
easier to teach and to snapshot, and the wisher may value that over the fit. an always-printed
`--add` is never *wrong*, only redundant.

⇒ **what would settle it:** one line from the wisher — *"print the top-up always"* or *"print what
fits."*

## .where

`1.vision.experience.case=5.the-concede-keeps-the-hold.md` · `case=6`

## .the verdict

_not yet ruled._
