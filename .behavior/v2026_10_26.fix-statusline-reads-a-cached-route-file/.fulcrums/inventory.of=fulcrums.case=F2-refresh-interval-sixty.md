# F2 — refreshInterval 60 reads the wish's "at most once a minute"

- **the fork:** (a) "at most once a minute" bounds how often a seat reads — but the harness runs
  the command on every assistant message, which no config can throttle; (b) it bounds how stale
  an idle seat may be — `refreshInterval: 60` re-reads once a minute when no message arrives
- **taken:** (b). once a repaint costs a bash fork, a per-message read is free; the minute only
  matters for a seat that sits idle while another process moves its route
- **rework:** clean — one number in `init.claude.status-line.jsonc`
- **confidence:** 80% — (a) is the literal read; it is unachievable through the harness, so (b)
  is likely the intent, not certainly
- **where:** `1.vision.yield.md`, the contract
- **verdict:** —
