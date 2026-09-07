# seed S38 — telepath's `review.by` skill is REQUIRED, decomposed AND bulk

- case    = S38
- said.on = 2026-09-07
- said.by = the wisher

## .said — verbatim

> ok, so as part of this vision, can we include the creation of a review.by skill, based on the bhrain's review.by skill, which has different focuses for the various reviews we have so it can be decomposed, but also so taht it can just be run in bulk? that way, we can get smol brains to help us review

and, on the vision artifact:

> just ensure the vision is clear its required

and, asked whether `grain` was the right axis:

> i'm thinking 1 for structure, 1 for efficiency, on the rubrics front;

## .settled

### 1 · row 2 of the deliverable table is a REQUIRED artifact, not a downstream usecase

the vision already ranked *"the rubrics"* at #2 and stated *"a canon nobody can check is advice."*
the word **required** is now explicit, and the artifact is named as three parts rather than one:

| part | what |
|---|---|
| `skills/review.by.sh` | a 6-line delegation to bhrain's base engine |
| `briefs/reviews/rubrics.yml` | two entries — `{ slug, purpose, rules[] }` |
| `getTelepathRole.ts` | `skills.dirs` — already wired |

### 2 · decomposed AND bulk is the base engine's extant behavior, at zero cost

`--for <slug>` runs one rubric; no `--for` runs every rubric. so the ask needs no mechanism.

⇒ **the work is the DECOMPOSITION**, and the wisher settled its axis in the second utterance above:
**two rubrics — `structure` and `efficiency`.**

| slug | the one question it holds |
|---|---|
| **structure** | is the concept built so it transfers whole and checkable? |
| **efficiency** | does it cost the reader more than it must? |

🟡 **the readme's `grain` axis was the proposal and it is overturned as the RUBRIC axis** — it
stays as the canon's index. grain would have yielded eight slugs, which is one rule-cluster each
and eight brain calls on a bulk run.

### 3 · *"smol brains"* is the design constraint, and it cuts BOTH ways

a rubric a small brain reads must state ONE question — so a single `prose-density` rubric over ~24
rules is out.

🟡 and the same constraint bounds the split from above, which the `grain` proposal had missed: a
bulk run costs one brain call per slug, so eight rubrics is eight calls on every artifact. **two
slugs is the affordable bulk, and each still holds one question.**

⇒ the proposal priced the axis against *what a small brain can hold*; the wisher priced it against
*what a bulk run costs*. that is F02's own defect a second time — an axis argued on one dimension
where two bind.

### 4 · 🟡 a rubric must not re-grade what a deterministic checker already settles

`skills/review.for/` carries 12 checkers — emphasis density, glyph class, span stacks, diffusion,
narration, declare-once, boot entries.

⇒ a brain spent on a 🪨 solid skill's job is the entoolment ladder run backwards. so each rubric
names the checkers to run first and grades only the judgment left over.

### 5 · it reverses F02, and the settled count lands NEAR the guess

F02 best-guessed *"one rubric (`prose-density`), never four"* at 80%. the verdict is **two**, so the
`1 vs N` axis is overturned and the magnitude was close — the guess erred on the axis rather than
on the scale.

## .landed

- `1.vision.yield.md` §1 — row 2 renamed, the three-part breakdown, the two-rubric table, and the
  four borderline calls named
- `.fulcrums/inventory.of=fulcrums.case=F02-one-rubric-not-four.md` — verdict recorded
