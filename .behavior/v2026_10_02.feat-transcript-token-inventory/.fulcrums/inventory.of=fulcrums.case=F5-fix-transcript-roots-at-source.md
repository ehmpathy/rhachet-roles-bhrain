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
