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
