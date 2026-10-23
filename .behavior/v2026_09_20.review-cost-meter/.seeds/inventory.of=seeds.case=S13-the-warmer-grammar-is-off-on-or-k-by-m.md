# seed S13 — the warmer's control surface: `off | on | <k>x,<m>m`, `on` by default

archived verbatim, before distillation (`rule.always.archive-the-wishers-words-verbatim`).

## .the utterance

> and lets ensure that --warmer off|on|5x,10m works (on default = 3x,15m) but it should be
> customizatble

## .what it did

**fixed the whole control surface in one line**, and three of its properties carry weight:

| the clause | what it settles |
|---|---|
| `off \| on \| 5x,10m` | three legal shapes, and `off` is **first** — a spender a driver cannot refuse is one they disable by uninstall |
| `on default = 3x,15m` | 🔴 **ON, by default.** the default is what governs the bill |
| *"but it should be customizatble"* | the pair `<k>x,<m>m` is a driver's to set, never a constant |

## 🔴 .why `on` by default is the sharpest of the three

a warmer a driver must remember to enable runs on the rounds where they **already had cost in
mind** — and never on the eleven-lane guard round they fired and walked away from, which is the
exact case it exists for.

⇒ an opt-in warmer would have been correct in every test and worthless in the field.

## 🟡 .why `<k>x,<m>m` is ONE value and not two flags

the two numbers are not independent: `k × m` is the coverage window, and `m` must stay under the
ttl. split into `--warmer-count` and `--warmer-every`, a driver can set `1x,90m` — one poke past
the ttl, which refreshes no bytes and bills in full.

⇒ one token keeps the pair legible and the invalid combination visible at the call site
(`rule.prefer.prevent-over-correct`). the parser refuses `1x,90m` by name, and says why.

🟡 and the refusal half is the half a unit cannot see — an exit code and a message. it earned its
own acceptance suite, proven red 4-of-6 under a silent fall back to the default.

## .landed in

- `src/domain.operations/review/warmer/asReviewWarmerPlan.ts`
- `src/contract/cli/reviewWarmerFlag.acceptance.test.ts`
- `0.wish.md` bar 13
