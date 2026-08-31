# domain.term: guard.rung

term.chosen   = rung
term.kind     = noun
term.boundary = guard        # carried in the filename — the word holds two senses
term.synonyms.forbidden:
- step
- stage
- checkpoint

## .what
a **guard.rung** is a single gate-position in a guarded stone's one ordered ladder. the ladder holds
every gate in climb-order: peer-review level 1 → peer-review level 3 → … → the judge. a peer level
is a rung; the judge is the top rung. a stone passes only once every rung reaches terminal.

## ⚠️ .rung is overloaded — this cluster is the GUARD sense

**`rung` names a position on a ladder, and this repo has two ladders.** both are real, neither is a
synonym of the other, so the word is **boundary-qualified rather than renamed**:

| boundary | the ladder | a rung is |
|---|---|---|
| **`guard`** — this cluster | a guarded stone's gate ladder: peer levels → the judge | a gate-position you must clear |
| **`entoolment`** | the determinism ladder: 🧠 tribal → 📚 brief → 💪💧 fluid → 💪🔩 rigid → 💪🪨 solid | an artifact's brain-cost position |

⇒ **cite the qualified form in any contract.** a bare `rung` in a `.refs` or a signature does not
say which ladder, so the reader must open a file to find out
(`rule.require.boundary-qualified-terms`).

⚠️ the `entoolment` sense is **undeclared** — it lives in
`philosophy.entoolment-is-the-pinnacle` prose and composes no declared dobj/dop, which is the bar
`rule.require.domain-term-itemization` sets for a cluster.

`rung` is the metaphor term that **unifies peers and the judge into one ladder**. the judge is not
a gate outside the peer levels; it is the highest rung of the same ladder, so overrule, unlock,
and passage treat it with no special-case branch.

## .rung is not level

a rung and its `level` are distinct concepts, not synonyms:

- **rung** = the gate-position itself (an entity you climb).
- **level** = the rung's numeric coordinate on the ladder (1, 3, or `JUDGE_LEVEL`).

a rung *has* a level, the way a step has a height. `isJudgeRungHeld` asks about the judge *rung*
(the position); `JUDGE_LEVEL` is that rung's *level* (its coordinate). do not collapse the two.

## .refs
where the term composes declared operations:
- src/domain.operations/route/guard/judge/isJudgeRungHeld.ts               # the judge rung is held when its latest verdict malfunctioned
- src/domain.operations/route/guard/review/peer/meter/JUDGE_LEVEL.ts       # the judge is the top rung of the ladder
- src/domain.operations/route/guard/review/getStoneGuardLevelState.ts      # surfaces the judge rung once peers clear and it holds
- src/domain.operations/route/guard/judge/getStoneGuardJudgeVerdicts.ts    # reads the verdicts that decide if the judge rung holds

## .reason
see the ref-level cluster beside this choice:
- `term=route.guard.rung._.choice.reason.md` — the ladder etymology, why `rung` not `step`/`stage`, why
  `rung` and `level` are kept distinct, and the 2026-08-14 overload dispute
