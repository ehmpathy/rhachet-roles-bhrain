# self-review: has-questioned-questions

triage each open question from the vision.

---

## questions from "open questions & assumptions" section

### Q1: "should the challenge box be EVERY hook, or only after count > N?"

**triage**:
- can logic answer now? no — both approaches have merit
- can docs/code answer? checked stepRouteDrive.ts — current behavior is `suggestBlocked: state.count > 5`
- external research needed? no
- wisher only? yes — this is a UX preference

**verdict**: [wisher] — need wisher to decide:
- option A: every time (noisier, always visible)
- option B: after count > N (quieter, targeted)

---

### Q2: "should we require articulation before we allow `--as blocked`?"

**triage**:
- can logic answer now? yes — articulation SHOULD be required
- reason: if driver marks blocked without explanation, human has no context

**verdict**: [answered] — yes, require articulation. the vision already mentions this as an edgecase handler option. promote it to a requirement.

**fix**: update vision to require articulation file for `--as blocked`.

---

### Q3: "how do we handle drivers that mark blocked too eagerly?"

**triage**:
- can logic answer now? partially — if articulation is required, lazy blocks are harder
- but: what if driver writes "i don't know" as articulation?
- external research needed? no
- wisher only? partially

**verdict**: [answered] + [wisher]
- [answered]: require articulation + human reviews articulation before route proceeds
- [wisher]: should there be a minimum articulation length? or trust drivers?

---

## questions from "what must we validate with the wisher"

### Q4: "confirm the 'fallen-leaf challenge' name and visual format"

**verdict**: [wisher] — term came from wish, but exact visual unclear.

---

### Q5: "confirm the challenge should appear every time (vs only when stuck)"

**verdict**: [wisher] — same as Q1.

---

### Q6: "confirm boot.yml inclusion approach"

**triage**:
- can docs/code answer? yes — research rhachet boot.yml schema

**verdict**: [research] — look at rhachet boot.yml documentation before criteria.

---

## additional questions from r1/r2 reviews

### Q7: "does boot.yml support skill 'say'?"

**verdict**: [research] — must verify rhachet schema.

---

### Q8: "is 'blocked' the right term, or should we use 'paused'/'help needed'?"

**triage**:
- can logic answer? partially — "blocked" is standard in the codebase
- checked printSetHelp(): uses "blocked" consistently
- but: for driver UX, a friendlier term might work better

**verdict**: [wisher] — ask if "blocked" should be reframed in the challenge output (even if the command stays `--as blocked`).

---

### Q9: "should we prefer tree format over ASCII box?"

**triage**:
- can logic answer? yes — tree format is proven, box is risky

**verdict**: [answered] — use tree format. update vision.

---

## summary of triage

| question | verdict | action |
|----------|---------|--------|
| Q1: every time vs after N? | [wisher] | ask |
| Q2: require articulation? | [answered] | yes, update vision |
| Q3: eager blocks | [answered]+[wisher] | require articulation, ask about min length |
| Q4: confirm "fallen-leaf" name | [wisher] | ask |
| Q5: every time vs stuck only | [wisher] | same as Q1 |
| Q6: boot.yml approach | [research] | research rhachet |
| Q7: boot.yml skill say support | [research] | research rhachet |
| Q8: "blocked" vs friendlier term | [wisher] | ask |
| Q9: tree vs box format | [answered] | use tree |

## changes to vision

1. **Q2**: added requirement that `--as blocked` requires articulation file
2. **Q9**: updated to prefer tree format over ASCII box
3. consolidated research questions into single "research rhachet boot.yml" item
4. consolidated wisher questions into clear list
