# F5 — fix `getTranscriptSource`'s hardcoded root at source, shared with this tool

- **fork**: (a) lift root discovery into one shared operation, used by both `reflect.snapshot` and
  `reflect.tokens` · (b) give `reflect.tokens` its own root list, leave `getTranscriptSource` alone
- **taken**: (a). `getTranscriptSource.ts:46` reads `os.homedir()` only, so `reflect.snapshot`
  in an actor-brain session finds no transcript — the same defect this tool must not have. a
  second root list beside the first is a braided trail.
- **rework**: clean — one constant becomes one small operation; callers keep their signature.
- **confidence**: 85% — it touches a shipped skill, so its integration tests must cover both roots.
- **where**: `1.vision.yield.md` · groundwork, internal research
- **verdict**: —

## .retracted — a question for the commander

a vision groundwork call best-guessed past rather than asked. withdrawn as a guess; it now waits on
the commander at review. the code holds (a) until ruled.

**question:** does this behavior repair the shipped `reflect.snapshot` root lookup, or keep to its
own tool?

| option | what | cost |
|---|---|---|
| (a) | lift root discovery into one shared operation, used by `reflect.snapshot` and this tool | widens the diff into a shipped skill and its tests |
| (b) | this tool gets its own root list; `getTranscriptSource` is left alone | two root lists drift; `reflect.snapshot` keeps its actor-brain blind spot |

**lean:** (a) — one root list, and the shipped skill's defect is the same one this tool must not
have.
