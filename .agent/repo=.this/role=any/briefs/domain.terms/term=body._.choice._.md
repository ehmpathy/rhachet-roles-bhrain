# domain.term: body

term.chosen   = body
term.kind     = noun
term.synonyms.forbidden:
- content
- payload
- guts

## .what
the **body** of a captured skill stdout is its own payload — the lines the skill itself emitted —
as distinct from the `🪨 run solid skill …` dispatch banner the rhx harness stamps around it. a
review's body opens on its `🦉 let's review` header and runs through its `summary`; the banner is
NOT part of the body.

the distinction carries weight for disintermediation: when `review.by --for` re-emits a base
review verbatim, it strips the inner dispatch banner and re-emits only the review body
(`asReviewBodyStdout`), so a guard-dispatched `review.by --for` shows one banner + the body — the
same shape as a direct review peer, not a doubled banner.

## .refs
where the term composes declared objects & operations:
- src/domain.operations/review.by/asReviewBodyStdout.ts   # the transformer that yields the body

## .reason
see the ref-level cluster beside this choice:
- `term=body._.choice.reason.md` — etymology, and why `body` over `content`/`payload`
