# F1 — freshness = stat of the named render inputs + a 30s max age

- **the fork:** (a) stat the paths the render reads, plus a max age · (b) a pure time debounce
  (cache N seconds, no stat) · (c) hash file contents
- **taken:** (a). (b) lags a passage change by up to N seconds, which the wish bounds at "a second
  or two"; (c) reads every file per repaint, which is the cost to remove
- **and within (a):** an allowlist of the render's own files, not every file in `.route/` — hooks
  write `.drive.blockers.latest.json` (+ a `.lock`) and `.bouncer.cache.json` there on each stop
  and tool call, which would bust a whole-dir fingerprint while a seat works
- **rework:** clean — the fingerprint is one function; its input list can grow or the max age move
- **confidence: 85%**, low because a render input added later must also join the fingerprint;
  the 30s max age bounds the harm of that miss
- **where:** the new status-line cache read
