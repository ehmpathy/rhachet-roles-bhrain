# domain.term.choice.reason: memory.guard.verdict

## .etymology

**verdict** — a judgment handed down on one case. the repo already uses it for a reviewer's
judgment on one artifact (`asPeerGivenVerdict`); the guard's judgment on one call is the same
concept at the `memory.guard` boundary.

| word | why rejected |
|---|---|
| `decision` | generic; does not say a judge produced it |
| `result` | names any return value, not a judgment |
| `outcome` | names what happened after, not what was judged |

## .evidence

- `getMemoryGuardVerdict` returns `{ verdict: 'allowed' } | { verdict: 'blocked'; path; act }`
- the blocked shape carries `act`, never a prose `reason`: the nudge renders the reason from the
  act, so the prose lives in one place (`asMemoryGuardNudge`)

## .disputes

none.
