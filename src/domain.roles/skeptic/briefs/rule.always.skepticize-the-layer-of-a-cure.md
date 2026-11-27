# rule.always.skepticize-the-layer-of-a-cure

> **for any defect, find by a read which role owns the root cause, then consult that role on the layer, the repo, and the grain of the cure. the read decides, never rank, and never a role named by habit. a cure at the wrong layer treats a symptom and leaves the cause to return.**

**how it applies the basis:** the layer where a symptom shows is a claim about where the cause sits, and the first to see the symptom believes that claim. the layer is read, not assumed; and the owner of the cause is found by a read, never by a habit you already trust.

## .the three axes

| axis | the question | who answers |
|---|---|---|
| owner | which role owns this root cause? | a read: who publishes the file or tool, and which role's briefs and skills cover it |
| layer and repo | where does the cause start, and which repo's code holds it? | the role that owns the layer, found by a read |
| grain | one-off, or tool-wide? | the owner, on the evidence: how many trees, peers, and days meet the defect |

the owner is the result of a read, never a map written into this brief: a map goes stale and trains one habit.

## .the move

| step | the act |
|---|---|
| 1 | name the layer where the defect shows |
| 2 | ask the five whys until one names a layer below it |
| 3 | read who publishes the file or tool at that layer, and which role covers it |
| 4 | consult that role as a peer on the layer, the repo, and the grain |
| 5 | list the layers a cure could sit at; pick the owner's layer and say why the others fail |
| 6 | a cure held at the symptom layer for now carries a dispatch to the owner's layer |
| 7 | doubt the ask itself: does its purpose hold (`rule.always.ask-why-then-ask-can-we-delete`)? |

## .the grain

- a one-off cure for a defect every peer will meet again is a symptom cure: the tool-wide cure deletes the class
- a tool-wide build for a defect met once is a bolt-on: the one-off cure holds until a second case shows
- a count of cases, trees, and days, each read, sets the grain

the act lands at the file the owner publishes, never a local copy of it; a cure proven in one tree moves up to the repo that owns it.

## .the test

> **which role owns this root cause, by what read, and did I consult it on layer, repo, and grain?**

## .enforcement

blocker: a cure at a layer, repo, or grain the cause's owner was not consulted on · an owner named by rank, habit, or assumption, with no read · the consult hardwired to one role, taught as the only one to ask
nitpick: a vision or plan with no named layer, repo, and grain for its cure

peer: architect `rule.require.solve-at-cause` (diagnose the root cause before you solve; this adds who owns it) · ergonomist `rule.forbid.surprises` (a "wait, what?" from a tool is a tool defect, cured in the tool; to the skeptic the same moment is a belief of yours that broke. two seats, no clash). source: Ohno's five whys.

see also:
- `rule.always.skepticize-the-layer-of-a-cure.example=the-drip-and-the-main.md` — three tap repairs, one failed regulator on the main
- `rule.always.skepticize-the-layer-of-a-cure.example=the-four-pulls-and-the-layer.md` — a review that found the layer unquestioned at the vision
- `rule.always.skepticize-the-layer-of-a-cure.example=a-test-tool-defect-and-the-consult.md` — the owner found by a read, the consult not hardwired

forbid twin: `rule.forbid.cures-at-the-symptom-layer`

---

written by human + beaver 🦫