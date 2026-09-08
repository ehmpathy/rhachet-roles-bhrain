# domain.term.choice.reason: emit

## .etymology

latin *emittere*, "to send out". the word already carries the sense this repo needs — what
a source sends to whoever is there to receive it — and it is **stream-neutral**, which is
the property every rejected candidate lacks.

it names one cli surface across two channels, so a operation that stabilizes, formats, or
asserts against that surface takes one param rather than two.

## .why each synonym is forbidden

| the candidate | why it loses |
|---|---|
| `output` | reads as the opposite of `input`, and this repo's operations already take an `input` param. `output` would name a return value in one breath and a stream in the next — a live overload |
| `print` | names the ACT alone, so it cannot serve as the noun. and it implies stdout, which is exactly the narrow read that caused the defect below |
| `render` | already taken by the tree formatters, which render a STRING. a render becomes an emit only once a command hands it over |
| `message` | a message has one recipient and one body. an emit has two channels and often carries no prose at all |

## .the measured case — a param named for one stream, handed the other

`asStableGuardEmit` took a param called `stdout` until 2026-09-04. it swaps run-unique
tokens — a temp root, an 18-hex hash, an elapsed duration — and **every one of those tokens
appears on both streams**, so the operation was never stdout-specific.

the defect surfaced the moment a caller had to stabilize a stderr block for a snapshot:

```ts
asStableEmit({ stdout: out.stderr, route: scene.tempDir })
```

that line is correct and reads as a defect at every later glance — the exact hazard
`rule.forbid.ambiguous-labels` names. the param was renamed `emit`, and the rename
immediately found a **fourth drifted copy** of the stabilizer that the type error exposed.

⇒ the narrow word did not merely read poorly. it hid a duplicate.

## .evidence

- discovery: enumeration of the declared surface — one dobj (`ContextCliEmit`) plus four
  dops (`genContextCliEmit`, `formatRouteStoneEmit`, `genStoneGuardBlockedEmit`,
  `asStableGuardEmit`). a root term with five dependents and no cluster
- precedent: `term=stdout.body` was already itemized, which is the **narrower** term. a
  glossary that holds the part and not the whole cannot say what the part is part of
- the gap was the third of its class in two days, after `given`/`taken` and `slug` —
  each found at authorship time by the same check: *"what words does this contract
  declare that the glossary does not hold?"*

## .invariants

- an emit has at most two channels, `stdout` and `stderr`, and either may be absent
- a operation that reads or transforms an emit takes the **text**, never the channel name
- the channel a byte travels on is chosen by ROLE — guidance to stdout, evidence to
  stderr — never by outcome
