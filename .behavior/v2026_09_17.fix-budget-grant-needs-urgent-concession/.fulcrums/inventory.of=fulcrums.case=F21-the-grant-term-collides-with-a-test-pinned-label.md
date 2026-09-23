# F21 — the `grant` term forbids two words the halt renderer pins, and the collision is left to a dispute

| field | value |
|---|---|
| `rework` | 🔴 **dirty** — ~90 sites, 8 of them briefs that publish to other repos, plus three test clamps |
| `triage` | 🔴 **wisher** — a scope call, `F13`'s shape |
| `confidence` | 🟡 **70%** |
| `status` | best-guessed |
| `opened` | 2026-09-19, at `5.3.verification`, after `i004/r001` raised it as two nitpicks |

## .the call

> **the term cluster this route authored declares `increase` and `topup` forbidden synonyms of
> `grant`, and published cli copy ships both. the collision is RECORDED as a dream and left to a
> dated `.disputes` entry, rather than settled by a rename in this behavior.**

the dream carries the full evidence:
`.dream/v2026_09_19.fix.the-grant-term-forbids-two-words-the-halt-renderer-pins.md`.

## .what was found

| fact | the evidence |
|---|---|
| both words are on the forbidden list | `term=route.guard.budget.grant._.choice._.md:6-11` |
| both ship in **contract-tier** bytes | `formatBlockRemedyGroups.ts:95` · `route.ts:2330` · `formatBudgetGrantRefusalLines.ts:20` · `route.guard.budget.sh:6` |
| 🔴 `increase budget` is **pinned as canonical by an extant test** | `formatRouteDriveHalts.test.ts:118` — *"the term is `increase budget`, never a second word for it"* |
| two **negative** clamps depend on the exact string | `formatRouteDriveHalts.test.ts:92` · `stepRouteDrive.integration.test.ts:481` |
| the surface, measured | `rhx grepsafe --pattern 'increase budget\|top-up\|topup\|Topup'` → **43 in `blackbox/`**, **~47 in `src/`** |

🔴 **the pin is what makes this a dispute and not a typo.** the codebase had already declared
`increase budget` the one word for its concept and clamped it; this route declared the opposite. two
declarations, one concept, each with a test or a glossary entry behind it.

## .the fork, stated fairly

| option | what it does | what it costs |
|---|---|---|
| **A — two concepts, qualify** (best guess) | `grant` = the gate's verdict; `increase budget` = the remedy label a driver reads. each under its own boundary | the forbidden list drops `increase`; a `.see also` records the split. 🟡 a reader may fairly call this a post-hoc rescue of a word the author already rejected |
| **B — one concept, `grant` wins** | the canonical word is enforced everywhere | 🔴 ~90 sites, **8 published briefs**, and three assertion flips — `rule.require.review-test-changes` grades an unasked assertion change a red flag |
| **C — one concept, `increase` wins** | the term cluster is amended down to the gate-verdict sense | 🔴 discards a term cluster the route built its whole vocabulary on |
| **D — settle it now, in this behavior** | the collision closes in the round that opened it | 🔴 an execution-grain sweep inside a **verification** stone, which `rule.require.review-test-changes` forbids by name |

## ⚠️ .why it is not 93%

**the rule this defers grades the class a blocker in published interfaces.**
`rule.forbid.domain-term-synonyms`' enforcement line reads: *"a synonym of a declared term used in a
dobj/dop name, an internal contract, or a **published external interface**."* ⇒ this row leaves a
blocker-class violation on a shipped surface.

the counter, and a council may fairly reject it: the same rule offers the escape valve in the same
breath — *"adhere, or **dispute**"* — and explicitly leaves the extant set alone (*"left in place
until disturbed — no forced mass-rewrite"*). the reviewer that found it graded it a **nitpick** for
the same reason, and named the two-concept option as plausible in its own words.

🔴 **and the defect is the route's OWN**, which cuts both ways: it is a worse row to defer, and it is
the strongest evidence that the term was coined without a sweep of the surface it governs.

## .what would move it

- a council that rules **A** → the forbidden list is amended, and the row closes at near-zero cost
- a council that rules **B** → the sweep becomes a deliverable, and it is a behavior of its own
- a reader who finds a **third** pinned site → the pin argument strengthens, and A gets cheaper
- a future change that opens `formatBlockRemedyGroups` for another reason → the fix rides it in

## .see also

`F13` — the scope-call shape this shares · `F17`, `F16`, `F18`, `F19`, `F20` — the same shape, this
route's other deferrals · the dream above · `rule.forbid.domain-term-synonyms` ·
`rule.forbid.domain-term-ambiguity` — the **split vs qualify** sort that points at option A ·
`howto.domain-term-disputes` — the entry shape the fix takes
