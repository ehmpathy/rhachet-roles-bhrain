# rule.forbid.verdictless-givens-whole-in-conversation

> **a prior peer given that holds no verdict — a malfunction, or a `ConstraintError` refusal — and
> names no concern never rides whole into a later review's conversation. it rides as ONE line.**

a lane's `--conversation` threads its prior givens and takens into every later round's prompt. a
given that faulted carries the fault's stdout and stderr, and none of it is an argument a reviewer
can judge a repair against.

## .why

- **it is paid for every round, forever.** the conversation is append-only, so each faulted round
  rides into every round after it, in every partition of the lane
- **it carries no concern.** with no `blocker.N` / `nitpick.N` named and no count read, there is
  naught for the next reviewer to re-check — only noise that dilutes the points that do count
- **one line keeps all that matters.** the round happened, it faulted, and why. the line names its
  cause where the given printed one (`refused — <cause>`) and the chars it dropped

measured 2026-10-15, over one route's `5.1` stone: 39 of 1,409 givens were verdictless, 129.6k of
4.59M given chars (2.8%). 🟡 **a small lever — and a free one.** the mass of a conversation is in
its readable givens and its takens; a depth bound is the lever for that, never this rule.

## .the test — per given, at the read

> **did the guard read a verdict from it, and does it name a concern?**

| the entry | the read | rides |
|---|---|---|
| a given, count read | a verdict | whole |
| a given, no count, a `blocker.N` / `nitpick.N` named | an argument, tally lost | whole |
| a given, no count, no concern, `ConstraintError: <cause>` | a refusal | one line, names the cause |
| a given, no count, no concern | a malfunction | one line |
| a `.taken` | the driver's argument | whole, always |

⇒ the condition is the guard's own test for `unreadable` (`contract.reviewer-output`), plus one
more — no concern named — so no argument can ever be dropped.

## .where it lives

ONE transformer, `asConversationEntryCondensed`, applied ONCE, in `getOneReviewScopeSettled`, so
every lane and every partition reads the same condensed bytes.

| when… | then… |
|---|---|
| you add a second read path for `--conversation` | 🔴 it must pass through the same transformer, or it re-opens this defect |
| you change how a given is parsed for a count | the condense test changes with it. one regex, `getOneReviewCountsViaRegex` |
| a given faults and quotes a concern | it rides whole. the concern is the point |
| you would condense a `.taken` | 🔴 forbidden. a taken is the driver's answer, and the reviewer re-checks against it |

blocker: a conversation read path that skips `asConversationEntryCondensed` · a verdictless,
concernless given that reaches a prompt whole · a condensed `.taken` · a condensed given that named
a concern.

⇒ see also: `asConversationEntryCondensed` (the transformer) · `getOneReviewScopeSettled` (the one
wire, and its integration clamp) · `contract.reviewer-output` (bhrain/role=reviewer — what
`unreadable` means) · `rule.forbid.suppression-of-undeclared-concerns` (why a named concern is never
dropped).
