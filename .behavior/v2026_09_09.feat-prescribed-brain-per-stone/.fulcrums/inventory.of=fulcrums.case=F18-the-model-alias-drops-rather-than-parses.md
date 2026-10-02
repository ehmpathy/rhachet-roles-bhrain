# F18 — `model:` drops its value, per `case=4`'s timeline

**rework** = clean · **status** = open · **confidence** = 80%

## .the fork

the vision contradicted itself:

| artifact | says |
|---|---|
| `case=4` `[t4]` | *"parseStoneGuard drops the line"* |
| `case=4` `[t6]` | *"the driver changes `model:` to `brain:` … then the guard parses"* |
| `F2` and the vision yield, as first written | *"`model:` parses as a warned alias"* |

`[t6]` decides it: if `model:` carried its value at `[t4]`, the edit at `[t6]` is a no-op.

## .taken, and why

**drop.**

- `rule.forbid.domain-term-synonyms` forbids a contract that accepts a synonym; a parser that lands
  `model:`'s value makes `model:` a live key of the guard format
- a key that still works is a key nobody renames — the warn is read once, the key lives forever
- the demoed timeline is what `rule.require.experience-coverage` grades against

## .the counter-case

the intent was unambiguous — the parser knew enough to name `brain:`, then discarded the value. a
driver who does not read stdout runs the stone on its inherited brain. `F4` already accepted that
residue for near-misses, and it went to the lenient side — a wisher consistent with `F4` may accept
`model:` and keep the warn.

## .rework

clean — `parseStoneGuard.ts`'s `rawKey === 'model'` branch `continue`s before `result.brain` is set;
to restore the accept, remove that `continue` and flip `parseStoneGuard.brain` `case5`. `model:`
never parsed on `main`, so no consumer depends on either shape.

## .the verdict

open. `F2`, the vision yield, and `term=route.guard.brain` now agree with `case=4`.
