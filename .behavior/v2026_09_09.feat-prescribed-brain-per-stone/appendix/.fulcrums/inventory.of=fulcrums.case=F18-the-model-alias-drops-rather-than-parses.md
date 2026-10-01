# fulcrum F18 — `model:` DROPS its value, where `F2` reads as though it parses

**raised** 2026-09-14, at `5.1.execution.from_vision`, self-review r5 `behavior-declaration-adherance`
**rework** clean · **status** open · **confidence** 80%

## 🔴 .the fork is a CONTRADICTION inside the vision, not a choice the vision left open

two of this route's own artifacts prescribe opposite behavior for `model:`, and the build had
followed the weaker one.

| the artifact | what it says |
|---|---|
| 🔴 `case=4` `[t4]` | *"parseStoneGuard **drops the line**, exactly as it does today"* |
| 🔴 `case=4` `[t6]` | *"the driver **changes `model:` to `brain:`** and saves / then the guard parses, **carries** `brain: claude-sonnet-5[1m]`"* |
| 🔴 `case=4` grade table | *"**teaches the fix** … `[t6]` shows the driver **act on it**"* |
| `F2`'s title + line 12 | *"`model:` **parses** as a warned alias"* · *"`brain:` is canonical. `model:` **parses**, warns, and names the canonical word"* |
| `1.vision.yield.md` | *"`model:` parses as a warned alias"* |

⇒ **the timeline says the value is dropped and the driver must edit. the summaries say it parses.**
`[t6]` is the decisive line: if `model:` already carried its value at `[t4]`, then `[t6]` is a
no-op and `[t7]`'s switch would fire without it. the timeline needs the edit, three times.

## .taken, and why

🔴 **the timeline, and the value is DROPPED.** three reasons, in the order they weigh:

1. **`rule.forbid.domain-term-synonyms` — cited by `F2` as its own justification — forbids the
   accept.** its subject is precisely a **contract**: *"no contract may use a synonym of a term
   declared in `domain.terms/`."* a parser that lands `model:`'s value on `brain` makes `model:` a
   live key of the guard format, which is the contract that accepts the synonym. what the rule
   permits is the synonym **recorded** as forbidden — which `term.synonyms.forbidden` already does.
2. **a key that still works is a key nobody renames.** an accepted alias plus an advisory warn ships
   a permanent second name for one concept; the warn is read once, the key lives forever.
3. **the demoed timeline is what `rule.require.experience-coverage` grades against.** `[t4]`–`[t6]`
   is 3 timesteps and a grade-table row; `F2`'s is one word inside a fulcrum whose subject is the
   **name** question, never the accept/drop one.

🟡 **and the summaries are the copies.** `declare-once`: a one-line restatement of a worked timeline
drifts from it, and this inventory has now recorded that class three times.

## .the counter-case, stated fairly

**a drop is less lenient, and the driver's intent was unambiguous.** they wrote `model:` and they
meant a brain; the parser understood them well enough to name `brain:` in its warn, then discarded
the value anyway. a driver who does not read stdout runs the whole stone on its inherited brain —
which is `case=4`'s own harm, arrived at by the fix.

⇒ **that is a real cost and it is NOT new.** `F4`'s ruling already priced exactly this residue for
the near-miss path: *"🟡 a warn, never a halt … a driver who does not read output proceeds."* the
drop extends one accepted trade; it does not introduce one.

⚠️ **a wisher who weights the lenient read above the ubiqlang one would rule the other way**, and
the case for it is the paragraph above rather than a preference — so it is put here rather than
settled by a build.

## .rework, and why CLEAN

one branch and one test. `parseStoneGuard.ts` — the `rawKey === 'model'` block `continue`s before
`result.brain` is set; to restore the accept is to delete the early `continue`. the test
(`parseStoneGuard.brain` `case5`) flips four `then`s. **no contract depends on either shape** —
`model:` has never parsed on `main`, so there is no consumer to break in either direction.

## .confidence — 80%

| certain | not |
|---|---|
| the two artifacts contradict each other | which one the wisher intended. `F2` was written first, and `case=4` was worked in more depth after |
| the timeline's read is the one `rule.forbid.domain-term-synonyms` requires | whether the wisher weights that rule above the lenient read — the `F4` council chose forward compat over a loud typo, which is the *lenient* direction |

🔴 **the second row of column two is why this is not 95%.** the one prior data point on this exact
axis — `F4` — went to the lenient side. a wisher consistent with that verdict might well accept
`model:` and keep the warn.

## .where

- `src/domain.operations/route/guard/parseStoneGuard.ts` — the `rawKey === 'model'` branch
- `src/domain.operations/route/guard/parseStoneGuard.brain.integration.test.ts` — `case5`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=route.guard.brain._.choice._.md` + `.reason.md` — both amended to match
- `1.vision.experience.case=4.the-field-name-is-misspelled.md` `[t4]`–`[t6]` — the prescription followed
- `.fulcrums/…case=F2-field-is-brain-with-model-as-alias.md` — the summary that reads the other way

## .the verdict, once ruled

*(open)* — ⚠️ **and whichever way it goes, `F2`'s line 12 and the yield's summary must be amended to
agree with `case=4`.** the contradiction is the defect; the choice is secondary to it.
