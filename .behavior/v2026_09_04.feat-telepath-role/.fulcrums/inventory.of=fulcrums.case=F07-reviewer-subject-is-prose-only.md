# F07 · the reviewer's subject is prose-only and declared, never inherited

- **rework** = clean · **status** = open · **confidence** = 95%

## .the fork, stated fairly

a route guard's peer reviewers inherit `--diffs since-main` — 117 files and 915.3k tokens on the measured tree. telepath's reviewer either:

| option | shape |
|---|---|
| **inherit** | take the guard's default subject, like every other reviewer |
| **declare** | scope to the prose artifacts telepath actually grades |

## .taken, and why at the time

**declare.**

- telepath grades **prose**. a `.ts` diff is pure overflow risk in its subject and yields no blocker it could act on
- `case=4` establishes the recursion: the reviewer runs on the stones that emit the largest yields, so an inherited subject overflows exactly where the reviewer matters most
- measured: `.behavior/` was **51.7%** and `src/` **46.2%** of one overflowed subject. a prose-only scope drops the second outright

## .why this escapes the trap that makes the same fix wrong elsewhere

`rhachet-roles-bhrain#423` warns explicitly against the reflex `--paths-wout '.behavior/**'`:

> *"a blanket `--paths-wout '.behavior/**'` would repair the overflow and break the convergence loop in the same stroke — a cure that removes the mechanism it was called to protect."*

the reason is that a reviewer re-reads with your `.taken` articulation AND your diff in context, so the route artifacts are load-bear input to the reviewers that raised the points.

🟡 **telepath's reviewer is the one case where that does not apply, and the direction is the opposite of the warned fix:**

- #423 warns against a scope that *omits* `.behavior/` — telepath's scope *keeps* it and drops `src/`
- telepath grades the yield rather than the code fix, so it holds no code diff
- its `.taken` trail is prose, which stays in scope by construction

⇒ so this is a per-reviewer scope, never a blanket rule. it must be declared on telepath's reviewer alone and must not be generalized to the others.

## .rework, and why

**clean.** a scope is a glob in a guard's review block.

## .the source read that raised this to 95% — done 2026-09-04

the confidence sat at 90% on one open question: *does the guard admit a per-reviewer scope override, or does it hardcode the subject?* three source reads answer it, and the answer is **the scope is declared, never hardcoded**:

| evidence | what it shows |
|---|---|
| `getUnknownGuardVars.test.ts:93` | a guard's `run:` line is literally `$rhx review --diffs since-main --conversation $conversation --output "$output"` — ⇒ **the flags live in the guard's declared command string**, not in the engine |
| `genReviewRubricCmd.ts:25,44-45` | `diffs: string \| null`, and the flag is appended **only** `if (input.diffs !== null)` — ⇒ omittable by contract |
| `review.by.ts:271-272` | `paths` and `diffs` both forward as `options.X ?? null` — ⇒ a reviewer's own flags reach the review unchanged |

⇒ so *"the guard hardcodes `--diffs since-main`"* is **true of the extant guard files and false of the guard engine.** the default is a convention each guard restates in its own `run:` line, so a telepath reviewer declares `--paths` and omits `--diffs` with **no guard change at all**.

🟡 this is the exact claim §7 named as owed and #423 flagged as *"evidence with a citation, not a source read."* it is now a source read.

## .confidence, and why it is not 100%

95%. what remains is not the mechanism but the **glob**: the precise `--paths` pattern that keeps `.behavior/` prose in scope while it drops `src/` is unwritten, and `case=8`'s `[t4]`→`[t6]` conflict shows that pattern is where the real risk sits — narrow it wrong and the overflow closes while the `.taken` convergence loop silently breaks.

⇒ **the risk moved from "can it be declared?" to "is the declaration right?"** — a smaller and far more checkable question, and one `5.3.verification` can measure.

## .where

- `1.vision.experience.case=4.the-cure-catches-the-disease.md` — the recursion and the measured composition
- `rhachet-roles-bhrain#423` — the trap this deliberately steps around

## .the verdict

_unruled._
