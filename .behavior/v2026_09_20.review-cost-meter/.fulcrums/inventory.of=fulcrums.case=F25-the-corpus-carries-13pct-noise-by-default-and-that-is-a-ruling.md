# F25 — the corpus carries 13.9% noise by default, and to leave it is a RULING

- raised 2026-09-24, by the sweep this index prescribes
- rework: clean / 🔴 dirty — one mechanism, but it moves every compiled-prompt snapshot
- status: ✅ **RULED 2026-09-24 — option A, and the deferral was overruled outright**
- confidence: 🟡 **80%** that the measurement holds · 🔴 **50%** that the deferral was right
  — ⇒ **the 50% was the honest half.** the wisher ruled against it within hours

## ✅ .what was ruled — 2026-09-24

**option A**, plus three acts this row did not ask for:

| ruled | beyond what this row proposed |
|---|---|
| ship the exclusion set | ✅ as row A |
| **enbrief + enrule it** | this row proposed a code change alone |
| **prove with tests that it ran** | this row proposed no clamp |
| widen to seed `S8`'s G3 in the same act | this row called G3 *"the general form"* and left it out |

⇒ the last is the one this row got wrong on its own terms: it **named** G3 as the general form,
**named** G3's gap (route-scoped, so it cuts the symlink and keeps the original), and then scoped
itself to the narrow half anyway. the merge is what the row's own `🟡` note about *"ONE mechanism,
ONE change"* already implied.

## 🔴 .and it uncovered a fork this row never saw — see `F26`

the allowlist deletes the scope of any lane that reviews **a route's own deliverable**, and
**78 binds across 38 guards** do exactly that. this row's whole frame was *"a route's paperwork
is noise"*; it never asked what happens to the lane whose SUBJECT is that paperwork.

## .the fork

every review prompt carries bytes a reviewer cannot use. measured on the largest real prompt
on disk (2,507.7k chars, 251 target files):

| polluter | chars | % of prompt |
|---|---|---|
| `.dream/**` — the repo-root queue | 185.2k | 7.4% |
| `**/dreams/**` — the route's symlinks to those same files | 131.2k | 5.2% |
| `pnpm-lock.yaml` | 31.4k | 1.3% |
| **total** | **348.0k** | **13.9%** |

🔴 **the two dream buckets are the SAME BYTES.** all 22 slugs appear under both names, because
the walk follows a symlink and counts the target twice. that is the same defect class as the
new-file diff (lever B, already shipped): one payload, two carriers — and it grows with every
dream caught.

⇒ the fork: **ship a default exclusion set now, or run another round at 13.9%?**

## .what was best-guessed, and why

**leave it.** the dream answers SAFE — no and CLEAN — no:

- **SAFE** — it changes what `rhx review` SENDS, so every compiled-prompt snapshot moves, and
  the corpus a reviewer already saw is no longer the corpus it would see. `5.3.verification`
  holds a **passed stone** whose review evidence was gathered against the current corpus
- **CLEAN** — it reaches the target join, `stepReview`, the composition census (an excluded
  count is a new row), and every snapshot of the three

🟡 **and all three exclusions are ONE mechanism, so they must ride as ONE change.** to drop the
lockfile now and the dreams later moves the same snapshot set twice for one net effect.

## 🔴 .why this is a RULING and not merely a deferral

the rule is explicit — *"a dream alone reports the work and hides the call"*. the call hidden
here is not *"we owe an exclusion set"*. it is:

> **someone judged it acceptable to spend 13.9% of every lane's prompt on bytes no reviewer can
> use, for at least one more round, across 11 lanes.**

that is the wisher's to rule on, and it had no row until now.

## 🟡 .the one real quality cost, and why it is not free either way

`rule.always.catch-dreams-for-followups` is a **gradeable rule**, and its blocker list includes
*"a followup mentioned and never caught"*. **a reviewer that cannot read the dream cannot grade
that clause.**

⇒ so the exclusion cuts bytes AND cuts one rule's evidence. the mitigation is an override: the
lane whose rubric grades dream discipline names `.dream/**` in its `--paths` and pays for it
deliberately. **one lane at 7.4% is a very different bill from eleven lanes at 7.4%.**

🟡 the honest frame is not *"dreams are noise"*. it is *"dreams are evidence for ONE rule, and
every other lane pays for them."*

## .what would settle it

| option | what it costs |
|---|---|
| **A** — ship the exclusion set, re-snap, opt the dream-grader lane back in | one snapshot sweep; `5.3`'s evidence is re-gathered |
| **B** — leave it, re-row next drive | 13.9% × 11 lanes × every round, and it grows with each dream |
| **C** — drop `pnpm-lock.yaml` alone | 🔴 **rejected** — same snapshot sweep for 1.3% of the benefit |

⇒ **C is the one that tempts and the worst one**, because it pays the whole SAFE cost for a
tenth of the CLEAN benefit. that is the argument for A-or-B and no middle.

## 🟡 .the bound — this is the SMALL half of the pollution question

what this fork leaves in place, measured:

| bucket | chars | verdict |
|---|---|---|
| `__snapshots__/**` | 162.2k | 🟡 genuinely reviewable — snapshots encode behavior. but they are GENERATED |
| route `appendix/`, `blocker/`, `.route/`, `refs/` | 67.0k | seed `S8`'s G3 allowlist covers these; this fork does not |
| `.reviews/peer/**` | 0 here | 🔴 the sharpest quality claim on the board, and it did not fire in this prompt. a lane that reads other lanes' verdicts treats them as evidence — which would make nine independent verdicts less independent than they appear. it wants a GUARD, never a byte measurement |

⇒ **seed `S8`'s G3 is the general form of this fork**, and it has a gap this one exposes: G3's
allowlist is scoped to route artifacts under `.behavior/`, so it cuts the SYMLINKED dream and
keeps the `.dream/` original — **the wrong half of the pair.**

## .see also

- `.dream/v2026_09_24.feat.the-review-corpus-has-no-default-exclusion-set-so-dreams-and-a-lockfile-ride-in.md`
- `src/domain.operations/review/getAllTargetsJoined.ts` — where the exclusion belongs, after the
  join, so `--diffs` and `--paths` are filtered alike
- `src/domain.operations/review/enumFilesFromGlob.ts` — the extant negative-pattern mechanism,
  and why it reaches only one of the two sources
- `.seeds/inventory.of=seeds.case=S8-three-goals-for-what-the-review-prompt-carries.md`
