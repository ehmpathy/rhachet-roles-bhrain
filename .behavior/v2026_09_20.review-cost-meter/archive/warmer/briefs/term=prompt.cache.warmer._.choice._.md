# domain.term: warmer

term.chosen   = warmer
term.kind     = noun            # an AGENT noun — the agent that pokes, never the poke
term.boundary = prompt.cache    # it keeps one replica's prefix resident
term.synonyms.forbidden:
- keep-alive        # the http false friend: that holds a SOCKET, this holds no connection
- poker             # a card game, and it reads as one
- refresher
- cache daemon      # names the mechanism, never the motive

## .what

a **warmer** is the agent that schedules `poke`s for **one reviewer**, so that lane's prefix
stays resident between rounds.

```
one warmer  ──▶  k pokes, m minutes apart  ──▶  one reviewer's replica
```

four properties define it, and each parts it from a neighbour:

- **it is an AGENT, never an act.** one `poke` is one call; a warmer is the process that sends
  `k` of them and then exits. *"three pokes"* counts calls; *"three warmers"* counts processes
- **its unit is ONE REVIEWER.** each lane's head is its own rubric, so each derives its own
  affinity key and lives on its own replica. there is no grove warmer and no tree warmer —
  a prefix warmed for `mech-decode-friction` is not resident for `repo-rules` and never could be
- **it is BOUNDED before it starts.** `k` pokes, declared up front, then it exits. it never
  polls for a round that may never come, so an abandoned route's exposure is a known figure
- **it spends with no invocation to attach the spend to.** that is what makes it the repo's
  first `agency = engine` act, and why every poke owes a durable row

## .the schedule counts touches, and a real review is one

a warmer's clock does not run from its own last poke. it runs from the last time either act
touched that reviewer's prefix — a poke or a nominal `rhx review` alike.

| since the last touch | the warmer |
|---|---|
| `>= m` minutes | pokes, and counts the attempt |
| `< m` minutes | defers and re-aims at `lastTouch + m` — a poke now buys naught and bills in full |

a deferral spends no money and protects no bytes, so it does not advance the attempt
counter. to count one would retire a warmer that never poked at all.

## .refs

- `src/domain.operations/review/warmer/setReviewWarmerPokes.ts`   # the loop
- `src/domain.operations/review/warmer/genReviewWarmer.ts`        # the findsert spawn
- `src/domain.operations/review/warmer/asReviewWarmerPlan.ts`     # `off | on | <k>x,<m>m`
- `src/contract/cli/review._.warmer.ts`                           # the detached entrypoint
- `.agent/.cache/repo=bhrain/role=reviewer/skill=review/warmers/reviewer=$xyz/`

## .reason

see the ref-level cluster beside this choice:
- `term=prompt.cache.warmer._.choice.reason.md` — the etymology, the dispute that freed the
  word from `poke`'s forbid list, and why `keep-alive` was superseded
