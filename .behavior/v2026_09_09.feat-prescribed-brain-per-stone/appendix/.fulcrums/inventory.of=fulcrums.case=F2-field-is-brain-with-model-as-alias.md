# F2 — the field is `brain:`; `model:` is warned as an alias, its VALUE dropped

**rework** = clean · **status** = open · **confidence** = 90% (was 85%; raised on measured precedent)

🔴 **.precision note (i010 F18)** — an earlier line here read "`model:` parses" beside
"it has never parsed", a self-contradiction. the exact behavior: `model:` is MATCHED (by
`PATTERN_INLINE`) and WARNED (a `key-alias` advisory that names `brain:` and prints a fix line),
but its VALUE is DROPPED — it never lands in `result.brain`. a driver must rename `model:`→`brain:`
for the brain to take effect. this matches the shipped code (`parseStoneGuard.ts:271-275`) and the
demoed timeline (`case=4` `[t4]`-`[t6]`), and the text below is corrected to say so.

## .the fork, stated fairly

the issue flags the field name as an open question: `brain:` (rhachet's domain term) versus `model:`
(the word on the slash command).

## .taken, and why at the time

**`brain:` is canonical. `model:` is MATCHED and WARNED as an alias that names the canonical word —
and its VALUE is DROPPED, never carried into `result.brain`.**

- `rule.require.ubiqlang` settles the canonical half: one word per concept, and the concept is a
  **brain**. `model:` would be a synonym in a published contract
- `rule.forbid.domain-term-synonyms` settles the alias half. it permits exactly this shape: the
  contract carries the canonical term, and the synonym is **recorded** rather than silently tolerated
- case 4 is the evidence the alias is owed: `/model`, `--model`, and every extant guard's L3 reviews
  all say `model`. the hand reaches for it, and today a hand that reaches for it loses its field in
  silence

## .the counter-case, stated fairly

an alias is a second name for one concept, which is the thing `rule.forbid.domain-term-synonyms`
exists to prevent. a purist read says: one key, `brain:`, and let `F4`'s unknown-key rejection catch
the typo.

⇒ that read is coherent, and it depends entirely on `F4` landing. **if `F4` is rejected, the alias
becomes the only defense against case 4** — so this call is not fully independent of that one.

## .rework, and why

**clean.** to remove the alias is to delete one allowlist entry and one warn branch. no contract
depends on `model:` — it has never parsed.

## 🔴 .the measured precedent — found at self-review r1, and it moves this call

the issue frames its own premise as: *"the only per-brain lever is `--model` on the L3 peer-review
**enroll** commands."* **that premise does not hold against the shipped CLI.**

| the command | measured |
|---|---|
| `rhx enroll --help` | `--brain <brain>` · `--roles` · `--as` · `--no-socket` · `--reason` · `--output`. **no `--model`** |
| `rhx review --help` | `--brain <slug>   brain to use for review (default: fireworks/deepseek/v4-flash)` |

the `$rhx enroll claude --model sonnet` lines the issue cites are real and they sit in **archived**
routes (`.behavior/v2026_06_*`, `v2026_07_*`); they invoke a flag the shipped enroll does not carry.
the engine's own live test guards use the other one — `--brain opus|sonnet|haiku`
(`src/domain.operations/route/.test/assets/route.peer.budget/1.vision.guard:12,17,22`).

⇒ **so the precedent this fulcrum was weighed against is the opposite of what the issue reports.**
rhachet already ships a field named `brain` whose value is a brainslug. `brain:` in a guard is not
a ubiqlang preference over a `model` convention — it **conforms to the extant convention**.

## ⚠️ .the wrinkle the precedent brings with it

`brain` is overloaded inside rhachet itself, and both senses are typed `BrainSlug`:

| the call | what its `brain` means |
|---|---|
| `enroll --brain claude` | a **brain-cli** — `getSupportedBrainCommand` accepts only `claude` / `claude-code` |
| `review --brain anthropic/claude/sonnet` | a **brainslug** |

⇒ the guard field means the **second**, and the contract must say so. this does not change the call;
it adds a documentation obligation, and it is `rule.forbid.domain-term-ambiguity` inherited from a
dependency rather than authored here.

## .confidence, and why 90%

**raised from 85% at self-review r1.** the canonical half is no longer an argument from a rule — it
is a conform to a shipped flag, which is the strongest form this kind of call takes.

the open 10% is the alias half, unchanged: it trades a small ubiqlang impurity for a measured,
silent failure mode. a wisher who weights vocabulary purity above that trade would rule the other
way — and the counter-case above is now **weaker**, since `model:` is not, in fact, the word the
live commands use.

## .where

`1.vision.experience.case=4.the-field-name-is-misspelled.md`.

## .the verdict

open — for the fulcrum council. ⚠️ decide alongside `F4`; the two interact.
