# domain.term.choice.reason: memory.guard.act

## .etymology

**act** — what the call does to memory. short, and it names the deed, not the guard's opinion of it.

| word | why rejected |
|---|---|
| `action` | collides with the tool call itself ("the action") |
| `kind` / `operation` | too wide; every call has a kind |
| `reason` | 🔴 the shape it replaced. a prose reason in the verdict split the render across two places; an enum act lets the nudge own all prose |

## .evidence

- enumerated before named (`rule.require.enumerate-before-you-name`): every blocked row in
  `getMemoryGuardVerdict.test.ts` sorts into exactly one of write, copy, unplaced
- each act has its own nudge snapshot (`asMemoryGuardNudge.test.ts.snap`)

## .disputes

none.
