# F16 — `level` and `concurrency` are two numbers that read alike, and position is the only mitigation

- raised = 2026-09-13, at peer round **i010/r010**, point 6
- rework = **clean**
- status = **open**
- confidence = **90%**

## .the fork

the vision named this in its own `## .what is awkward`, as item 1 and the sharpest one:

> *"`level: 3` is an **ordinal** — a position in a sequence. `concurrency: 3` is a **cardinal** — a
> count of slots. a guard that carries `level: 3` and `concurrency: 3` on adjacent lines invites a
> reader to relate them, and they are unrelated. **i have no repair for this beyond the word
> choice.**"*

⇒ and it carried **no fulcrum row** for thirteen rounds. r010 caught that, verbatim:

> *"has shipped with zero ergonomic mitigation — no distinguishing hint, no warning, nothing
> tested."*

**the reviewer is right that nothing mitigates it, and the row is owed** — this is F12's concealment
shape exactly (`rule.always.catch-dreams-for-followups`: a judgment with no fulcrum beside it is
unreviewable), committed by a **vision prose note** rather than by a dream.

| option | for | against |
|---|---|---|
| **A** — rename `concurrency` | removes the collision at the root | 🔴 **refused.** F5 (95%) and F8 (91%) both settled this word, the second by a nine-instance enumeration against seven candidates. a rename re-opens two of the board's highest-confidence rows to repair its lowest-severity one |
| **B** — a parse-time warn when `level` and `concurrency` are equal | fires exactly at the confusable moment | 🔴 **refused.** `level: 1` beside `concurrency: 1` is a **legitimate and common** shape — a serialized first rung. a warn that fires on a correct config is noise, which is what `rule.forbid.emphasis-noise` charges for |
| **C** — a doc comment on both keys | cheap, additive | 🟡 weak by F13's own measured argument: *"a guard author writes YAML and never opens `RouteStoneGuard.ts`"* |
| ✅ **D** — **position**, plus the doc, and say so | the settlement already separates them | it mitigates by **layout**, which no test can hold |

## .the taken — D, and its mechanism is F1's settlement rather than a choice made here

🔴 **the vision's premise is now false, and that is what moves this row off "unmitigated".** it
imagined the two keys *"on adjacent lines"*. under **F1 option B** — settled by the wisher at seed
S6 — they are not, and cannot be:

```yaml
reviews:
  peer:
    - slug: alpha-checker
      level: 1              # ← the ORDINAL, on the reviewer
      group: anthropic
  groups:
    anthropic:
      concurrency: 10       # ← the CARDINAL, on the group, a different block
```

⇒ **the bound belongs to a SET and the level belongs to a REVIEWER**, which is the whole argument
seed S4 made when the wisher coined `concurrency group`. the two facts have two homes, so the two
numbers have two homes, and the adjacency that made the confusion sharp is structural rather than
stylistic.

🟡 **so this row records a mitigation the round did not design.** it fell out of a settlement taken
for an unrelated reason, which is worth the record: the vision's awkwardness note was written before
F1 settled, and nobody re-read it afterward.

## .the 10% — the residue, and it is in SOURCE rather than in yaml

the separation holds in the declaration and **breaks in the identifiers**:

| identifier | what it is | how it reads |
|---|---|---|
| `DEFAULT_LEVEL_CONCURRENCY = 10` | a **cardinal** | the two words adjacent, in one name |
| `RHACHET_LEVEL_CONCURRENCY` | a **cardinal**, operator-set | same, and it is the surface an operator types |

⇒ 🔴 **an operator who reads `RHACHET_LEVEL_CONCURRENCY=3` can take it for "act at level 3".** it
means "at most 3 at once, at every level". the yaml is safe; **the env var is the confusable
surface, and it is the one this row leaves open.**

⚠️ and it is the surface with **no** parse-time reader at all —
`rule.always.spend-own-levers-before-escalation` names it an operator dial precisely because it
moves with no code edit, so no refusal can reach it.

## .what would overturn it

**a measurement, and it is cheap:** a guard author or an operator who reports the misread — either a
`RHACHET_LEVEL_CONCURRENCY` set as an ordinal, or a `concurrency:` written where a `level:` was
meant. one instance turns this from a theorized ergonomic risk into a measured one, and then option
C's weakness (nobody reads the source) stops to be the constraint that bounds the fix.

🟡 **the cheapest real repair, if it ever earns one:** rename the env var to name the SET rather than
the level — the same move F1 made in yaml, applied to the dial. that is a published-surface rename
and it wants the council.

## .where

- `src/domain.objects/Driver/RouteStoneGuard.ts` — the two keys and their docblocks
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — `DEFAULT_LEVEL_CONCURRENCY`
- the vision's `## .what is awkward`, item 1 — the note this row was owed against

## .the verdict

*(open — the council rules it)*
