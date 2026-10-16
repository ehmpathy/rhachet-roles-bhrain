# domain.term.choice.reason: eviction

## .etymology

`eviction` is the cache literature's own word for the drop, and its policies carry its names:
an "lru eviction policy", a "fifo eviction policy". the measurement's whole question is which of the
two the provider runs, so the noun that names the act is the noun those two policies modify.

rejected:

| rejected | why |
|---|---|
| `expiry` | presumes one fixed deadline after the write. that is one of the two policies under test, so the word would answer the question it names |
| `purge` | names a wipe the owner asks for. the provider evicts on its own policy, unasked |
| `miss` | names what a later request meets. an eviction is the cause; a miss is one symptom, and a miss also follows a replica swap with no eviction at all |

## .the boundary

"eviction, of WHAT?" answers "of a prefix, from a provider's prompt cache" in one segment:
`prompt.cache`. it sits beside `touch`, its counterpart: a touch refreshes residency, an
eviction ends it, and the policy decides whether the first can postpone the second.

## .evidence

- the experiment shape: a treated arm (poked at t+45m) and a control arm (never poked), both
  read at t+90m. a hit on the treated arm alone falsifies `fifo-by-insert`
- the measured premise: a warmer's poke hit in full (`research.review-cost-and-cache`, "the
  warmer's own poke, measured") — a read refreshes residency, which is `lru`

## .disputes

none.
