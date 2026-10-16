# F224 — a then may assert the facets of one claim

## .the fork

`howto.write-bdd` asks for one behavioral assertion per `then`. a lane read that as one `expect` per
`then`, and flagged `then('each slug shows its globs and its cost')` in
`blackbox/review.partition.acceptance.test.ts`, which checks four substrings of one render.

two answers: **(a)** split into one `then` per `expect` · **(b)** hold — the `then` names one
behavior, and the `expect`s are its facets on one output

## .taken

**(b)**. the unit of the rule is the **behavior** the `then` names. *"each slug shows its globs and
its cost"* is one claim about one render; its four substrings are what that claim means. a split
would name four `then` blocks after fragments (`'it contains total:'`) that no reader would call a
behavior, and each would pass alone while the claim they compose went unread. the lane itself grants
the peer cases as *"acceptable as one claim"*.

## .rework

**clean.** a split is local to the case.

## .confidence

🟡 **85%** — a matter of the rule's unit, read from its own text.

## .where

`blackbox/review.partition.acceptance.test.ts` · `blackbox/driver.route.partition-journey.acceptance.test.ts`

## .verdict

unruled — awaits the council.
