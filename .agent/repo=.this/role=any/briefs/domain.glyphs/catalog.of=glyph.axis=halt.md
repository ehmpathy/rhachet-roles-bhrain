# catalog.of=glyph.axis=halt

## .what

the glyphs that mark **why a route stopped, and how a human helps.** each pairs with a halt-word
that names the cause, so the glyph triages urgency and the word gives the fix.

declared in `src/domain.operations/route/statusLine/asStatusLine.ts`, `asHaltParts`, and in
`getReviewSkipReport.ts`.

## .the members

| glyph | halt-word | the human's move |
|---|---|---|
| 👋 | `approved?` | grant approval — `rhx route.stone.set --as approved` |
| 👋 | `exhausted` | extend budget, or overrule |
| ✋ | `blocked` | clear a wall only you can clear |
| 💥 | `malfunction` | fix a break — the review could render no verdict |
| 🌙 | `skipped` | none — a review that never ran, reported honestly |

```
🗿 5.3.verification, judge, approved? 👋
🗿 5.1.execution.from_vision, review.peer, l3@i002, blocked ✋
🗿 5.1.execution.from_vision, review.peer, l3@i002, malfunction 💥
```

## ⚠️ .👋 marks two halt-words on purpose

`approved?` and `exhausted` share 👋 because the human's move is the same **kind** of move — a
grant. one grants approval, the other grants budget. ✋ and 💥 are reserved for the two halts that
are **not** grants: a wall, and a break.

⇒ the glyph triages *what kind of help*; the word says *which*.

## ⚠️ .a `constraint` is not a malfunction

a rejected credential, a set circuit breaker, an absent supply — these are **legitimate holds the
process chose to report**, and they carry their own fix. 💥 is reserved for a process that could
render no verdict at all.

⇒ to grade a constraint as a malfunction routes the reader wrong: *the tool is broken, diagnose
it* instead of *a hold stands, satisfy or lift it*
(`term=route.guard.review.malfunction`, `rule.require.exit-code-semantics`).

## .see also

- `catalog.of=glyph.axis=phase.md` — the calm axis this one replaces on a halt
- `catalog.of=glyph._.md` — the index across every axis
