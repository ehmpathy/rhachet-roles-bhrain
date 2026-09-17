# fulcrum F13 — an ungrouped reviewer beside a bounded group defeats the valve, and no tool can catch it

- **case** = F13
- **title** = an ungrouped reviewer beside a bounded group defeats the valve, and no tool can catch it
- **rework** = **clean**
- **status** = **OPTION G LANDED 2026-09-13** — the hazard is unchanged and **no longer silent**: an author is warned at the pour, and decides. widened three times: G at i005, H at i006, H extended to acceptance grain at i007; **G landed at i008 r010**. option **D** alone stays for the council
- **confidence** = **92%** — raised from 84%, and **only because the taken option CHANGED**
- **raised** = 2026-09-12, at i003 r011 (`enroll-impl-arch-defects`, point A)

⇒ **the per-round derivation refs out** — how the option set widened twice, how the number held at 84%
for three rounds, and both teeth runs: `.agent/.notes/fulcrums.case-archaeology.md`, `# F13`.

## 🔴 .the hazard, and it is real

verified against the repo's own concurrency fixture. `route-peer-concurrency/1.vision.guard` puts three
l3 reviewers in `group: serial` at `concurrency: 1` — the wish's literal *"l3 is 1 at a time"*.

add a fourth reviewer at level 3 and forget `group: serial`:

```yaml
    - slug: l3-d
      run: …
      level: 3          # ← no group:
```

⇒ it joins no group, so `runWithinConcurrencyBounds` pours it through the **level** bound alone —
`DEFAULT_LEVEL_CONCURRENCY = 10`. **it runs alongside whichever `serial` member is in flight**, so the
provider sees two concurrent calls where the author declared one.

🔴 **and the author reads their file back and sees a cap.** that is F1's own disqualifier —
*"a safety valve that FAILS OPEN is worse than no valve"* — and it arrives by a route F1 never
enumerated: not a bound at an unreadable key, and not a bound at a phantom level, but a **membership**
that was never written down.

## 🔴 .the option set, walked BEFORE the pick

| # | the option | verdict |
|---|---|---|
| A | a first-class `levels: { N: { concurrency } }` bound | 🔴 **refused — seed S4.** a bound belongs to a ratelimit, never a rung; and a separate map can name a **phantom** level |
| B | refuse a level that MIXES grouped and ungrouped reviewers, at parse | 🔴 **refused — it would reject legitimate guards**, and `[case4]` proves the mixed shape correct |
| C | **warn** on a mixed level, at parse | 🔴 **no channel** — and its flaw was named correctly at i005; **G is its repair, so C is superseded rather than revived** |
| D | require `group:` on every reviewer, with an explicit `group: none` opt-out | 🔴 **dirty.** decidable at parse, and it breaks every guard in the org |
| E | render each lane's **effective bound** in the guard tree | 🔴 **not clean in this diff** — it moves the render path and re-baselines the oracles acceptance 2 froze |
| **F** | **document the check on the `group:` key itself** | ✅ **taken, i003** |
| **G** | **advise on a mixed level at the POUR, never at parse** | ✅ **taken and LANDED, i008.** strictly better than C: no signature change, fires only on a real pour, and fires when the hazard costs money |
| **H** | **CLAMP the hazard, and mitigate it not at all** | ✅ **taken and landed, i006 + i007.** orthogonal — it composes with whichever of F/G/D wins |

## 🔴 .the measured fact that prices a whole CLASS out

`[case4]`'s starvation-freedom **guarantee** and `[case6]`'s **hazard** read off the identical number,
from one line — `if (!input.group) return await input.level.schedule(input.run)`.

⇒ **any close that touches that reach trades a ratelimit leak for a throughput defect**, and at
acceptance grain it is not a trade at all: a `byGroup` map is **guard-wide**, so one group at
`concurrency: 1` would serialize every ungrouped lane at **every** level — **acceptance criterion 1
destroyed outright**, measured at **6 clamps red**.

🔴 **so G and D are not merely the survivors of a trade — they are the only two options that remain
implementable at all**, because they are the two that leave that reach alone.

## .taken, and why

🔴 **F + G + H** — the doc, the advisory at the pour, and the clamp. **three composed options, never
one**, and that is the shape this row converged to rather than the shape it opened with.

and F's reason is not cost — B and C are each refused by the **same premise that created the term**:

> seed **S4**: *"only the guard author knows which reviewers share a ratelimit."*

🔴 **a parser that flagged a mixed level would infer exactly what S4 says it cannot infer.** it would
have to guess that two reviewers at one level share a resource, from a file that does not say so —
and it would guess wrong on every legitimate mixed level.

