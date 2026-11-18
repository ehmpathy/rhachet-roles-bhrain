# define.invariant.review.peer.dispute.the-fulcrum-is-the-one-home

## .what

> **the fulcrum file is the one home of a deferral.** its deterministic attributes live in yaml
> frontmatter. the dispute record only links its fulcrum. the summary row is derived from the
> frontmatter, never typed twice. a `verdict` is valid only if a human wrote it.

## .kind

**nurture.** the team chose it, to make a deferral machine-readable so a halt can derive its lines.
prose cannot be gated and cannot be summed. a different team could keep free prose and trust a
reader. this one needs the halt to read.

## .invariant

```
every $route/.fulcrums/inventory.of=fulcrums.case=*.md  ⟹  opens with valid frontmatter

required: case · rework · ground · confidence · status · owed · holds · lean · verdict
optional: reflect          (required when owed = reflect)

rework     = clean | dirty
ground     = wrong | dirty
confidence = the weakest call the fulcrum holds, never an average
status     = open | held | ruled | superseded
owed       = human | reflect | none      (derived at write: ground × confidence)
holds      = [lane/round/ordinal, ...]   the reviewer concerns it holds
lean       = one line: the driver's lean, what the halt shows the human
verdict    = null | { by: human, at: <date>, ruled: upheld | conceded }

a dispute record  ⟹  holds the fulcrum path only; it restates no frontmatter attribute
a summary row     ⟹  derived from the frontmatter; the two never disagree

verdict ≠ null  ⟹  a matched entry exists in $route/.fulcrums/verdicts.jsonl
                    written by the human-only `rhx route.fulcrum.rule`
```

🔴 **the frontmatter block, the one canonical form:**

```yaml
---
case: F44
rework: clean
ground: wrong
confidence: 0.65
status: open
owed: human
holds: [rules-lane/i003/blocker.2]
lean: the reviewer read a rename table as a contract change
verdict: null
---
```

## .why

a deferral kept as prose has three failures. the halt cannot read it, so it cannot name it. the
summary row is typed by hand, so it drifts from the entry. and a dispute record that restates the
fulcrum holds the same fact in two homes, which diverge on the first edit.

⇒ one home, structured. the record links, the summary derives, the halt reads. no fact is typed
twice.

🔴 **the verdict needs provenance.** a `verdict` edited into the yaml by a driver would settle a
dispute the human never saw, and the gate would read it as human-ruled. so a verdict is valid only
with a matched entry in the verdict log, which only the human-only lever writes
(`getDecisionIsCallerHuman`). a hand-forged verdict holds the stop.

🔴 **confidence is the weakest held call.** a table of rows at 55 to 90 percent is a 0.55 fulcrum,
the incident's exact shape. an average would grade it 0.75 and hide the weak rows.

## .scope

- it governs every fulcrum on the route, disputed or not: the linter is the backstop for the whole
  inventory, and the dispute path checks the one `--why` fulcrum at write, the cheapest moment
- it governs the fields, never the narrative. the entry body keeps its sections (the fork, taken and
  why, rework and why, confidence and why low, where)
- `owed` is derived, never typed. a typed `owed` that disagrees with the derive is an invalid file
- the status set is closed. `best-guessed` and `wisher-ruled` of the older summary are retired:
  `open` is a best guess, `ruled` carries the verdict

## .the litigation

the wish placed `confidence` in the frontmatter and also shaped a `--confidence` flag. the number
would be typed twice, once in the file and once on the line, which breaks this invariant to serve the
band rule. the frontmatter alone serves both: the dispute path already requires the `--why` path, so
the read costs the driver no new input.

two fields beyond the wish are required. `ground` is the key the band rule needs, since a dirty call
never reflects. `lean` is what the halt shows, and the wish had no field for it.

## .the counter-argument

*"every fulcrum write grows a frontmatter block, and a driver in a hurry skips it."* stated fairly,
and real: the cost is a few lines on each entry. the linter makes the skip loud (the stop holds,
names the file, names the absent fields), and the dispute path refuses at write, so a skip never
survives to a gate. the block is the price of a halt the human can trust.

## .what would overturn it

- a fulcrum shape that frontmatter cannot hold, such as a deferral with no fixed attribute set.
  that would argue for a json sidecar beside the entry, with the same linter
- a verdict log that diverges from the yaml in a case that no clamp covers. that would argue for one
  store only, the log, with the yaml derived

## .enforcement

- a fulcrum entry with absent or invalid frontmatter that passes the stop = **blocker**
- a dispute record that restates a frontmatter attribute = **blocker**
- a summary row typed by hand that disagrees with its frontmatter = **blocker**
- a `verdict` with no matched verdict-log entry that passes the stop = **blocker**
- a `confidence` that averages, where the fulcrum holds a weaker call = **blocker**
- enforcer: an onStop linter beside `route.drive --when hook.onStop`. every
  `$route/.fulcrums/inventory.of=fulcrums.case=*.md` carries valid frontmatter, or the stop holds
  (exit 2) and names the file and the absent fields. it also refuses a `verdict` with no matched
  entry in `$route/.fulcrums/verdicts.jsonl`. the dispute path reads the same fields at write,
  through one formatter. the clamp: a fulcrum with no frontmatter holds the stop, and with the
  linter removed the stop goes through; a hand-forged verdict holds the stop

## .see also

- `rule.always.itemize-the-fulcrums-you-best-guess` — the record this makes structured
- `define.invariant.review.peer.dispute.sure-misread-owes-a-reflection` — `ground` and `confidence`
  decide `owed`
- `define.invariant.review.peer.dispute.reconciled-at-the-human-gate` — the halt that reads the block
- `rule.forbid.timestamps-in-route-artifacts` — the verdict `at` is a date, never a time
