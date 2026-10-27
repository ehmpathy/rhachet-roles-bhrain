# F2 — uuid / `@current` search `$CLAUDE_CONFIG_DIR` then `~/.claude` only

- **fork**: (a) those two roots · (b) also every `.agent/.actors/*/brain/.claude` under every repo
  on the machine · (c) `~/.claude` only, as today
- **taken**: (a). (c) cannot see this very session — measured: `$CLAUDE_CONFIG_DIR` points into
  `.agent/.actors/actor.via.hash=8464b0ac/brain/.claude`. (b) needs a machine-wide walk with no
  bound on where repos live. a path or a glob still reaches any root, so (a) loses no transcript,
  only convenience.
- **rework**: clean — the root list is one array in one operation.
- **confidence**: 80% — "any transcript on the machine" in the wish could mean (b).
- **where**: `1.vision.yield.md` · .the contract; open question 6
- **verdict**: —

## .retracted — a question for the commander

a vision call of a big behavior, best-guessed past rather than asked. withdrawn as a guess; it now
waits on the commander at review. the code holds (a) until ruled, and a ruling of (b) or (c) is a
one-array rework.

**question:** when `--from` is a uuid or `@current`, which roots does the tool search?

| option | what | cost |
|---|---|---|
| (a) | `$CLAUDE_CONFIG_DIR`, then `~/.claude` | misses a transcript in another actor's brain dir; a path or glob still reaches it |
| (b) | (a) plus every `.agent/.actors/*/brain/.claude` in every repo on the machine | a machine-wide walk with no bound on where repos live |
| (c) | `~/.claude` only, as before | cannot see an actor-brain session, this one included |

**lean:** (a) — it sees the current session, stays bounded, and loses no transcript a path names.
