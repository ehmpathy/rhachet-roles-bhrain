# F22 — a SAFE ∧ CLEAN fix is deferred because it arrived after the stone had already passed

| field | value |
|---|---|
| `rework` | 🟢 **clean** — one line plus a mechanical resnap, in files this diff authored |
| `triage` | 🔴 **wisher** — a process call, and the one row on this board whose own rule grades the deferral a blocker |
| `confidence` | 🔴 **60%** — the lowest on the board |
| `status` | best-guessed |
| `opened` | 2026-09-19, at `5.3.verification`, after `i004` r006 + r011 raised it independently |

## .the call

> **`route.guard.budget` renders two tree dialects for one command. the fix is one line and the
> reviewers named it exactly. it is CAUGHT rather than made, because the stone had already PASSED
> when the concern was read.**

the dream carries the render diff and the three-step fix:
`.dream/v2026_09_19.fix.the-budget-grant-renders-two-tree-dialects-for-one-command.md`.

## 🔴 .what makes this row different from every other deferral here

| this board's other deferrals | this row |
|---|---|
| `F16`–`F21` fail **CLEAN** on their own merits — blast radius, published briefs, shared harness | 🔴 **passes CLEAN in code.** one `   │` row in `formatBudgetGrantRefusalLines`, a file this behavior authored |
| the rework is dirty | the rework is trivially clean |
| the deferral is about the FIX | 🔴 **the deferral is about the CLOCK** |

⇒ so this row does not say *"the fix is too big."* it says *"the fix is small, and the moment to make
it had already closed."*

## .what was found

**two reviewers, two levels, two rubrics, two brains — one concern, independently:**

| reviewer | level | its words |
|---|---|---|
| `ergo-snapshot-visual-blemishes` | l1 | *"the granted tree separates its groups with blank `│` rows, the refused trees do not"* |
| `enroll-verif-snapshot-blemishes` | l3 | *"renders two tree dialects for one command"* |

🔴 **convergence across isolated lanes is the strongest signal `i004` produced**, and it is the
sharpest argument against this row.

and a second defect rides with it: `asGuardBudgetHeadLines`' docblock claims the blank row is handled
*"on both paths"*, and it is not — a comment that asserts a property the code lacks.

## .the fork, stated fairly

| option | what it does | what it costs |
|---|---|---|
| **A — catch it** (taken) | the concern is recorded with its fix shape; the next change that opens these files carries it | 🔴 a two-dialect render ships, and it was found by two reviewers |
| **B — fix it now** | one line, resnap 4 files, re-run the gates | 🔴 the guard caches on artifact hash ⇒ a sealed route re-opens and buys a fresh **12-reviewer walk (≈40 min)** for a `better`-grade cosmetic row |
| **C — fix it and skip the re-walk** | the code is right and the clock is not spent | 🔴 forbidden. ships bytes no guard approved — a failhide in artifact form |
| **D — fix the docblock only** | the false comment goes, the spacer stays | 🔴 splits one concern across two rounds and leaves the render as found |

## ⚠️ .why it is not 93% — its own rule grades this a BLOCKER

`rule.always.fix-forward-under-scouts-honor` is quoted rather than paraphrased:

> *"when you see a small, safe, clean fix — **do it now. never defer it.**"*

and its enforcement line: *"a small, safe, clean fix seen and deferred = **blocker**."*

⇒ **this row is that blocker, by the rule's own words**, and no read of the two questions rescues it
on size.

**the counter, and it is the whole case:** the CLEAN question asks *"does it ripple into files,
contracts, and callers this change never intended to open?"* — and after passage the answer changes.
a fix that was clean an hour ago now ripples into **a full re-walk of a sealed route**. the fix is
clean in **code** and dirty in **process**, and the rule's two questions were written for code.

🔴 **and the deeper argument is this behavior's own shipped thesis, applied to its author:**

> **inside the budget, `better` is enough. past the budget, only `urgent` is.**

the route author set `--allow-nitpicks 7`; **3 distinct `better` concerns landed.** the floor exists
precisely so a concern beneath it earns no further round. to spend a twelfth-reviewer walk on a
spacer would be the `better`-churn loop this behavior was written to stop, performed by the driver
that shipped it.

⚠️ **a council may fairly call that argument too convenient** — it lets the author cite their own new
rule to excuse a deferral the older rule forbids. that tension is real, it is why this row sits at
60%, and it is the reason it is itemized rather than passed over in silence.

## .what would move it

- a council that rules the **scouts-honor** clause governs process ripple too → **option B**, and the
  re-walk is owed
- a council that rules a passed stone is **re-openable at no ceremony** (the edit does not re-open the
  guard) → B's cost collapses, and the deferral loses its only argument
- 🔴 a **third** reviewer on a later round that raises the same dialect → the concern has outlived one
  full cycle, and A stops being defensible
- a future change that opens `formatBudgetGrantRefusalLines` → the fix rides it in at zero cost

## .see also

`F20` — the other row that defers a defect it could name precisely · `F21` — the same round's
deferral, dirty on its own merits where this one is clean · the dream above ·
`rule.always.fix-forward-under-scouts-honor` — the rule this row is in tension with, quoted above ·
`rule.forbid.snapshot-visual-blemishes` — the rule both lanes cited ·
`rule.always.catch-dreams-for-followups` — *"a dream is the second-best outcome"*
