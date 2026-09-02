# fulcrum F18 — the dark-review-lanes eject was adopted verbatim, not repaired

## .the plain version

> **a seed said "go fetch that file, it teaches X." the file actually teaches Y. i fetched the
> file — correctly. so we now hold Y, and X was never written down by anyone.**

| | the claim | is it valuable? |
|---|---|---|
| **X** — what seed #369 *said* the file teaches | *a small fix does not re-run every reviewer; the guard remembers the clean ones.* ~815s measured | 🔴 **yes.** it saves real time on every drive |
| **Y** — what the file *actually* teaches | *when a reviewer crashes on an oversized prompt, re-run it by hand on fewer files* | a workaround for a guard defect |

⚠️ **and one word means different things in each**, which is why a read of the file feels wrong:

- in **X**, a `dark` lane = one whose **old verdict is stale** and should be redone
- in **Y**, a `dark` lane = one that **crashed and produced no verdict at all**

⇒ so the file reads as though it answers a question it does not answer. **that is the whole
"seems weird."** the file is fine; the seed's summary of it was not.

## ✅ .this is now RESOLVED — see F25

three of the four repairs below were done on 2026-08-30:

| repair | status |
|---|---|
| split the attribution half into a `hazard.*` | 🔴 **done, then UNDONE.** the hazard does not exist — `getAllFileDiffsFromRange.ts:70` already uses `git merge-base`. brief deleted; see **F27** |
| write the lost rule **X** | ✅ `howdoes.the-guard-caches-a-clean-lane-by-artifact-hash.md` — **and a read of the source refuted the seed a second time**; see F25 |
| catch a dream for the guard defect | 🔴 **withdrawn.** there is no guard defect — the fix the dream asked for is already in the code |
| rename `dark` / `lane` | ⏸️ deferred — both undeclared, and `dark` already carries the two senses above |

⇒ **the record below is kept as it stood on 2026-08-29**, before the repair. it is the reason the
repair happened, and to rewrite it would lose that.

---

| field | value |
|---|---|
| **the fork** | A: copy `ehmpathy/rhachet`'s file verbatim into the driver, per seed #369 · B: write the rule the **seed's summary** describes · C: adopt, then split and rename |
| **taken, and why** | **A.** the file is the authority over a seed's paraphrase of it, and the eject asked for a move rather than an authorship |
| **rework** | **clean** — a split is two files from one; a rename is a filename plus its citations |
| **status** | best-guessed — 🔴 **the wisher has since read it and called it weird** |
| **where** | `src/domain.roles/driver/briefs/rule.always.rerun-dark-review-lanes-scoped.md` |
| **confidence** | **~55%** |

## 🔴 .the seed and its own source describe DIFFERENT rules

seed #369's `## what it says`:

> *when a src change is narrow, re-run only the lanes it could have darkened — scoped, not the full
> ladder. **the guard caches terminal verdicts**, so a scoped re-arrival costs the affected lanes
> and no more.* ~815s of reviewer time, not a full ladder.

the file it points at makes a different claim. **both key words shift sense:**

| word | in the seed | in the file |
|---|---|---|
| `dark` | a lane whose **cached verdict your change invalidated** | a lane that **never rendered a verdict** — a context overflow |
| `scoped` | narrow the **set of lanes** you re-arrive | narrow the **set of files** inside one rubric |

⇒ fetched from `ehmpathy/rhachet` this round: **the file is verbatim what i copied.** so the eject
is faithful and **the seed mis-summarized its own source** — the same defect round 10 recorded, a
paraphrase trusted because it sat under an attribution.

⚠️ **and the seed's rule is written nowhere.** selective re-arrival against a verdict cache, with
~815s of measured evidence, is the more valuable of the two and it was silently lost.

## .the three defects in the file as adopted

1. **it is two rules.** `.then check attribution per file` — *a since-main diff on a zero-commit
   branch renders main's code as your deletions* — bears no relation to darkness or re-runs. it
   fires on **any** since-main lane, clean ones included. `.enforcement` grades them as two
   independent blockers, which is the tell
2. **it institutionalizes a workaround.** its own `.what` says *"it is a scope problem in the
   guard's own configuration"* — a diagnosed guard defect — then teaches drivers to hand-route
   around it forever. `rule.always.entool-the-skills-you-touch` names exactly this, and **no dream
   proposes that the guard accept a narrowed scope**
3. **`dark` and `lane` are undeclared.** both sit in the filename; the glossary's
   `term=route.guard.review.*` cluster has `tallier`/`clearance`/`overrule`/`terminal`/`vibe` and
   no `lane`

## .the case FOR the call

the eject seed said *move it*, and a driver who rewrites a peer repo's rule while it moves it has
done authorship under cover of a transfer. **the file's own words were the safest cargo to carry**,
and a repair is a legitimate follow-on rather than a precondition.

## .what a repair looks like

| move | artifact |
|---|---|
| **split** | eject the attribution half to `hazard.since-main-diff-on-a-behind-branch.md` — it is a diagnostic read *after* the fact, not a cue read *before* |
| **write the lost rule** | the seed's actual claim: selective re-arrival on a verdict cache |
| **catch a dream** | the guard should take a narrowed scope; the hand re-run is the symptom |
| **rename** | `dark` and `lane` want declared words |

⇒ all four are additive. **the rework stays clean** whichever way the wisher rules.
