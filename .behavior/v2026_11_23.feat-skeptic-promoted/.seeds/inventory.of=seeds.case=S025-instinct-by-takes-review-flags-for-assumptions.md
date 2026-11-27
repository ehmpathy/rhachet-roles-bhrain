# seed S025 · instinct-by-takes-review-flags-for-assumptions

## .said

> why wouldnt the instinct use the same flags as review? it should decide based on rules and refs, but instead of --paths and --diffs theres just the filter to apply on the transcript

> and lets do instinct.by --role --of xyz

> well instinct.by --role --for xyz actually is fine

> so we'd use it as `instinct.by --skeptic --for skepticism` ?

> or instinct.by --skeptic --for assumptions

> yeah, --role skeptic

(the slug was then picked from three offered: `assumptions`.)

> so we'd have an `rhx instinct.of --role skeptic --for assumptions` or --for unquestioned-assumptions ?

(the slug moved to `unquestioned-assumptions`, since `assumptions` also covers a marked `guess:`, which is never flagged.)

> lets do `instinct.of --role skeptic --for unquestioned-assumptions`

> its an instinct of the skeptic to detect unquestioned assumptions

> and we should have another one --for unquestioned-questions

> ey?

> that this time looks at the input and output

> cause we would want to question questions that are asked to it

> as well as questions that the clone asks

## .settled

- `rhx instinct` takes review's flags: `--rules` and `--refs` decide; a transcript filter replaces `--paths` and `--diffs`
- the by-role skill is `instinct.of`, shaped as `review.by`, called `rhx instinct.of --role <role> --for <instinct>`. `.of`, not `.by`: an instinct belongs to its role (the skeptic's instinct to detect unquestioned assumptions), where a review is done by a role. `instinct.by` was tried and dropped
- the skeptic's instinct slug is `unquestioned-assumptions`: `rhx instinct.of --role skeptic --for unquestioned-assumptions`. `assumptions` alone is too wide: it covers a marked `guess:`, which the instinct never flags
- the skeptic has a second instinct, `unquestioned-questions`, which reads the input and the output: a question asked to the clone, answered with its frame and need untested; and a question the clone asks that a read could settle

- superseded in part by S026: the flag is `--to`, the slugs are `question-assumptions` and `question-questions`

## .landed

- `1.vision.yield.md` (`how the subconscious attaches`: the skill table and `the flags are review's, save the target`; research 12)
- `1.vision.experience.case=2.reply-that-gives-up-is-flagged.md`, `case=8`, `case=_`
