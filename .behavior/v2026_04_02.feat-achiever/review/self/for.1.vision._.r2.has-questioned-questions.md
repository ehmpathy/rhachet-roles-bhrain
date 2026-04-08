# self-review r2: has-questioned-questions

## questions triaged

### from "questions to validate with wisher"

#### 1. should goals have priority/urgency?

| triage | reason |
|--------|--------|
| **[wisher]** | only wisher knows if v1 needs priority. wish explicitly defers: "we'll build on this to enable the achiever to prioritize" (line 31). this implies priority is future scope, but wisher should confirm. |

---

#### 2. should goals have dependencies (goal B blocked by goal A)?

| triage | reason |
|--------|--------|
| **[wisher]** | scope decision. wish mentions "deduplication and decomposition" (line 33) but not dependencies. wisher should confirm if dependencies are v1 or future. |

---

#### 3. should completed goals be archived or deleted?

| triage | reason |
|--------|--------|
| **[answered]** | can answer via logic: keep for auditability. completed goals provide history of what was done. archive to `.goals/.archive/` after N days if clutter becomes a problem. deletion loses history. |

**resolution**: default to keep completed goals in place. add `.archive/` subdir as optional future enhancement.

---

#### 4. is the `source: 'human' | 'self'` distinction valuable?

| triage | reason |
|--------|--------|
| **[answered]** | can answer via logic: yes, valuable. wish explicitly distinguishes "from communications" (human) vs "from internalizations" (self). track source enables: filter (show only human asks), audit (who added this?), future differentiation (self-goals need approval?). |

**resolution**: keep `source` field. wish implies the distinction matters.

---

#### 5. should gates be executable or descriptive?

| triage | reason |
|--------|--------|
| **[answered]** | can answer via logic: descriptive for v1. executable gates require: schema for gate types, execution runtime, error handle. this exceeds "root primitive" scope. descriptive gates let brain articulate verification in plain text. |

**resolution**: gates are descriptive strings for v1. executable gates can be added later when patterns emerge.

---

### from "external research needed"

#### 1. how do other ai systems track goals? (autogpt, babyagi, etc.)

| triage | reason |
|--------|--------|
| **[research]** | valuable context for design. autogpt uses task lists. babyagi uses vector db. to know patterns informs our choices. |

---

#### 2. what goal taxonomies exist in cognitive science?

| triage | reason |
|--------|--------|
| **[research]** | may inform ask/task/gate shape. cognitive science distinguishes: outcome goals, process goals, approach/avoidance goals. worth to explore if our shape aligns. |

---

#### 3. how do humans naturally express goals vs tasks vs wishes?

| triage | reason |
|--------|--------|
| **[research]** | informs goal.infer design. to understand natural language patterns helps llm prompt design. |

---

## summary of triage

| question | verdict |
|----------|---------|
| priority/urgency? | [wisher] |
| dependencies? | [wisher] |
| archive or delete? | [answered] — keep, archive later |
| source distinction? | [answered] — yes, keep it |
| executable gates? | [answered] — descriptive for v1 |
| other ai systems? | [research] |
| cognitive taxonomies? | [research] |
| natural goal expression? | [research] |

## updates needed to vision

the vision's "open questions & assumptions" section needs to reflect this triage. questions that were answered should be moved to "assumptions" or removed. questions that need wisher should be clearly marked.

**action**: update vision to reflect triage.
