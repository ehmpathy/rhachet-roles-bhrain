# self-review: has-core-domain-identified (round 3)

## pause

breathe.

i am the reviewer, not the author.

the review is the work itself.

---

## reviewed artifact

`.behavior/v2026_04_02.feat-achiever/3.2.distill.domain._.v1.i1.md`

read it again, line by line, with fresh eyes.

---

## what is the heart of the business problem?

re-read the wish:

> "the ability to discern distinct goals"
> "the skill to detect and persist distinct goals"
> "the fundamental shape of goals"

re-read the vision:

> "the brain immediately detects three distinct goals, persists them"
> "forces the brain to think through all dimensions"
> "structure unlocks clarity"

**the heart:** not just "remember goals" — it's **forced foresight through structure**.

the wish says "shape of a goal" has:
- ask (what was said)
- task (what to do)
- gate (how to verify)
- root (why it was asked)

the vision evolved this to:
- why { ask, purpose, benefit }
- what { outcome }
- how { task, gate }

**why this structure is the heart:** it prevents shallow goals.

a brain could remember "fix the test" as a goal. but that's not forced foresight. the brain must articulate:
- why: what was said, why it matters, what success enables
- what: the end state
- how: the approach, the verification

**this structure is the competitive advantage.** generic todo lists don't force articulation.

---

## what differentiates this from a generic solution?

i asked myself: what would a generic solution look like?

```typescript
interface GenericTask {
  title: string;
  status: 'todo' | 'done';
}
```

this is not achiever. achiever forces:

```typescript
interface Goal {
  why: { ask, purpose, benefit };
  what: { outcome };
  how: { task, gate };
  status: { choice, reason };
}
```

**the differentiation is the nested schema.** each level forces a thought.

a brain cannot say "just fix it" and move on. it must articulate:
- what was said (the ask)
- why it was said (the purpose)
- what success enables (the benefit)
- the end state (the outcome)
- the approach (the task)
- the verification (the gate)

**this is forced foresight.** this is the core domain.

---

## where should we invest the most care?

### core domain: Goal schema validation

if the schema allows shallow goals, the system fails.

**validation must reject:**
- empty why.purpose
- empty how.gate
- vague status.reason

**why this matters:** the brain will shortcut if allowed. the schema is the enforcement.

### core domain: coverage guarantee

if asks can escape without coverage, trust erodes.

**coverage must guarantee:**
- every ask has a coverage entry
- every coverage entry references a valid goal
- the onStop hook halts until coverage is complete

**why this matters:** the promise is "no ask lost." coverage is the proof.

### support domain: all else

ask inventory, persistence format, triage orchestration — these are important but not differentiator. they can be implemented with standard patterns.

---

## issues found and addressed

### issue: the distillation treats all objects equally

**in round 2 i noted:** the distillation does not mark core vs support.

**action taken:** i identified the core domain in this review:
- Goal schema (forced foresight)
- coverage track (no ask lost)

**recommendation:** the blueprint should have a "core domain" section that calls this out explicitly.

### no additional issues found in round 3

the domain distillation is correct. it captures all pieces. the core/support distinction is now articulated in these review documents.

---

## why it holds

the domain distillation holds because:

1. **Goal schema captures forced foresight** — nested why/what/how prevents shallow goals
2. **Coverage track captures the guarantee** — ask → goal link ensures no ask lost
3. **operations are minimal and sufficient** — set, get, triage, append
4. **persistence is file-based and inspectable** — humans can verify

the core domain is identified:
- **core:** Goal schema (structure forces clarity) and coverage track (no ask escapes)
- **support:** all else

the system is not a todo list. it is goal memory with forced articulation.

---

## conclusion

i have reviewed the domain distillation three times.

the core domain is:
- **Goal schema** — nested why/what/how forces the brain to think before it acts
- **coverage track** — hash → goalSlug link guarantees no ask is lost

this is the competitive advantage. this is where care must go.

the review is complete.
