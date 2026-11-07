# domain.term.choice.reason: memory.guard.unjudgeable

## .etymology

**unjudgeable** — named from the guard's side, as `review.unreadable` is: the guard reports what
it could not do, never what the sender did wrong.

| word | why rejected |
|---|---|
| `invalid` / `malformed` | asserts the harness erred; `{}` is valid json the guard simply cannot judge |
| `unparseable` | wrong for `{}` and `null`, which parse |

## .evidence

- `asToolInvocation.test.ts`: `{}`, `[]`, `null`, a renamed key each give
  `unjudgeable: 'tool payload has no tool_name'`; non-json gives `'tool payload is not json'`
- the outcome: a guard that cannot judge never halts; the call passes, exit 0

## .disputes

none.
