# seed: the entoolment ladder's rungs are rhachet's determinism spectrum

**2026-08-14. settled the rung names, and settled that every rung is a tool.**

## .said

> hey entool though... arent briefs and skills and routes all tools?

> wait, this is pretty perfect; to **entool** is to raise an artifact toward a single deterministic
> call — one invocation, no brain required. it names a **direction on a ladder**, not a binary
> state: rung 0 (tribal) → 1 (brief) → 2 (fluid skill) → 3 (partial tool) → 4 (tool).

> actually, can we relate that to the rhachet repo readme's declaration of fluid -> rigid -> solid ?
> and all the levels are tools;

> rung 0 as tribal, 1 as brief , 2 as fluid skill, 3 as rigid skill, 5 as solid skill - that sounds
> great

> those sound good

> also, is it clear that routes are rigid skills? i.e., theres determinstic mechanisms that push
> the brains through?

> is that relationship clearly defined ?

> so should we use the emojis from rhachets readme too? e.g., :books: for a brief, :arm: :drop:
> for fluid skill, :arm: :bolt: for rigid skill, etc

> robot arm plz

> actually, yellow arm is good

> what you did is fine

> great even

> a brief may encode anything. its just prethought ; lessons, rules, howtos, whatever a librarian
> may collect

> infact, many solid skills are based on extensive briefs or prior less deterministic skills

## .settled

**1. the challenge, and what answered it.** the first question asks whether `entool` is misnamed —
if a brief and a route are *also* tools, then to reserve "tool" for the deterministic end draws the
line in the wrong place. the answer was already in the term file: `entool` names **a direction on a
ladder, not a binary state**. so the question resolves in favor of the wisher's read — **every rung
is a tool** — and `entool` is the verb for the climb, not for the destination.

**2. the rung names are adopted from rhachet's determinism spectrum**, not coined here:

| rung | was | is |
|---|---|---|
| 0 | tribal knowledge | unchanged |
| 1 | a brief | unchanged |
| 2 | "a fluid skill" | 💧 **fluid skill** — now the cited term |
| 3 | "a partial tool" | 🔩 **rigid skill** |
| 4 | "a tool" | 🪨 **solid skill** |

⚠️ the wisher wrote *"5 as solid skill"*. the ladder has five positions numbered 0–4, and the
sentence lists exactly five names in order, so `5` reads as an off-by-one on the last item rather
than a claim of a sixth rung. taken as **rung 4**.

**3. `partial tool` was the weakest name on the ladder, and rigid replaces it.** "partial" names
what it lacks. "rigid" names what it *is* — *"deterministic entrypoint, mixed operations +
orchestration"* — and it is the word rhachet already publishes.

**4. a route IS a 🔩 rigid skill — and the relationship was NOT clearly defined before this.** the
question *"is that relationship clearly defined?"* had a plain answer: **no.** two artifacts
understated it —

- `philosophy.entoolment-is-the-pinnacle` hedged: *"a route is not a fifth rung… it is what rungs
  1–3 look like when the residual work is irreducibly judgment"*
- `term=route._.choice._.md` framed a route **in contrast to** a tool: *"a tool removes the brain,
  a route removes the wrong turns"*

neither placed it on the ladder. the settled claim is stronger, and it is the wisher's own framing:
**the deterministic mechanisms push the brain through.** the guard refuses, the numeric prefix
computes what is next, the stophook re-emits the current stone, the passage ledger holds state on
disk. a brain does not advance because it chose to — a mechanism advances it, or blocks it.

⇒ **a deterministic transport with probabilistic cargo.** that is 🔩 rigid by definition.

**5. the glyphs are rhachet's too, and they compose.** 🧢 role · 🧠 brain · 📚 brief · 💪 skill,
qualified by 💧 / 🔩 / 🪨. so the ladder reads 🧠 → 📚 → 💪💧 → 💪🔩 → 💪🪨. the compound form
distinguishes *what kind of artifact* from *how deterministic it is*, which the bare determinism
glyph could not.

**6. a 📚 brief is not "the lesson rung" — it is prethought in any shape.** a lesson, a rule, a
howto, an article, a catalog, an inventory, a philosophy, a define, a term cluster. to read rung 1
as *"where lessons go"* splits the ladder into two unrelated columns; it is one axis, and rung 1 is
the first rung where the thought exists **outside a brain at all**.

**7. a higher rung does not retire the rungs below it.** a 💪🪨 solid skill is usually built **on**
extensive briefs and on prior, less deterministic skills. the climb is an accretion, never a
migration — the brief stays, and it is what makes the solid skill legible and maintainable. *"we
entooled it, delete the brief"* is a defect.

## .landed

- `src/domain.roles/learner/briefs/philosophy.entoolment-is-the-pinnacle._.md` — the ladder table,
  the every-rung-is-a-tool claim, and the route-sits-at-rigid resolution
- `src/domain.roles/learner/briefs/rule.always.entool-the-skills-you-touch.md`
- `src/domain.roles/learner/briefs/rule.always.enskill-the-tactics-you-discover.md`
- `src/domain.roles/learner/briefs/im_an.obsessive_learner.md`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=entool._.choice._.md` + `.reason.md`
- `.agent/repo=.this/role=any/briefs/domain.terms/term=enskill._.choice._.md`

## .the source it adopts

`ehmpathy/rhachet`, `readme.md` and
`.agent/repo=.this/role=architect/briefs/domain.thought/define.term.skill.thought-routes.md`:

> three archetypes:
> - 🪨 **solid** = deterministic throughout
> - 🔩 **rigid** = deterministic entrypoint, mixed operations + orchestration
> - 💧 **fluid** = probabilistic throughout
>
> to harden a thought route = to move it toward 🪨 solid on the determinism spectrum

⚠️ **corrected 2026-08-30 — an earlier read of this section misquoted rung 3** as *"deterministic
setup blended with probabilistic thought."* that paraphrase sat inside a blockquote attributed to a
named upstream file, so it read as verbatim and was copied into four downstream briefs before the
source was checked. the words above are rhachet's, unedited.

⇒ and the paraphrase **deleted the word `mixed`** — which is precisely the crystallization model
(*one path whose branches hold different determinism*) that the ladder later had to be corrected to
state. **the misquote cost the concept, not merely the phrase.**
