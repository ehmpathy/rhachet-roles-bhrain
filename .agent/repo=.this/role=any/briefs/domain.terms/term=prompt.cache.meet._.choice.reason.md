# domain.term.choice.reason: meet

## .etymology

`meet` is the plain word for peers who arrive apart and gather at one place before they set
out together. the lanes of a pour are separate processes ~62ms apart; they gather on one
watermark, and one of them goes first. the code named the act `meet` from its first draft
(`genReviewPrefixPrime`'s meet, the `ENV_OF_REVIEW_PRIME_MEET` env), so the word was already the
repo's own before it was itemized.

rejected:

| word | why not |
|---|---|
| `barrier` | a barrier holds every party until all arrive. a meet does not: a lane that finds no peer within the gather window pours `solo` |
| `rendezvous` | names the place, not the outcome a lane leaves with — and the outcome is what the meter reads |
| `handshake` | implies two parties and an exchange; a meet has N lanes and one poke |
| `sync` | overloaded across this repo (git, fs, clocks), so it fails `rule.forbid.domain-term-ambiguity` |

## .boundary

`prompt.cache`, beside `poke`. the meet exists only to decide which lane warms the cache and
whether the rest may read it; it says naught about the review's verdict. `review` was weighed
as the boundary and set aside: the review is what the meet serves, not what it is.

## .evidence

- the outcome set is closed and enumerated in `ReviewRunMeet` (`IS_REVIEW_RUN_MEET`, a Record
  over the union, so a new outcome fails compile until listed)
- every breadth of `rhx review._.cost` renders the meet: `--of run` names it, `--of tree` and
  `--of grove` count runs, spend, and cache rate by it
- the warm pair (`primed`, `awaited`) is the one place the lane grade and the pair verdict
  both read the meet (`getAllLaneOrdinals`, `getOnePrefixVerdict`), so the two cannot grade
  one round two ways
