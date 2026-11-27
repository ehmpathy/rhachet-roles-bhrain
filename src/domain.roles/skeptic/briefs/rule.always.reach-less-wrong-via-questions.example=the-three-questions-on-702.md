# rule.always.reach-less-wrong-via-questions.example=the-three-questions-on-702

> row: each answer is a new claim. 2026-11-18, nheuron. one claim about rhachet skill mods, moved by one read. two more questions stand open, each with its source named.

## .the shape, in any life

a friend asks, "should we buy a tent for the trip?" one look in the garage finds a tent, and a new question: does it sleep four? what did one look change in my answer, and what does it leave open?

the case below: one read turned a yes/no on a new task into a narrower claim with two named questions.

## .the claim, at the start

rhachet may need a new task to support pnpm-patch style skill mods (the human's question, inbox 2026-11-18, taken as a claim to test).

## .the three questions

| # | the question | the read | the claim after |
|---|---|---|---|
| 1 | does rhachet already track a mod of a consumed role? | `rhx radio.task.pull --via gh.issues --from ehmpathy/rhachet --exid 702` | yes: #702, `feat(roles): mod a consumed role in place, via .agent/repo=.mods`. no new task is owed for the base feature |
| 2 | does #702 cover a patch of one skill file, as pnpm patch covers one package file? | read the body of the issue (`rhx git.repo.get`, or the radio render) | open: the title names a mod "in place"; the body decides whether a file-grain patch is in scope |
| 3 | does the in-tree overlay (`repo=.mods`) already hold a patch of a skill? | read the overlay dir in the tree that carries it | open: read it, then state the claim |

questions two and three are open in this record. the point is the shape: the claim at the start was a yes/no on a new task; after one read it became a narrower claim with two named questions, each with a source.

## .the cost

none paid: the read ran before the answer went out. the cost avoided was a duplicate task.

## .the lesson, by law

- the claim did not reach "correct" and does not need to; it reached "less wrong than the start", and it names what moves it next
- a record that stops at question one has the cheapest win and the largest doubt left. that doubt is the work for tomorrow

up: `rule.always.reach-less-wrong-via-questions`
