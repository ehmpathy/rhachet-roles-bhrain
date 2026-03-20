# self-review round 2: has-questioned-assumptions

## why a second pass?

the first pass identified 6 assumptions. but i moved quickly. let me slow down and look with fresh eyes.

---

## deeper examination: assumption i may have missed

### assumption 7: the error message is the right place to teach

**what do we assume?**
we assume the `--as approved` error message is the right place to add guidance. but is it?

**why this matters:**
- error messages are reactive — agents see them after confusion
- the error message might become too long with all the guidance
- agents in a blocked state may be frustrated, not receptive to learn

**what if the opposite were true?**
if the error message is NOT the right place:
- keep the error short: "only humans can approve"
- put all guidance in boot.yml (proactive)
- let `route.drive` show the options (already does)

**evaluation:**
the wisher's experience suggests the error message IS a critical teachable moment. the agent was confused AT THE ERROR. if we don't teach there, we miss the moment.

however, the vision proposes BOTH: boot.yml (proactive) and error message (reactive). this hedges the bet.

**verdict: REASONABLE — layered approach covers both scenarios**

---

### assumption 8: the statuses we show are the right ones

**what do we assume?**
we assume `--as arrived`, `--as passed`, and `--as blocked` are the statuses agents need to know about when they hit `--as approved`.

**why this matters:**
there may be OTHER statuses we omit:
- `--as rewound` (exists per passage-statuses brief)
- others?

**what if we're incomplete?**
an agent might need to know about rewound. but rewound is typically set by the system or human, not the driver. so it may not belong in "as a driver, you can:" guidance.

**evaluation:**
the vision's open questions section asks: "should the error message include ALL statuses or just the most relevant ones?"

this is acknowledged uncertainty. good.

**verdict: ACKNOWLEDGED — captured in open questions**

---

### assumption 9: agents understand "human" vs "agent" roles

**what do we assume?**
we assume agents understand they are not humans and that some actions are human-only.

**why this matters:**
if an agent doesn't understand the role distinction, they might repeatedly try human-only commands or feel unfairly blocked.

**evaluation:**
the wish's ref shows an agent that DID understand eventually: "i should have recognized that --as passed is different — it's to record that the human approved, not me to do the approval."

the agent understood the distinction after reflection. the error message just needed to make it clearer faster.

**verdict: REASONABLE — agents can learn the distinction with better guidance**

---

### assumption 10: the owl vibe is appropriate

**what do we assume?**
we assume the owl persona (🦉, zen phrases, checkpoint analogy) fits the driver role and aids comprehension.

**why this matters:**
the wisher explicitly requested: "don't forget to drop your iam owl zen wisdom, too"

**evaluation:**
this is an explicit requirement, not an assumption. the wisher wants the owl vibe.

**verdict: NOT AN ASSUMPTION — EXPLICIT REQUIREMENT**

---

## what i found in this second pass

| item | result |
|------|--------|
| assumption 7 | layered approach (boot.yml + error) hedges against "wrong place" concern |
| assumption 8 | incomplete status list acknowledged in open questions |
| assumption 9 | agents can learn role distinction with better guidance |
| assumption 10 | owl vibe is explicit requirement |

---

## summary

the second pass surfaced 4 additional items to examine. none require changes to the vision:
- the layered approach addresses "where to teach" concerns
- incomplete status coverage is already an open question
- role distinction is learnable with guidance
- owl vibe is required, not assumed

the vision holds. i moved slower this time. 🪷
