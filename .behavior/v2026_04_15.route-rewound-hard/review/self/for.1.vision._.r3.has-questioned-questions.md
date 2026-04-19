# self-review r3: has-questioned-questions

tea first. deeper reflection. 🍵

## re-examining each question

### question 1: nested stone patterns — [answered]

**original question:** should `--mode hard` also delete nested stone yields?

**my r2 answer:** yes, each stone's exact yield is deleted.

**r3 deeper look:**

let me trace through a concrete example:

1. route has stones: `1.vision`, `2.criteria`, `3.blueprint`, `3.1.research.api`, `3.2.research.ux`
2. each stone may have a yield: `1.vision.yield.md`, `3.1.research.api.yield.md`, etc.
3. if `3.blueprint` is rewound:
   - cascade includes: `3.blueprint`, `3.1.research.api`, `3.2.research.ux`, and all stones with prefix >= 3
   - for each cascaded stone, check if `$stone.yield.md` exists
   - if exists, delete it

**verification against wish:**
- wish says "for all the stones that got rewound when hard mode"
- wish says "drop those execution.yield.md files"

**conclusion:** my answer is correct. each stone in the cascade has its own yield deleted. no glob needed — just exact `$stone.yield.md` for each affected stone.

**fix in vision:** clarified exact pattern (already done in r2).

### question 2: git soft/hard analogy — [answered]

**original question:** is the git soft/hard analogy the right mental model?

**my r2 answer:** marked as [wisher].

**r3 deeper look:**

could i have answered this myself? let me think about alternative mental models:

| model | soft | hard | fits? |
|-------|------|------|-------|
| git reset | keep staged | discard all | yes |
| undo levels | single undo | undo all | partial |
| draft vs final | keep draft | discard | partial |

the git model is the closest fit because:
- both soft and hard relate to "how much to preserve"
- the terminology is already familiar to developers
- the semantics align (soft = safe, hard = destructive)

**update:** wisher chose `--yield drop|keep` instead of git's `--mode soft|hard`.
- more explicit than git analogy
- reads as intent (`--yield drop` vs `--mode hard`)
- avoids collision with `--mode plan|apply` used elsewhere

**conclusion:** [answered] via wisher feedback. vision updated.

### question 3: confirmation prompt — [answered]

**original question:** should there be a confirmation prompt for `--mode hard`?

**my r2 answer:** no, the explicit flag is the confirmation.

**r3 deeper look:**

what are the risks of no confirmation?
- accidental `--mode hard` in an automated command
- typo in interactive use
- misunderstand what hard does

what are the mitigations?
- explicit flag requires deliberate action
- soft is default (must opt-in to hard)
- git history provides recovery
- passage.jsonl provides audit trail

what does git do?
- `git reset --hard` has no confirmation
- `git clean -f` requires -f flag (force)
- `git push --force` has no confirmation

**conclusion:** git precedent supports no confirmation. the explicit flag IS the confirmation. answer holds.

## summary of review

| question | triage | verification |
|----------|--------|--------------|
| nested stone patterns | [answered] | traced through concrete example, confirmed |
| git soft/hard analogy | [answered] | wisher chose `--yield drop\|keep` |
| confirmation prompt | [answered] | git precedent supports, answer holds |

all questions answered. vision updated with wisher's flag choice.
