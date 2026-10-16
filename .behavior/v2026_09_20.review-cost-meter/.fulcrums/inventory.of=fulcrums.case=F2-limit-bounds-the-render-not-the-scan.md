# F2 — `--limit` bounds the render, not the scan

- rework = **clean** (one flag, two surfaces, no contract shape change)
- status = OPEN — raised by the wisher, 2026-09-20
- confidence = **40%** — the defect is certain; the right repair is not

## .the cue

the wisher, on `rhx review.fleet --limit 5`: *"this one doesnt really make sense"* — and,
in the same breath, *"stop running review.fleet it takes forever"*.

⇒ the two remarks are **one defect seen from two sides**.

## .the fork, stated fairly

`--limit` means two different things across the surfaces it appears on, and neither is the
thing a reader expects:

| surface | what `--limit N` actually does | what a reader expects |
|---|---|---|
| `review.corpus` | caps the **lanes** assessed | plausible — lanes are the unit |
| `review.fleet` | caps the **roll-up rows** rendered | *"look at fewer trees, so it finishes sooner"* |

🔴 **on the grove surface it bounds the OUTPUT, never the WORK.** every tree is still
discovered, every log still read, every run still graded — and then the table is truncated. so
the flag a reader reaches for to make a slow command fast makes it **exactly as slow** and
merely prints less.

## .the two defects, which must not be conflated

1. **an ambiguous label** (`rule.forbid.ambiguous-labels`) — one flag, two senses across
   two commands in the same family. a reader cannot carry a single meaning between them
2. **an unbounded scan** — `review.cost.grove` walks every discoverable tree with no way to
   narrow it. that is a real performance defect, and `--limit` disguises it by *appearing*
   to be the remedy

⇒ the second is why the first is more than cosmetic. an ambiguous flag with no effect at all
would be a nitpick; one that **advertises the remedy for a real defect and does not deliver
it** sends a reader down a path that cannot work.

## 🔴 .`F3` removed defect 1, and left defect 2 exactly where it was

`review.corpus` is deleted (ruled 2026-09-21). it held the **other** sense of `--limit`, so
the ambiguity has no second surface to live on: one flag, one command, one meaning.

⚠️ **that closes half this fulcrum by accident, and the half it closes is the lesser one.** the
label defect went away as a side effect of a ruling made on other grounds; the unbounded scan
— the reason the wisher said *"it takes forever"* — is untouched.

⇒ so `F2` stays **OPEN**, and narrower: the question is no longer *"which sense should the
flag have?"* but *"where does the time actually go?"*. a defect that resolves itself by an
unrelated deletion is exactly the kind a reader marks closed without a second look.

## 🔴 .it is NOT the `getAllTargetsTouchedAt` hazard, and the two must not be conflated

a peer review (i005, `enroll-impl-arch-defects`) raised both in one pass and drew the line
this record now keeps, because one of the two has since been repaired and the other has not:

| | `getAllTargetsTouchedAt` | **this fulcrum** |
|---|---|---|
| the shape | unbounded **parallelism WITHIN one call** | unbounded **breadth ACROSS calls** |
| what floods | one `Promise.all` over every target's stat | one walk over every tree on the machine |
| the remedy | a bounded wave — known, and local | ❓ unknown until the walk/read split is measured |
| status | ✅ **repaired** 2026-09-21, clamped red→green | 🔴 **OPEN** |

⚠️ **so a reader who sees "the unbounded scan was fixed" must not mark this closed.** that is
the second time this fulcrum has been at risk of an accidental close — `F3` already took its
label half by side effect (below), and a bounded wave one file over would take its name
without its defect.

## .the shape of the fix

the axes want to be named, not overloaded:

```
--limit N          # RENDER: show at most N rows per roll-up   (honest, and says so)
--trees <glob>     # SCAN:   read only the trees that match    (the actual remedy)
```

🟡 and the deeper answer may be that grove scope should not be a **filesystem walk** at all.
its figure today is *"every tree checked out on this machine"*, which is neither
reproducible nor bounded — see the vision's `.what is awkward`.

## 🔴 .the walk is ONE level deep — so `--trees` is probably the WRONG half

added 2026-09-22 at i015, after `enroll-impl-arch-defects` re-raised this row at `urgent` on a
stated hazard of *"symlink cycles or unusually large trees"*. a read of
`grove/getAllReviewTrees.ts` in full refutes the hazard and, more usefully, narrows this row's
open question:

```ts
const entries = await getAllEntriesInDir({ at: input.root });   // ONE readdir
…
return await Promise.all(
  dirs.map(async (one) => {
    const present = await isPathPresent({ at: path.join(one.dir, DIR_OF_REVIEW_LOGS) });
```

**there is no recursion.** the cost is `1 readdir + N stats`, where `N` is the count of top-level
entries under `--at`.

| the hazard raised | why it cannot occur |
|---|---|
| a symlink cycle | a cycle needs recursion. each symlink is resolved once, by one `stat`, never traversed |
| an unusually large tree | tree size is never read — only `<dir>/.log/bhrain/review` is stat'd |

🔴 **so discovery is cheap, and the wisher's *"it takes forever"* almost certainly lives in the
per-tree log READ.** that is a partial answer to this row's own open question, and it points the
opposite way from the shape-of-the-fix above:

> a `--trees` glob bounds **discovery** — the half now shown to cost `N` stats. it would buy
> close to naught. the remedy the measurement would likely favour is a **cache or an index over
> the read**, which is a larger and differently-shaped change.

⚠️ **this narrows the candidates; it does not measure them.** it rules out one on a read, and it
does not time the read half, so the actual repair still waits on the instrument.

## .why confidence is only 40%

the defect is certain. the repair is not, and it turns on a question not yet asked: **is
the slow part the walk, or the read?** no one has timed it. the i015 read above rules the walk
out on structure — `1 readdir + N stats`, one level, no recursion — which makes the read the
prime suspect and makes a `--trees` glob a band-aid over the wrong half.

⇒ a repair chosen before that measurement would still be a guess dressed as a fix — the same
shape as `F3`. what has changed is **which** guess looked plausible, and that is worth the row.

## .why it was not halted on

**clean rework.** one flag on two unreleased commands. and it is bounded by a question that
one measurement settles, so a best guess costs nothing to reverse.

## .where

- `src/contract/cli/review.fleet.ts` — the `--limit` parse and its use (renamed to
  `review.cost.grove.ts` by `F1`)
- ~~`src/contract/cli/review.corpus.ts`~~ — held the other sense; **deleted** by `F3`
- `src/domain.operations/review/grove/getAllReviewTrees.ts` — the unbounded walk, and the half
  of this fulcrum that survives. 🟡 this row cited it under `fleet/` until 2026-09-22; the dir
  renamed with `F1` and the citation did not, which is the stale-path shape `F3` was deleted for

## .the verdict

_(unruled)_
