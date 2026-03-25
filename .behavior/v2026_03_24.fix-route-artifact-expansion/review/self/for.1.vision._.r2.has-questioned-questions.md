# self-review: has-questioned-questions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`

---

## triage: open questions in the vision

### question 1: should we use `.route` or `input.route`?

**status: [answered]**

- can this be answered via logic now? yes — `.route` doesn't exist, routes are at `.behavior/xyz/`
- can this be answered via extant code? yes — reviews/judges use `vars.route` which is the actual path
- should this be answered via external research? no
- does only the wisher know? no — the human confirmed in the review

**answer recorded in vision:**
> use `input.route` (the actual route path like `.behavior/xyz/`)

---

## triage: assumptions in the vision

### assumption 1: `input.route` is the correct expansion value

**status: [answered]**

validated in r2: human feedback confirmed routes live at `.behavior/xyz/...`, not `.route`.

### assumption 2: `getAllStoneArtifacts` is the only place that needs this fix

**status: [answered]**

validated in r2: grep verified only this function performs the glob enumeration.

---

## no questions remain unanswered

all questions are either:
- [answered] — via logic, code inspection, or human feedback
- none marked [research] or [wisher]

the vision is complete for this phase.

---

## summary

| item | type | status |
|------|------|--------|
| use `.route` or `input.route`? | question | [answered] |
| `input.route` is correct value | assumption | [answered] |
| `getAllStoneArtifacts` is only place | assumption | [answered] |

ready to proceed.
