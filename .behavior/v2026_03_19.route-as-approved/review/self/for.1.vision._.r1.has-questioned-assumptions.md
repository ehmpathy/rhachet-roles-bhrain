# self-review: has-questioned-assumptions

## assumption 1: agents read error messages carefully

### what do we assume here without evidence?

we assume that when an agent sees a detailed error message, they will read all of it and absorb the guidance.

### what evidence supports this assumption?

the wish itself provides evidence: the agent DID read the error ("only humans can approve") but overgeneralized. this suggests agents DO read errors — they just need better content.

### what if the opposite were true?

if agents skim or ignore error messages, the improved error would have no effect. however, the boot.yml brief would still help — proactive education reaches agents before errors.

### did the wisher actually say this, or did we infer it?

**inferred.** the wisher showed an agent that read but misinterpreted the error. we inferred that better content would fix the misinterpretation.

### verdict: REASONABLE ASSUMPTION

supported by evidence in the wish. the layered approach (boot.yml + error) hedges against agents who skim.

---

## assumption 2: `say` level is appropriate for the boot.yml brief

### what do we assume here without evidence?

we assume the brief should be `say` level (read when relevant) rather than `ref` level (always read at boot).

### what evidence supports this assumption?

none directly. the wisher said "create a say level boot.yml brief" explicitly in the wish.

### what if the opposite were true?

if `ref` level is better, every driver session would start with route guidance. this could be valuable — ensures all agents have the mental model. but it also adds context to every session, even when routes aren't involved.

### did the wisher actually say this, or did we infer it?

**the wisher said `say` level explicitly.** this is not an assumption — it's a requirement.

### verdict: NOT AN ASSUMPTION — EXPLICIT REQUIREMENT

the wisher specified `say` level. we followed the requirement.

---

## assumption 3: the checkpoint analogy is clear

### what do we assume here without evidence?

we assume the ranger/checkpoint analogy helps agents understand the distinction between `--as approved` (human grants) and `--as passed` (driver proceeds).

### what evidence supports this assumption?

metaphors generally aid comprehension. the checkpoint model maps well:
- ranger = human reviewer
- checkpoint = guard
- nod = approval
- walk through = passage

### what if the opposite were true?

if agents find the analogy unclear, it could add noise. however, analogies are secondary — the direct explanations ("only humans can approve", "you can run --as arrived") are primary.

### did the wisher actually say this, or did we infer it?

**inferred.** the wisher asked for owl zen wisdom and metaphorical language. we crafted the checkpoint analogy to fit.

### verdict: LOW-RISK INFERENCE

the analogy is supplementary. if it confuses agents, they can ignore it and follow the direct instructions.

---

## assumption 4: agents will use `rhx route.drive` when lost

### what do we assume here without evidence?

we assume agents will run `rhx route.drive` when they don't know what to do next.

### what evidence supports this assumption?

the `route.drive` command is surfaced prominently in:
- the current route.drive output (we just saw it)
- error messages that mention "instead, run rhx route.drive"
- the proposed boot.yml brief

### what if the opposite were true?

if agents ignore `route.drive`, they would guess commands or ask the human. the boot.yml brief explicitly teaches "run rhx route.drive when you don't know what to do" to address this.

### did the wisher actually say this, or did we infer it?

**the wisher explicitly said to include this in the brief.** not an assumption.

### verdict: NOT AN ASSUMPTION — EXPLICIT REQUIREMENT

---

## assumption 5: both error message AND boot.yml are needed

### what do we assume here without evidence?

we assume a layered approach (proactive + reactive) is better than either alone.

### what evidence supports this assumption?

defense in depth is a proven pattern. some agents will read boot.yml; some will miss it and hit the error. both paths lead to correct behavior.

### what if the opposite were true?

if only one is needed:
- error message alone: reactive, catches agents at confusion time
- boot.yml alone: proactive, prevents confusion for agents who read it

both are valuable. the wisher asked for both.

### did the wisher actually say this, or did we infer it?

**the wisher asked for both explicitly.** two numbered items in the wish.

### verdict: NOT AN ASSUMPTION — EXPLICIT REQUIREMENT

---

## assumption 6: the vision scope is complete

### what do we assume here without evidence?

we assume the vision covers all aspects of what the wisher wants. but we may have missed an aspect.

### what evidence supports this assumption?

we addressed both numbered items from the wish. we included open questions to validate with the wisher.

### what if the opposite were true?

if we missed an aspect, the wisher will clarify at approval time. the open questions invite this feedback.

### did the wisher actually say this, or did we infer it?

**inferred completeness.** the open questions section acknowledges this uncertainty.

### verdict: ACCEPTABLE UNCERTAINTY

the open questions section explicitly invites wisher feedback. we did not assume completeness — we acknowledged the need for validation.

---

## summary of assumptions

| assumption | status | risk level |
|-----------|--------|------------|
| agents read errors carefully | reasonable inference | low (layered approach hedges) |
| `say` level is appropriate | explicit requirement | n/a |
| checkpoint analogy is clear | low-risk inference | low (supplementary) |
| agents will use route.drive | explicit requirement | n/a |
| both mechanisms needed | explicit requirement | n/a |
| vision scope is complete | acknowledged uncertainty | mitigated by open questions |

no hidden assumptions require action. the vision is grounded in explicit requirements and reasonable inferences with hedges.
