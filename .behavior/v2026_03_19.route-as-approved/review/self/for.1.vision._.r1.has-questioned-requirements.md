# self-review: has-questioned-requirements

## requirement 1: improve `--as approved` error message

### who said this was needed? when? why?

**who:** the wisher (human), based on direct experience with an agent that got blocked

**when:** referenced in the wish under "ref" — an agent ran `--as approved`, got "only humans can approve," and assumed ALL approval-related operations were blocked

**why:** the agent overgeneralized the error. the error was technically correct but failed to guide the agent toward what they SHOULD do instead.

### what evidence supports this requirement?

direct quote from the wish:
> "i got blocked on --as approved with 'only humans can approve' and incorrectly assumed all approval-related operations were off-limits. i should have recognized that --as passed is different — it's to record that the human approved, not me to do the approval. the error was precise; i overgeneralized it."

this is firsthand evidence of a real confusion that cost time and autonomy.

### what if we didn't do this — what would happen?

agents would continue to freeze when they hit `--as approved` blocks. they would wait for human intervention when they could have continued with `--as arrived` or `--as passed`. this burns human time and slows down autonomous work.

### is the scope too large, too small, or misdirected?

**scope is appropriate.** the ask is narrow: improve one error message. the vision expands it slightly to include the boot.yml brief, which provides preventative education rather than just reactive error guidance.

### could we achieve the goal in a simpler way?

**yes, partially.** we could ONLY add guidance to the error message and skip the boot.yml brief. however, the boot.yml brief provides proactive education — agents learn the mental model at boot, not at error time. both together form a layered defense: boot.yml prevents confusion, improved error message catches agents who miss the brief.

### verdict: HOLDS

the requirement is well-evidenced, appropriately scoped, and the solution addresses root cause (lack of guidance) not just symptom (blocked agent).

---

## requirement 2: create a boot.yml brief about how to drive

### who said this was needed? when? why?

**who:** the wisher, as part of the same wish

**why:** to teach drivers the mental model of routes, stones, and statuses BEFORE they encounter errors. proactive education vs reactive error messages.

### what evidence supports this requirement?

the wish specifies multiple elements the brief should cover:
- read stone messages carefully
- run `rhx route.drive` when lost
- use `--as passed`, `--as arrived`, `--as blocked` appropriately
- respect self-reviews and peer reviews
- understand routes as paved paths from generations of trial and error

this comprehensive list suggests the wisher has observed multiple points of confusion, not just the `--as approved` case.

### what if we didn't do this — what would happen?

agents would continue to learn route conventions through trial and error. they would hit errors, read error messages, and gradually build a mental model. this is slower and more frustration than to frontload the knowledge.

### is the scope too large, too small, or misdirected?

**scope is appropriate.** the brief covers the essential mental model for route-based work. it doesn't try to document every command — it focuses on the philosophy and key actions.

### could we achieve the goal in a simpler way?

**no.** the boot.yml brief IS the simple way. the alternative — to scatter guidance across multiple error messages — would be more complex to maintain and less coherent for the agent.

### verdict: HOLDS

the requirement complements requirement 1. together they form proactive (boot.yml) and reactive (error message) guidance.

---

## meta-reflection

### what i questioned and why it holds

| requirement | questioned aspect | verdict |
|------------|-------------------|---------|
| error message improvement | could we just improve error? | yes, but boot.yml prevents confusion earlier |
| boot.yml brief | is it necessary? | yes, proactive > reactive |

### what i might have missed

1. **are there other human-only gates?** the vision asks this as a research question. if `--as approved` is the only one, the pattern may not need generalization. if there are others, they should get similar treatment.

2. **what if agents ignore the boot.yml?** the vision addresses this: the error message provides enough context to recover.

3. **is `say` the right level?** i assumed `say` level. the wisher may prefer `ref` level (always loaded) for drivers. this is an open question.

---

## summary

both requirements are well-founded, appropriately scoped, and form a coherent solution. i found no requirements that should be removed or significantly changed. the open questions in the vision are genuine uncertainties to validate with the wisher.
