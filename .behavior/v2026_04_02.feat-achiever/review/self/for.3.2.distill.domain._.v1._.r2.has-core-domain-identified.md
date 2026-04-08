# self-review: has-core-domain-identified (round 2)

## pause

tea first. then, we proceed.

i am the reviewer, not the author.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.domain._.v1.i1.md`

---

## what is the heart of the business problem?

**the problem:** robot brains forget goals.

human sends: "fix the test and update the readme"
brain does: fixes the test, forgets the readme

**why it matters:** trust. if the brain forgets, humans must repeat themselves. they lose confidence. they delegate less. they work around the brain instead of with it.

**the heart:** goal memory. the ability to detect, persist, and track goals across context compression.

---

## what differentiates this system from a generic solution?

### generic solution: todo list

a generic todo list could track tasks. but:
- no forced articulation (why, what, how)
- no ask → goal coverage track
- no hook enforcement (onTalk, onStop)
- no scope awareness (route vs repo)

### achiever differentiation

1. **forced articulation** — the Goal schema requires why.ask, why.purpose, why.benefit, what.outcome, how.task, how.gate. shallow goals are rejected.

2. **ask coverage** — every peer input is accumulated. every input must be covered by a goal. no ask escapes.

3. **structural enforcement** — hooks halt the session until triage is complete. the brain cannot bypass this.

4. **scope awareness** — goals are route-scoped or repo-scoped. they live where they matter.

**this is not a todo list.** this is goal memory with forced foresight.

---

## where should we invest the most care and attention?

### core domain: Goal schema and coverage track

**why Goal schema is core:**
- the nested why/what/how structure is what forces foresight
- if the schema is weak, goals become shallow tasks
- if validation is weak, the brain shortcuts

**why coverage track is core:**
- coverage is what guarantees no ask is lost
- if coverage is weak, the onStop hook has no teeth
- if coverage is weak, trust erodes

### support domain: ask inventory, persistence format

**why ask inventory is support:**
- it's important but not differentiator
- append-only JSONL is straightforward
- the hash computation is standard

**why persistence format is support:**
- .goal.yaml and .flag files are infrastructure
- they enable the core domain but are not the value

---

## where the attention should focus

| domain | attention level | why |
|--------|-----------------|-----|
| Goal schema | **high** | forced articulation is the differentiation |
| coverage track | **high** | ask → goal link is the guarantee |
| ask inventory | medium | important but straightforward |
| persistence | low | infrastructure, not value |
| triage orchestration | medium | composition of core, not core itself |

---

## issues found

### issue 1: core domain not explicit in distillation

**observation:** the domain distillation document treats all domain objects equally. it does not call out which is core vs support.

**is this a problem?** partially. the document is correct about what exists. but it does not guide where to invest attention.

**fix:** for v1, this is acceptable. the blueprint and implementation can add explicit "core domain" markers. the distillation captured all pieces; the core/support distinction can be made in implementation.

**how to fix later:** add a "## core domain" section to the distillation that calls out Goal schema and coverage track as the heart.

### no other issues found

---

## conclusion

**core domain is identified:**
- **core:** Goal schema (forced foresight) and coverage track (no ask lost)
- **support:** ask inventory, persistence format, triage orchestration

the distillation does not explicitly mark core vs support, but the distinction is clear from analysis. future work should make this explicit.

the system is not a generic todo list. it is goal memory with structural enforcement. that's the differentiation. that's where care must go.
