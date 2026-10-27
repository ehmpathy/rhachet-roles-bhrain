# F33 — acceptance faults are injected at a tool boundary, never in the code under test

- **the fork:** two acceptance suites must reach fault paths a real run cannot provoke on demand:
  a harness cancel mid-render, an integrity mismatch, a `git diff` or `git apply` fault. (a) leave
  those paths unproven · (b) inject the fault at the boundary, and let every other call run real
- **taken:** (b). the `gen.consumer-patch` shims sit on PATH ahead of `openssl` and `git`, fault
  exactly one subcommand, and `exec` the real binary for all else. the `routeStatusLine` preload
  sends the process its own SIGTERM at the render, the cancel the harness sends; the hang variant
  holds the render open so the grace timer is what ends it. the cached step, the cache write, and
  the line are the real code throughout. each is documented inline
- **rework:** clean — the shims and the preload are test-local
- **confidence: 80%**
- **where:** `blackbox/gen.consumer-patch.acceptance.test.ts`,
  `src/contract/cli/routeStatusLine.acceptance.test.ts` [case21]
