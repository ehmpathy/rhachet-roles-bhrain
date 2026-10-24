# F22 — a cache fault speaks on stderr alone, on the read side and the write side

- **the fork:** an unreadable or unwritable cache restores the full per-repaint cost. (a) one
  stderr row per repaint that names the code, the path, and the fix; the line prints unchanged ·
  (b) also mark the line itself, so a human sees the fault in the seat
- **taken:** (a). the wish bounds the change: no change to what the status line shows. stdout is the
  line and naught else; stderr is where every status line fault already speaks (the multi-bind row,
  the degrade row). an unreadable cache file is a miss, as the vision states: the line renders, the
  write replaces the file, and the next repaint hits. acceptance `[case17]` snaps the write row;
  integration `[case5c]` clamps the read side
- **against:** the harness hides stderr, so a seat with an unwritable cache pays the old cost with no
  signal a human sees in the seat
- **rework:** clean — append a glyph to the line when `cacheReadFault` or `cacheWriteFault` is set
- **confidence: 80%**
- **where:** `contract/cli/route.status.line.ts`, `statusLine/asStatusLineCacheWriteFaultRow.ts`,
  `statusLine/asStatusLineCacheReadFaultRow.ts`
