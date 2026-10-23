# rule.forbid.workarounds

> **never work around a failure. diagnose it to its root cause and fix it there — and when the tool
> that failed is one you build, the failure IS the defect report.**

a **workaround** = any change to an input, a declaration, a config, or your own conduct that makes a
failure go quiet while its cause stands. it is forbidden. a record of it does not make it
acceptable: a dream, a `.taken`, or a fulcrum that names a workaround documents the defect and
leaves it shipped.

## .why — a workaround is cheaper per round and ruinous per route

- **it hides the report.** a failure is the one signal that a design is wrong. a patch to the input
  silences that signal for the one party able to act on it
- **it recurs.** the cause stands, so the next edit, the next driver, the next repo trips it again —
  and each pays the full diagnosis cost the first one skipped
- **it compounds.** each patch is small and locally sane, so no single round looks like the
  mistake. the route-level cost shows only in sum, and by then it is hours

## 🔴 .the dogfooder — the strongest form of this duty

when the tool that fails is the tool under construction, there is no "human error" to diagnose.
**every friction the builder hits is a defect the next human hits too, without the builder's context
to patch around it.**

| what the dogfooder thinks | what is true |
|---|---|
| *"my declaration was stale; I fixed it"* | the tool let a stale declaration exist. that is the defect |
| *"the refusal did its job"* | it fired at the costliest moment. a correct refusal at the wrong moment is a design defect |
| *"I'll note it as a follow-up"* | the follow-up is this round's work. you hold the context now |
| *"it only cost one round"* | it costs one round per occurrence, forever, for every human |

## .the bar — a pit of success

a tool is done when its correct use asks **no questions and meets no friction**: it guides the
caller, and the right move is the easy move.

🔴 **any friction is a critical defect, fixed immediately.** not a nitpick, not a follow-up, not a
dream — the round that surfaced it is the round that fixes it. concretely:

- the wrong state is **unreachable**, or caught **once, at the cheapest moment**
- the catch prints the **exact command** that fixes it
- soundness holds **by construction**, never by a list a human keeps in sync
- the cure ships with a clamp — a test red without it, green with it (`rule.require.clamp-edge-cases`, foreign: ehmpathy/mechanic)

## .the test

> **"did the cause of this failure change, or only my input to it?"**

- the cause changed → a fix
- only the input changed → a workaround. 🔴 stop, find the cause, fix it there

## .the cues

| when… | then… |
|---|---|
| you edit a declaration, glob, or config so a tool stops its refusal | ask why the tool let that state exist, and why it refused when it did |
| a refusal fires per lane, per file, per run — many times for one cause | the check sits at the wrong moment. move it to the cheapest one |
| a contract stays sound only while a human keeps a list in sync | the contract is the defect. make soundness hold by construction |
| you must read a doc or ask a question to use your own tool right | the tool does not guide. that friction is the defect |
| you write *"the tool did its job"* about a failure you just hit | 🔴 the sharpest cue. did it, at the cheapest moment, with no upkeep owed? |
| you reach for a `.taken`, a dream, or a fulcrum about your own tool's friction | fix the tool in this round, then write the record of the fix |
| the same kind of failure shows up a second time | 🔴 the first fix was a workaround |

blocker: an input, declaration, or config patched so a failure goes quiet while its cause stands · a
workaround recorded in place of a fix · a dogfooder's friction with their own tool left unfixed in
the round it surfaced · a refusal that fires repeatedly for one cause, left in place · a contract
that needs hand upkeep to stay sound, left in place.

⇒ see also, in this repo: `rule.always.entool-the-skills-you-touch` (bhrain/role=learner — this
rule closes its "record the workaround" door) · `rule.always.fix-forward-under-scouts-honor`
(bhrain/role=driver — a deferral is not available for a defect in the tool under construction).

⇒ see also, foreign (published by a peer repo, not resolvable here): `rule.require.solve-at-cause`
(ehmpathy/architect — diagnose before you act) · `rule.require.clamp-edge-cases`
(ehmpathy/mechanic — the cure owes a clamp) · `rule.require.safe-by-default` (ehmpathy/ergonomist —
the pit of success).
