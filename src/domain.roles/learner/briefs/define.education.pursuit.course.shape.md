# define.education.pursuit.course.shape

the argument behind the course template that `rhx education.pursuit.course init` writes.

## .what

a course is ten stones, in four movements: **aim the outcome, take in the canon, make it the
role's own, prove it moved.**

```
course=$k.$slug/
├─ 1.1.outcome.declare     # what the role must DO after; the assessment tasks; the pass bar
├─ 1.2.outcome.baseline    # a cold-booted role attempts those tasks now (pre-test)
├─ 2.1.greats.aim          # the canon that closes the gap the baseline showed
├─ 2.2.greats.read         # kernels, each cited to a page; claims tagged
├─ 3.practice.vitro        # whole, varied tasks; each claim held / refuted / untested;
│                          #   refuted or untested → back to 2.2, then retest
├─ 4.1.entool.blueprint    # each brief traced to a held claim AND to an outcome
├─ 4.2.entool.execute      # briefs + skills in the learner layout, in the role's boot
├─ 5.1.outcome.assess      # a cold-booted role reruns the same tasks + one real held-out task;
│                          #   below the bar → back to the weakest phase
├─ 5.2.outcome.reflect     # intended vs actual, why, keep vs change; feeds the pursuit review
└─ 6.exit                  # back to the pursuit
```

## .why this shape — six things nearly every course model shares

| # | what the canon holds | stone | models that hold it |
|---|---|---|---|
| 1 | state the outcome, and how it will be assessed, before any content | `1.1.outcome.declare` | backward design [1], kirkpatrick [10], gagné [4], addie [13] |
| 2 | find what the learner already knows | `1.2.outcome.baseline` | merrill (activation) [2], gagné (recall prior) [4], addie (analysis) [13] |
| 3 | show the expert model | `2.1.greats.aim` · `2.2.greats.read` | merrill (demonstration) [2], cognitive apprenticeship (modeling) [5] |
| 4 | practice on whole, realistic tasks, with feedback, until mastery | `3.practice.vitro` | 4c/id [3], deliberate practice [7], mastery model (corrective + retest) [6] |
| 5 | assess apart from practice, more than once | `5.1.outcome.assess` | gagné [4], kirkpatrick levels 2–3 [10], twi (follow up) [12] |
| 6 | transfer to real work, then reflect | `5.1` (held-out task) · `5.2.outcome.reflect` | merrill (integration) [2], cognitive apprenticeship (reflection) [5], after action review [11] |

the entool movement (`4.1`, `4.2`) is where this repo parts from the human canon, on purpose: a
person keeps a lesson in memory; a role keeps it only in its boot. so the course must write the
lesson down as briefs and skills (`philosophy.entoolment-is-the-pinnacle._`), and the blueprint
traces each one to a held claim, so no refuted claim ever enters the boot.

## .why each split sits where it does

- **outcome before greats** — without a declared outcome, the read has no stop rule and the
  assess has no bar [1][10]
- **baseline before greats** — without it, the post-test cannot part what the course taught from
  what the role already knew [2][4]. the baseline also aims the canon: read for the gap
- **aim before read** — choose the canon before a search result chooses it for you
  (`rule.forbid.websearch-and-webfetch`)
- **read is not the main act** — reread and summary rank low unless a test follows; practice
  tests and spaced practice rank highest [8]. so the read feeds vitro, never stands alone
- **claims, not all kernels, go to vitro** — a kernel that defines cannot be refuted
  (`term=doc.kernel`, `term=doc.kernel.claim`)
- **loops back, not one-way** — the mastery model's gains come from corrective work and retest
  [6]; vitro and assess each send the role back to the weakest phase
- **blueprint before execute** — the point where a weak course would plant a falsehood; a
  self-review sits there
- **assess on a cold boot** — the lesson lives only in the boot, so the test boots the role fresh,
  with no memory of the course; else it measures the driver's context, not the role
- **exit as a stone** — a course must never read as a finished route, where a driver would stop

## 🟡 .the limits of the evidence

- every citation below is a **pointer**: read via websearch + webfetch, mostly secondary pages.
  no primary source has had a bhrowser read
- the canon studies human learners; none of it tests an llm agent. the cold-boot assess is this
  repo's adaptation, and no study tests it
- retrieval and spaced practice [8] have no direct analog for a role that does not forget; the
  nearest is to rerun a pedigree's assessment tasks once the code or the world has changed
  (caught as a dream)
- kolb [9] supports reflection, but has the weakest evidence of the set; lean on [5] and [11]

## .citations

1. backward design (wiggins & mctighe) — teaching.resources.osu.edu/teaching-topics/using-backward-design-plan-your
2. merrill, first principles of instruction — en.wikipedia.org/wiki/First_Principles_of_Instruction
3. 4c/id (van merriënboer) — search snippet only; primary unread
4. gagné, nine events — usu.edu/teach/help-topics/teaching-tips/gagnes-9-events-of-instruction
5. cognitive apprenticeship (collins, brown, holum) — aft.org/ae/winter1991/collins_brown_holum
6. bloom's mastery model — en.wikipedia.org/wiki/Mastery_learning
7. deliberate practice (ericsson) — en.wikipedia.org/wiki/Practice_(learning_method)
8. dunlosky et al. 2013 — aft.org/ae/fall2013/dunlosky
9. kolb cycle — en.wikipedia.org/wiki/Kolb%27s_experiential_learning
10. kirkpatrick — kirkpatrickpartners.com/the-kirkpatrick-model/
11. after action review (us army) — search snippet + wikipedia
12. twi job instruction — en.wikipedia.org/wiki/Training_Within_Industry
13. addie — en.wikipedia.org/wiki/ADDIE_Model

first seen in `ehmpathy/rhachet-roles-bhrain`, `.behavior/v2026_11_23.feat-learner-education-suite/`; its `appendix/research.course-structure-models.md` holds the full per-model table.
