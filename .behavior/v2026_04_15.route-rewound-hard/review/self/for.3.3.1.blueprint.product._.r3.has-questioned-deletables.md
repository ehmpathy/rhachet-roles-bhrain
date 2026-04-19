# self-review r3: has-questioned-deletables

tea first. then we proceed 🍵

---

## fresh eyes review

step back. look at the blueprint as if for the first time.

---

## the "would we add it back" test

for each component, I ask: if we deleted this and had to rebuild from scratch, would we add it back?

### the `--soft` alias

**if deleted:** users would type `--yield keep` instead of `--soft`
**would we add back?** maybe not

**deeper question:** does the wish actually require `--soft`?

re-read wish line 5:
> "soft should just do the current rewind"

this describes behavior, not a flag name. the wish says:
- line 3: "--mode hard | soft"

wait. the wish says `--mode hard | soft`, not `--hard | --soft` as separate boolean flags.

**discovery:** the wish uses `--mode hard` and `--mode soft`, not `--hard` and `--soft` as separate boolean flags.

**but:** our blueprint uses `--yield drop|keep` with `--hard`/`--soft` as aliases.

**question:** did we over-engineer the flag design?

let me check what the wish actually asks for:
- line 3: "rewound --mode hard | soft"

the wish uses `--mode` as the flag name with `hard|soft` as values.

our blueprint uses `--yield` as the flag name with `drop|keep` as values, plus `--hard` and `--soft` as boolean aliases.

**is `--yield drop|keep` better than `--mode hard|soft`?**

analysis:
- `--yield drop` is more descriptive — tells you what happens to yields
- `--mode hard` is more abstract — requires prior knowledge
- `drop|keep` are actions; `hard|soft` are metaphors

**but:** the wish explicitly uses `--mode hard | soft`. are we in deviation?

**check criteria:** the blackbox criteria uses `--yield drop`, `--yield keep`, `--hard`, `--soft`.

so the criteria refined the wish's `--mode hard|soft` into `--yield drop|keep` with aliases.

**conclusion:** the name change from wish to criteria is intentional and approved via criteria stone. keep as-is.

---

### the `--hard` and `--soft` boolean aliases

**if deleted:** users would only have `--yield drop|keep`
**would we add back?**

the aliases serve as shortcuts:
- `--hard` = `--yield drop`
- `--soft` = `--yield keep`

**are shortcuts needed?**

- wish uses "hard" and "soft" terminology
- aliases let users think in wish terms
- no code complexity (just parseArgs booleans)

**verdict:** keep — matches wish terminology

---

### the 5 validation error cases

let me question each one:

| error | if removed | consequence |
|-------|------------|-------------|
| `--hard` + `--soft` | user passes both | ambiguous intent, undefined behavior |
| `--hard` + `--yield keep` | user contradicts self | ambiguous intent |
| `--soft` + `--yield drop` | user contradicts self | ambiguous intent |
| `--yield` + non-rewound | user tries yield with `--as passed` | silent ignore or crash? |
| `--hard` + non-rewound | user tries hard with `--as passed` | silent ignore or crash? |

**all 5 prevent user error.** keep.

---

### the yieldOutcomes data structure

**if deleted:** output would not show per-stone yield status
**would we add back?**

the wish says (line 29):
> "prove via snaps before and after rewound the file contents to verify"

to verify yield behavior, we need to observe it. yieldOutcomes enables:
- output: `yield = archived | preserved | absent`
- test assertions on per-stone behavior

**verdict:** keep — required for observability per wish

---

### the archiveStoneYield.ts file

**if deleted:** archive logic would be inline in setStoneAsRewound
**would we add back?**

inline pros:
- one less file
- no import

inline cons:
- setStoneAsRewound grows from ~50 to ~70 lines
- archive logic cannot be unit tested in isolation
- breaks pattern from delStoneGuardArtifacts

**verdict:** keep separate — testability matters

---

### the collision timestamp logic

**if deleted:** archive would overwrite prior archives
**would we add back?**

scenario: stone rewound twice with `--hard`
- first rewind: `3.blueprint.yield.md` → `.route/.archive/3.blueprint.yield.md`
- second rewind: no yield to archive (already archived)

wait — if first rewind archives the yield, second rewind has no yield to archive. collision only happens if:
1. stone is rewound with `--hard`
2. yield is re-created (stone passes again)
3. stone is rewound with `--hard` again

**is this realistic?**

yes. the route-driven workflow:
1. stone fails → rewound hard → yield archived
2. redo stone → new yield created
3. stone fails again → rewound hard → collision!

**verdict:** keep — collision is realistic, history preservation matters

---

## deletables found

**none after deeper analysis.**

the `--soft` alias was questioned hardest, but it matches wish terminology and completes the pair.

---

## simplifications rejected

| component | simplification | reason to reject |
|-----------|---------------|------------------|
| `--soft` alias | remove | breaks wish terminology match |
| yieldOutcomes | remove | breaks observability per wish |
| archiveStoneYield.ts | inline | breaks testability |
| collision logic | remove | history loss in real workflow |

---

## conclusion

the "would we add it back" test was applied to each component. all pass. the blueprint is minimal — no component can be removed without break of a requirement or best practice.

🦉 zero deletables after deep scrutiny. so it is.