⇒ so the hazard is **undecidable by construction**, not merely unmechanized today. that is what makes
F the honest option rather than the lazy one: the check belongs to the author because the *knowledge*
does.

## .rework, and why it is CLEAN

a doc block, an advisory on stderr, and two clamps. every option A–E remains additive, and none is
foreclosed — F consumes no key, no flag, and no render slot. a council that prefers D can take D and
keep the doc.

## 🟡 .confidence — 92%

the whole of the original 16% was one doubt about F's **instrument** (a principle read at the moment
the key is *present*, `d = 0.05`), and G discharges exactly that doubt — a cue at the moment of use,
`d = 0.65`.

⚠️ **the residual 8% is NOT the old doubt.** it is narrower: an advisory **informs**; it does not make
the leak unexpressible. an author who reads the warn and shrugs is still exposed, and only **option D**
closes that. ⇒ the exposure is unchanged; what changed is that it is no longer silent.

## .where

- `src/domain.objects/Driver/RouteStoneGuard.ts` — `RouteStoneGuardReviewPeer.group`, the `.hazard` block
- `blackbox/.test/assets/route-peer-concurrency/1.vision.guard` — the fixture the hazard was verified against
- `src/domain.operations/route/guard/parseStoneGuard.ts` — `assertConcurrencyGroupsResolve`, which catches the two **decidable** shapes and cannot catch this one
- `.seeds/inventory.of=seeds.case=S4-only-the-guard-author-knows-which-reviewers-share-a-ratelimit.md` — the premise that refuses B and C
- `src/domain.operations/route/guard/review/runWithinConcurrencyBounds.test.ts` `[case6]` — **option H at unit grain**; `[case4]` — the **guarantee** that reads off the identical number
- `blackbox/driver.route.peer-concurrency.acceptance.test.ts` `[t5]` — **option H at acceptance grain**, and **option G's entire teeth**
- `src/domain.operations/route/guard/review/getAllConcurrencyGroupLeaks.ts` — **G's detector.** three of its nine cases exist to keep the advisory off a correct guard
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — **G's wire**, at the pour before the level loop. on **stderr**, so the 36 stdout oracles cannot move

## .what would overturn it

🔴 **a MEASUREMENT, and it is the census shape F10 closed itself with:** walk every `.guard` in the
org and count the levels that mix grouped and ungrouped reviewers.

| the census says | then |
|---|---|
| **zero** mixed levels exist | B becomes free — refuse the shape, since no extant guard needs it |
| mixed levels exist and each is **legitimate** | F stands, and D is the only upgrade |
| a mixed level exists that is a **real omission** | 🔴 the hazard has shipped, and D's price is paid by the incident rather than by the council |

⚠️ **it was deliberately not run this round**, and the reason is honest: **no guard in the org declares
a concurrency group yet, because the key ships with this feature.** the census would return `0 of 117`
and that zero would mean *"nobody has had the chance"*, never *"the shape is unused."*

⇒ 🔴 **so the census is owed by the FIRST ROUND after adoption**, and it is stated here so that round
does not re-derive the question. it is the F10 shape with a start date rather than the F2 shape.

## 🔴 .what the council now rules on — the shortlist is ONE

| the option | the council's question |
|---|---|
| **F** · **G** · **H** | ✅ **settled, and each asks the council naught** — every one is additive and forecloses no option, D included |
| 🔴 **D** — require `group:` on every reviewer | 🔴 **the only live call.** is the org-wide break worth a parse-time guarantee, now that an advisory already informs? |

⇒ **G, now landed, REPRICES that question rather than merely narrows the board:**

| before G | after G |
|---|---|
| the author is told **naught** at runtime ⇒ D buys the author's first warn | the author is **told** ⇒ D buys only the **refusal**, never the information |

⚠️ **so D's case is materially weaker than it was**, and that is the honest report rather than an
argument against it: what D still uniquely buys is that the leak becomes **unexpressible**, which an
advisory cannot deliver at any price.

## .the verdict, once ruled

| option | verdict | ruled by |
|---|---|---|
| **F** — the doc | ✅ taken, i003 | driver |
| **H** — the clamp, two grains | ✅ taken, i006 + i007 | driver |
| **G** — advise at the pour | ✅ taken, i008 | driver |
| 🔴 **D** — require `group:` everywhere | 🔴 **unruled** | **the council** |

⇒ **that split is the rule at work rather than a convenience.** F, G, and H are each **additive** —
they add information and refuse no guard — so `rule.always.fix-forward-under-scouts-honor` puts them
in a driver's hands. **D breaks every guard in the org**, which is exactly the dirt that reserves a
call for the wisher.
