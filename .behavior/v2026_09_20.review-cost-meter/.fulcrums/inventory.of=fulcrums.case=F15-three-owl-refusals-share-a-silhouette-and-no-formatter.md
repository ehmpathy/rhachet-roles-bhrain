# F15 — three owl refusals share a silhouette and no formatter

- raised 2026-09-22, by `enroll-impl-arch-defects` (B), at i015
- rework: **clean**
- status: 🔴 **OPEN** — best-guessed as *leave them apart*
- confidence: **99% / 82%**

## .the fork, stated fairly

three operations across two files each print an owl-prefixed refusal and then halt:

| operation | where |
|---|---|
| `emitReviewRefusal` | `src/domain.operations/review/emitReviewRefusal.ts` |
| `exitOnValuelessFlag` | `src/contract/cli/review._.cost.ts:187` |
| `exitOnEmptyCorpus` | `src/contract/cli/review._.cost.ts:229` |

🔴 **and `emitReviewRefusal`'s own doc-comment name-checks `exitOnEmptyCorpus`** as *"the shape a
sibling file was already folded for"*. so the author saw the analogy, folded **within** each file,
and stopped at the file boundary — the same half-fold shape `F5` and `F8` already carry.

the lane's proposal: one `emitOwlRefusal({ headline, lines, exit })` shared by both files.

## 🔴 .why the best guess is to LEAVE them apart

read side by side, the three agree on one glyph and disagree on everything else:

| | header | halt glyph | body | terminus |
|---|---|---|---|---|
| `emitReviewRefusal` | **two** lines — `🦉 woah there`, then blank | ✋, on its own headline | caller's `lines[]`, verbatim | **returns** |
| `exitOnValuelessFlag` | **one** line, interpolated | none | a fixed four-row tree | `process.exit(2)` |
| `exitOnEmptyCorpus` | **one** line, interpolated | none | variable `deets[]` + `why` + `fix` | `process.exit(2)` |

a merged operation needs **five** knobs — `header`, `wrapHeader`, `halt`, `lines`, `exit` — to serve
**three** call sites. that is the exact silhouette `rule.prefer.wet-over-dry` grades a blocker:

> abstraction with switches or many optional params = **blocker**

⇒ so the merge the lane asks for would itself be a rule violation, one rule over.

### 🟡 and the two frames are different speech acts, on purpose

`emitReviewRefusal` **returns**, because its five call sites disagree on what follows — four raise a
`BadRequestError` and one emits a scope dump beneath. its own `.note` says so. the two `exitOn*`
operations **terminate the process**, because an argv defect has no continuation.

*the repo refuses your review request* and *this CLI refuses your argv* are not one act rendered
twice. a shared frame would have to carry the difference as a flag, which is the knob count above.

### 🟡 the narrow version fares worse, not better

a shared **glyph constant** sounds cheaper than a shared formatter. it is not:

- `HEADER_OF_REVIEW_REFUSAL` is `'🦉 woah there'` — not the prefix either `exitOn*` uses
- the only literal genuinely in common is the bare `🦉`
- 🔴 and `🦉` opens **~30 files** repo-wide — every stdout surface this repo owns

⇒ a constant extracted for 2 of ~30 sites is a half-fold that makes the inconsistency the lane
raised **worse**, because it creates two ways to write one glyph where there was one.

## .rework, and why

**clean.** all three are leaf render operations with no caller that depends on their internals. a
merge is a local change at any later date, and no artifact on this branch forecloses it.

## .confidence, and why

**99% that the observation is correct** — the three operations were read line by line, and the
`emitReviewRefusal` doc-comment name-check is verbatim.

**82% that "leave them apart" is right.** the knob count and the two-speech-acts argument are both
solid. what pulls the other way is real: the lane is correct that a glyph swap is now a three-file
edit, and `define.bhrain-repo-mascot` does ask for one voice. the honest shape of a future repair is
probably **repo-wide** — one refusal frame for every surface, not a two-file merge — and that is a
scope no execution stone should open.

## .where

- `src/domain.operations/review/emitReviewRefusal.ts` — the two-line frame that returns
- `src/contract/cli/review._.cost.ts:187` — `exitOnValuelessFlag`
- `src/contract/cli/review._.cost.ts:229` — `exitOnEmptyCorpus`

## .the verdict, once ruled

> _unruled._
