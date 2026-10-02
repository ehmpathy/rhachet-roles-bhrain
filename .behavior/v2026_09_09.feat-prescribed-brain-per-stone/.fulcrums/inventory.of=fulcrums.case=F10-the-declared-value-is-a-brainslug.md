# F10 — the declared value is the brain-cli's own `/model` argument

**rework** = clean · **status** = ✅ ruled 2026-09-10 — best-guess overturned · **confidence** = settled

## .the fork

three vocabularies meet at the `brain:` field:

| # | vocabulary | example | who reads it |
|---|---|---|---|
| 1 | rhachet **brain-cli** | `claude` | `enroll --brain` |
| 2 | rhachet **brainslug** | `anthropic/claude/sonnet` | `review --brain`, `ActorOndisk.brain`, `getBrainSlugFull` |
| 3 | the brain-cli's **`/model` argument** | `claude-opus-5[1m]`, `opus` | the slash command the wish dispatches |

the wish writes `/model <brainslug>` and gives a #3 value as the example.

## .the best-guess, and why it lost

the best-guess was **#2, translated to #3 at dispatch**: a live compare reads rhachet's record, which
is #2, and #2 has a shipped normalizer.

the counter-case: a guard author types what they last typed into `/model`
(`rule.prefer.defaults-match-common-case`), and no shipped surface maps a brainslug to a `/model`
argument — a map that may not be writable, since the argument set is the brain-cli's and changes
without our release.

#1 is ruled out on its own: every stone runs the same CLI, so `claude` cannot express the distinction.

## .the verdict

> *"for now, lets use the brain-cli's own /model argument"* — the wisher (`S2`)

> a prescription is written in the vocabulary of the tool that executes it.

- the value passes to `/model` verbatim — no translation layer, so none can be wrong or drift
- the open research (is a #2 → #3 map writable?) is closed by the design, not by an answer
- 🟡 *"for now"* bounds it: a later route may add the map and move the field to #2
- the cost moves to `F5`: a live-brain compare now spans #3 against rhachet's #2, and
  `getBrainSlugFull` normalizes within #2 only

⇒ the full entry: `../appendix/.fulcrums/inventory.of=fulcrums.case=F10-the-declared-value-is-a-brainslug.md`
