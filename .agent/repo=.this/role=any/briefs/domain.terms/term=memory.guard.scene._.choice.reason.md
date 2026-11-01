# domain.term.choice.reason: memory.guard.scene

## .etymology

**scene** — where an act takes place. a segment alone says what runs; its scene says where.

| word | why rejected |
|---|---|
| `context` | overloaded: every procedure here takes a `context` arg |
| `frame` | reads as a stack frame |
| `state` | too wide; a scene is only the cwd set, not shell state |

## .evidence

- `getAllBashSegmentScenes` folds `cd` / `pushd` across segments into each segment's cwd set
- the union across `&&` is held on purpose (fulcrum F12)

## .disputes

none.
