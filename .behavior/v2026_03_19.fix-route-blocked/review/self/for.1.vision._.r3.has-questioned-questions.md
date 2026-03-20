# self-review r3: has-questioned-questions (final pass)

read the vision line by line. verify all questions triaged. check for internal consistency.

---

## 1. complete question triage verification

i opened the vision and read the "what questions remain unanswered" table:

| question | verdict in vision | verified? |
|----------|-------------------|-----------|
| every time vs after count > N? | [wisher] | ✓ listed in "what must we validate" #1 |
| require articulation for blocked? | [answered] | ✓ decision in edgecases table |
| handle eager blocks? | [answered] | ✓ decision in edgecases table + [wisher] for min length |
| "fallen-leaf" name clear? | [wisher] | ✓ listed in "what must we validate" #2 |
| tree vs box format? | [answered] | ✓ tree shown in example, note confirms decision |
| boot.yml skill say support? | [research] | ✓ listed in "what must we research" #1 |
| "blocked" vs friendlier term? | [wisher] | ✓ listed in "what must we validate" #3 |

**finding**: all questions have clear verdicts. no orphaned questions.

---

## 2. cross-reference check

### do [answered] questions have their decisions reflected?

**Q: require articulation for blocked?**
- decision: yes, require articulation file
- reflected in: edgecases table says "**require** articulation file before `--as blocked` proceeds"
- reflected in: outputs section mentions "blocker articulation file at `<route>/.route/blocker/<stone>.md`"
- **holds**: decision is consistently reflected.

**Q: tree vs box format?**
- decision: use tree (proven, consistent)
- reflected in: example output uses tree format with ├─ └─ characters
- reflected in: note says "tree format chosen over ASCII box"
- **issue found**: "what assumptions" section said "box format" — **fixed** to say "tree format"
- **issue found**: "what is awkward" section said "box" — **fixed** to say "tree structure"
- **holds after fix**: decision is now consistently reflected.

### do [wisher] questions have clear formulations?

checked "what must we validate" section:
1. "should challenge appear EVERY hook, or only after count > N?" — clear binary choice
2. "confirm 'fallen-leaf challenge' name resonates (or suggest alternative)" — clear ask
3. "should 'blocked' be reframed in output (e.g., 'help needed')?" — clear ask with example
4. "minimum articulation length for blocked, or trust drivers?" — clear ask

**holds**: all [wisher] questions are actionable.

### do [research] questions have clear scope?

checked "what must we research externally" section:
1. "does rhachet boot.yml support skill `say` directive?" — yes/no question, can verify in code
2. "if not, what's the alternative for boot-time skill awareness?" — conditional follow-up

**holds**: research questions are bounded and answerable.

---

## 3. internal consistency check

### example output vs summary

**example shows**:
- fallen-leaf challenge section at top (before stone head)
- tree format with three options: arrived, passed, blocked
- mandate text: "to refuse is not an option"

**summary says**:
1. add fallen-leaf challenge section at top ✓
2. challenge presents three options ✓
3. challenge makes clear: to refuse is not an option ✓
4. update route.stone.set.sh header ✓
5. add to boot.yml as say skill ✓

**holds**: summary matches example and vision content.

### user terms table

| user term | our term |
|-----------|----------|
| "the box at the top" | fallen-leaf challenge |

**finding**: "the box at the top" is what users might call it colloquially, even though we use tree format. this is fine — it describes user perception, not implementation.

---

## 4. fixes applied

| issue | location | fix |
|-------|----------|-----|
| "visual box format (ascii art)" | assumptions #2 | changed to "tree format will render clearly (validated — tree format is proven in extant output)" |
| "the box (ascii) adds visual weight" | what is awkward | changed to "the tree structure adds visual weight" |

these fixes were applied to 1.vision.md before this review was written.

---

## 5. final verification

- [x] all questions have [answered], [wisher], or [research] verdict
- [x] [answered] questions have decisions reflected in vision content
- [x] [wisher] questions are enumerated in "what must we validate" section
- [x] [research] questions are enumerated in "what must we research" section
- [x] example output uses tree format (not box)
- [x] assumptions section updated to reflect tree format
- [x] awkward section updated to reflect tree format
- [x] summary aligns with example and content

**conclusion**: vision is internally consistent. all questions triaged. ready for human review.

