# F7 — how two writers of one route converge on the newest line

- **the fork:** two writers race (a guard round, a stone set). if the older render renames last,
  the file holds an older line with the newest mtime, and the reader's stale test cannot see it.
  (a) a short per-route `withSimpleMutex` hold over render + rename, as
  `rule.require.locks-via-with-simple-mutex` prescribes for any lock; (b) lock-free: each writer,
  after its rename, re-checks the ledgers it rendered from and renders again if any grew since its
  render began
- **taken:** (b). no lock means no lease to size and no holder to crash; each writer converges on
  the ledgers as they stand when it last looks, so whichever finishes last holds the newest state.
  it costs a re-render only when a race actually happened. (a) is the fallback if (b) proves to
  loop under a busy guard
- **rework:** clean — the cure lives inside the one writer operation; the reader, the file format,
  and the clamp do not change
- **confidence:** 85% — the convergence argument is sound for append-only ledgers, but the ledgers'
  growth must be read cheaply (size, not mtime, since appends in one second may share an mtime);
  execution must prove it with a race clamp
- **where:** `1.vision.yield.md`, edge cases; `1.vision.experience.dimensions.md`, the D6 collapse rule
- **verdict:** —
