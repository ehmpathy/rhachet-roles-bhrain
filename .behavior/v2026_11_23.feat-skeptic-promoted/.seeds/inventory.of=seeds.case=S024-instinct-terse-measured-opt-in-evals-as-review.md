# seed S024 · instinct-terse-measured-opt-in-evals-as-review

## .said

> 4.4k output tokens is crazy ; did you not constrain the output to json shape and inform it to be terse? could even enforce via a json schema that it needs no more than 210 chars per concern and 210 chars to cite the claim . whats the output shape you gave it?

> ok, so why dont you verify? yeah add some evals to experiment with. these should be opted into, not run by default, to save on cost since most work wont impact them

> i think theres some examples in this repo already via flags

> and it should report via brain stats where the tokens went

> we should report on those

> just refine the vision with all these requirements

> and then we'll let you build this all out via execution

> so that you conform to the structure of rhx review and rhx review.by, for rhx instinct and rhx instinct.of

## .settled

- the reply shape is a json schema: each `claim` and each `concern` at most 210 chars, and terse
- the instinct's brain stats report where its tokens went, split, never only a total
- where the output tokens go is verified by a read, never inferred
- the instinct's evals are opt-in, gated by the repo's extant live-brain flag pattern, never in a default run
- `rhx instinct` and `rhx instinct.of` take the structure of `rhx review` and `rhx review.by`
- these land in the vision now; the build is execution's

## .landed

- `1.vision.yield.md` (the role=subconscious table: `its judge briefs`, `its reply shape`, `its reason budget`, `its brain stats`, `its evals`; `its flag rate is measured before it nags`; `how the subconscious attaches`)
