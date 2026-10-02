# fulcrum F26 — a SPACED guard value offers no derived paste, though a strip would produce a valid literal

**raised** 2026-09-18, on i037 — while the `r011` nitpick.1 repair was built
**rework** = clean · **status** = open · **confidence** = 80%

## .the fork, stated fairly

`r011` nitpick.1 asked that the `key-unreadable` fix line **derive from the refused value** rather
than print a canned example. `asGuardValueRepair` now does that: it strips every character the
allowlist refuses and, where what remains is itself a valid literal, offers it as a paste.

**that rule produces a valid paste for a spaced value, and the arm deliberately refuses to print it.**

| the value | the strip yields | a valid literal? | what the driver reads |
|---|---|---|---|
| `gpt-4o@latest` | `gpt-4olatest` | ✅ | `brain: gpt-4olatest` — the derived paste |
| 🔴 `gpt 4o` | `gpt4o` | ✅ | 🔴 **`brain: gpt`** — the first word, never `gpt4o` |
| `@@%%` | `` | ❌ | the canned example |

| | the choice |
|---|---|
| **taken** | a space is named as its own cause — *"`/model` takes ONE argument, so pick the one you meant"* — and the **first word** is offered |
| **rejected** | run the same strip as every other refused character, and offer `gpt4o` |

## .what was taken, and why

**the argument is that a strip across a space FABRICATES a token no one wrote.**

- `gpt-4o@latest` → `gpt-4olatest` deletes a character the driver typed **by mistake**
- 🔴 `gpt 4o` → `gpt4o` **welds two tokens the driver typed on purpose** into one that no vocabulary
  holds, that the brain-cli will refuse, and that the driver never saw before this halt printed it

⇒ the second is a **fabricated-but-valid** suggestion, and that is the precise shape
`rule.forbid.failhide` names: a surface that answers a real fault with a plausible one. the whole
`key-unreadable` arm exists to name a fault loudly, so an arm that invents a slug to paste defeats
the surface it sits on.

**the second argument is that a space has a DIFFERENT cause from every other refused character.**
`@`, `%`, `!` are typos inside one token. a space says the driver supplied **two** arguments where
`/model` takes one — so the honest fix line is not *"remove the character"*, it is *"pick the one you
meant"*, and the first word is the only part of their intent that survives a one-argument read.

## 🔴 .the counter-case, and it is real

**the strip rule is uniform, and the space arm breaks the uniformity.**

- a driver who repairs `gpt-4o@latest` learns *"the fix line shows my value with the bad part gone"*
- 🔴 that learned rule is **wrong** on the very next halt they hit, and the surface never says so
- ⇒ a rule the driver infers from one arm and that a second arm silently breaks is exactly the
  astonishment `rule.forbid.surprises` grades

and the fabrication argument has a bound: `gpt4o` is not a **random** slug — it is what a driver who
fat-fingered a space instead of a hyphen would have meant, and that typo is plausible on a keyboard
where space sits under the thumb. ⚠️ **so the taken option is wrong for one real input class**, and
the rejected option is wrong for a different one (`claude opus` → `claudeopus`).

🟡 **neither arm is right for both classes**, and the surface has no evidence to tell them apart. the
call is therefore *which wrong answer is cheaper*, and that is a judgment rather than a derivation.

## .why it is clean

one arm of one transformer's caller, plus four rows in `formatGuardParseWarnings.test.ts` `[case6]`.

| | cost of a reversal |
|---|---|
| surface | none — the fix line is stdout, no contract |
| files | `formatGuardParseWarnings.ts` (the space branch), `formatGuardParseWarnings.test.ts` (one row) |
| callers | none — `asGuardValueRepair` already returns `spaced` and would need no change |
| snapshots | none — no acceptance case renders a spaced value |

⇒ `asGuardValueRepair` deliberately returns `spaced` **beside** `repaired` rather than folded into
it, so the caller decides. **a reversal is a branch flip at the one call site**, which is why this is
recorded as a clean best-guess rather than raised as a halt.

## .where

- `src/domain.operations/route/guard/asGuardValueRepair.ts` — the transformer, and the `spaced` flag
- `src/domain.operations/route/guard/formatGuardParseWarnings.ts` — the three-way branch
- `src/domain.operations/route/guard/formatGuardParseWarnings.test.ts` `[case6]` — the four rows
- `…r011._.taken.by_self.ergo-friction-hazards.md` — where the judgment was stated as arguable

## .confidence, and why

**80%.** what is measured: the allowlist's behavior on each input class, that `gpt4o` passes
`isGuardValueLiteral`, and that no vocabulary this repo reads holds it. what is a judgment is the
rank of two harms — a **fabricated slug** against a **broken pattern** — and that rank rests on a
claim about which mistake a driver makes more often, which no one here has counted.

⚠️ **the residual 20% is one specific risk: the fabrication argument may be over-applied.** the
`key-unreadable` arm already prints the refused character explicitly, so a driver who reads
`refused: U+0020 (a space)` beside `brain: gpt4o` is not deceived — the surface named the fault and
then offered a repair. ⇒ **a wisher may fairly rule that the loud refusal already discharges
`rule.forbid.failhide`, and that uniformity is worth more than the fabrication guard.**

## .the verdict, once ruled

*(open)*
