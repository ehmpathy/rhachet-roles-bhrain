# seed S026 · instinct-of-to-question-nudges-toggled

## .said

> maybe `instinct.of --role skeptic --to question-assumptions` and `instinct.of --role skeptic --to question-questions`

> and it operates as a nudge that reminds the conscious brain to do that instinct

> and so when the daemon runs `instinct.of --role skeptic`, it will do both

> where in the future we can generalize this to also give the learner an `instinct.of --role learner --to learn-terms` and etc

> with another requirement being the ability to turn the instinct daemon on and off

> so that we can throttle costs

> e.g., in blueprint review and vision review, we probably want that on. when a blocker comes up, on. if just in code execution, off.

> so we want to be able to enable and disable it

> e.g., instinct.of --role skeptic set --as enabled|disabled

> and instinct.of --role skeptic get

> to get status

> and instinct.of --role skeptic del to del the daemon

## .settled

- the instinct flag is `--to`, not `--for`: `rhx instinct.of --role skeptic --to question-assumptions` and `--to question-questions`. the slug names the act the seat is reminded to do
- a flag is a nudge: it reminds the conscious brain to do the instinct itself, never a verdict, never a block
- `rhx instinct.of --role skeptic`, with no `--to`, runs every instinct the role declares, as `review.by` with no `--for` runs every rubric
- the foundation knows no role: the learner can declare `--to learn-terms` later, with no foundation change (out of this route's scope)
- the daemon is toggled to throttle cost, by verbs on `instinct.of` itself: `set --as enabled|disabled`, `get` for status, and `del` to remove the daemon, its entry, and its state. disabled by default, as `learn.terms.hook` is off until asked
- the toggle is enable and disable, run by the human or the seat: on at a vision or blueprint review, on while a blocker is open, off in code execution. no automatic phase state

## .landed

- `1.vision.yield.md` (`how the subconscious attaches`)
- `1.vision.experience.case=2.reply-that-gives-up-is-flagged.md`
- `src/domain.roles/skeptic/briefs/define.skeptic.instinct-via-subconscious.md`
