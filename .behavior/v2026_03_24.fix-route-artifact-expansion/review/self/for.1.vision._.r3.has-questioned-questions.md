# self-review r3: has-questioned-questions

## reviewed artifacts

- `.behavior/v2026_03_24.fix-route-artifact-expansion/1.vision.md`
- `src/domain.operations/route/` — grep for other variables
- prior self-reviews (r1, r2)

---

## issue found: wrong triage format in vision

### the problem

the vision's questions section used `[x]` format:
```markdown
- [x] should we use `.route` or `input.route`?
```

### why this is wrong

the guide specifies triage statuses must be:
- `[answered]` — resolved now
- `[research]` — to be answered in research phase
- `[wisher]` — requires wisher input

`[x]` is ambiguous — it doesn't indicate HOW it was answered.

### how it was fixed

updated vision to use explicit status:
```markdown
- [answered] should we use `.route` or `input.route`?
```

---

## issue found: unasked question about other variables

### the problem

i initially said "no open questions remain" — but i hadn't asked whether OTHER variables like `$stone`, `$hash`, `$output` should also be expanded in artifact patterns.

grep shows these variables ARE used in judge commands. should they also work in artifact globs?

### triage of this new question

- can this be answered via logic now? **partially** — `$route` is the critical one for bhuild
- can this be answered via extant code? **no** — artifact patterns don't currently use these
- should this be answered via external research? **yes** — this is a feature scope question
- does only the wisher know? **no** — it's a design decision

### how it was fixed

added to vision:
```markdown
- [research] should artifact patterns also support `$stone`, `$hash`, `$output` like judges do? → defer to research phase; for now, only `$route` is needed to unblock bhuild
```

---

## triage: each question in the vision

### question 1: should we use `.route` or `input.route`?

**status: [answered]**

**why it holds:**
routes live at `.behavior/xyz/`, not `.route`. human confirmed. no ambiguity.

### question 2: should artifact patterns support `$stone`, `$hash`, `$output`?

**status: [research]**

**why deferred:**
- `$route` expansion unblocks bhuild (the immediate goal)
- other variables are a scope expansion
- defer to research phase to evaluate whether this is needed

---

## triage: each assumption in the vision

### assumption 1: `input.route` is the correct expansion value

**status: [verified]**

**why it holds:**
`vars.route` and `input.route` come from the same source by construction.

### assumption 2: `getAllStoneArtifacts` is the only place that needs this fix

**status: [verified]**

**why it holds:**
grep confirmed. architecture funnels enumeration through this function.

---

## enumeration check

the vision's "open questions & assumptions" section now contains:

| item | status | rationale |
|------|--------|-----------|
| use `.route` or `input.route`? | [answered] | human + code |
| support `$stone`, `$hash`, etc? | [research] | scope expansion, defer |
| `input.route` is correct | [verified] | code inspection |
| `getAllStoneArtifacts` only place | [verified] | grep |

---

## summary

| type | count | action |
|------|-------|--------|
| issues found | 2 | both fixed |
| [answered] questions | 1 | complete |
| [research] questions | 1 | deferred appropriately |
| [wisher] questions | 0 | n/a |

the vision is complete for the current scope. one research question is deferred.

---

## what i learned from this review

### lesson 1: use explicit triage statuses

`[x]` is a checkbox, not a status. it says "done" but not HOW. the triage guide has three specific statuses:
- `[answered]` — someone found the answer
- `[research]` — needs investigation
- `[wisher]` — only the wisher knows

**remember for next time:** always use the explicit status, not generic checkmarks.

### lesson 2: ask "what else?" before saying "none"

i initially said "no open questions remain" without asking whether there were OTHER questions to consider. the grep for `$stone`, `$hash`, `$output` revealed a legitimate scope question.

**remember for next time:** after triage, ask "what questions haven't i asked yet?" — then grep or read to verify.

### lesson 3: research is valid

not every question needs an answer NOW. the `$stone`/`$hash`/`$output` question is valid but out of scope. marking it `[research]` is better than:
- ignoring it (fails completeness)
- answering it now (scope creep)
- asking the wisher (wastes their time on design details)

**remember for next time:** use `[research]` for legitimate questions that don't block current work.
