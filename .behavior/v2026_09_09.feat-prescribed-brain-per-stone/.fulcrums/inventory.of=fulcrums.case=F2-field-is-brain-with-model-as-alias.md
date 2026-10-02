# F2 — the field is `brain:`; `model:` is warned as an alias, its value dropped

**rework** = clean · **status** = open · **confidence** = 90%

## .the fork

the issue leaves the field name open: `brain:` (rhachet's term) or `model:` (the slash command's word).

## .taken, and why

**`brain:` is canonical. `model:` is matched and warned, and its value is dropped** — it never lands
in `result.brain`, so a driver must rename it (`parseStoneGuard.ts`, `case=4` `[t4]`–`[t6]`).

- `rule.require.ubiqlang` — one word per concept, and the concept is a brain
- `rule.forbid.domain-term-synonyms` — the synonym is recorded and warned, never silently tolerated
- the precedent conforms: `rhx review --brain <slug>` ships; `rhx enroll` carries no `--model`, and the
  `enroll --model` lines the issue cites sit only in archived routes

## .the counter-case

an alias is a second name for one concept. a purist read keeps one key and lets an unknown-key
rejection catch the typo — which `F4` ruled out, so the alias warn is now the whole defense for
`case=4`.

⚠️ `brain` is overloaded inside rhachet: `enroll --brain` names a brain-cli, `review --brain` a
brainslug. the guard field's value is a third sense — the brain-cli's own `/model` argument (`F10`).

## .rework

clean — delete one allowlist entry and one warn branch; no contract depends on `model:`.

## .where

`1.vision.experience.case=4.the-field-name-is-misspelled.md`

## .the verdict

open — decide alongside `F4` and `F18`.
