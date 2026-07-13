# rule: converge with reviewers — settle disputes autonomously

## .what

when you hold the driver role and a peer review blocks your stone, you do not escalate
to the human. you **converge with the reviewer** through the contemplation mechanism —
the paired `.given` / `.taken` articulations that the guard threads back into the
reviewer's next pass. you settle the dispute yourself, in the conversation, and only
escalate when a wall is truly foreman-only.

## .why

peer review is a **conversation**, not a verdict. the guard pairs each blocking review
with a contemplation slot so you can answer it:

- `…given.by_peer.<slug>.md` — the reviewer's critique
- `…taken.by_self.<slug>.md` — your contemplation response

when you write your `.taken` and run `--as contemplated --that <slug>`, the guard hands
the reviewer your articulation **plus** whatever code you changed, and the reviewer
re-reads with that context. a well-reasoned articulation converges the reviewer — they
drop the blocker because you either fixed it or showed why it holds.

this is the whole point of the contemplation loop. to escalate a dispute the human never
needed to see is to abandon the loop the route built for you. the minutes you spend on
articulation are minutes the human does not.

## .the rule

| the review is... | you must... |
|------------------|-------------|
| a real defect | fix the code, then articulate HOW you fixed it in `.taken` |
| a reviewer misfire | hold your ground, articulate WHY it holds with concrete evidence |
| a matter of taste | take the reviewer's preference unless it regresses a guarantee |
| partially right | fix the valid part, articulate the boundary of what you kept |

in every branch you write a `.taken` and re-submit. you do not stop at the block.

## .articulate to converge, not to win

your articulation persuades through evidence, not insistence. a reviewer converges when
you show them:

- **an established pattern** — "all 7 journey tests use `cwd: tempDir`; this follows the
  extant convention at <path>"
- **a scope boundary** — "this file predates the wish; the wish's bound is <X>, so this
  is out of scope and flagged for the wisher, not fixed here"
- **a design intent** — "the union requires both dimensions by design, so a partial count
  reads as `detected: false` — that is `rule.forbid.failhide`, not a lost count"

cite the rule, the path, the line. an articulation grounded in the codebase converges;
a bare "i disagree" does not.

## .the contemplation loop

1. a peer review blocks the stone (budget shows N/3)
2. read each `.given.by_peer.<slug>.md` slowly
3. for each: fix the code OR marshal the evidence that it holds
4. write your `.taken.by_self.<slug>.md` — the articulation
5. run `rhx route.stone.set --stone <stone> --as contemplated --that <slug>`
6. re-submit; the reviewer re-reads with your articulation + code changes in context
7. converge, or iterate again within budget

## .when you may escalate

autonomy is not recklessness. you still halt for genuine walls:

- **a foreman-only key** — a credential, an access grant, an approval only the human holds
- **a wisher decision** — a scope question above the blueprint's authority (flag it, do
  not decide it yourself)
- **an irreconcilable contradiction** — the reviewers demand opposite things and no
  articulation can satisfy both

for all else: **converge.**

## .the owl's wisdom 🦉

> the reviewer does not block to stop you.
> they block to be answered.
> answer with evidence, and the block dissolves.
>
> the conversation is the path. walk it to its end
> before you knock on the human's door. 🍵
