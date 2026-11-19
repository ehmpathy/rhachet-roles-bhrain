# F1 — when-written rides the file mtime, not a json field

- **the fork:** (a) a `writtenAt` field in the json, as the wish names; (b) no field — the file's
  own mtime says when it was written
- **taken:** (b). `rule.forbid.timestamps-in-route-artifacts` forbids a time field in a route
  artifact, and the bash reader cannot compare an iso string without a process; it compares
  mtimes with the `-nt` builtin. pr #700's cache made the same call (age by fstat, no `at` field)
- **rework:** clean — add one field to the writer; the reader ignores it
- **confidence:** 85% — the wish names the field explicitly, so the wisher may want it for a
  reader other than the status line
- **where:** `1.vision.yield.md`, awkward #2
- **verdict:** —
