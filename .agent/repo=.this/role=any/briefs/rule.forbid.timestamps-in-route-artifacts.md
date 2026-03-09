# rule.forbid.timestamps-in-route-artifacts

## .what

route artifacts (passage.jsonl, guard artifacts, etc.) must not include timestamps.
dates (YYYY-MM-DD) are fine. timestamps with time precision are not.

## .why

timestamps create false precision and complicate diffs:
- route state is about what happened, not the exact second
- timestamps cause merge conflicts in collaborative work
- simpler data structures are easier to reason about

## .scope

applies to:
- `.route/passage.jsonl` entries
- `.route/*.guard.*` artifacts
- `.route/*.triggered.*` markers
- any route-related persistence

## .pattern

```jsonl
// good — no timestamp
{"stone": "1.vision", "status": "passed"}
{"stone": "3.blueprint", "status": "rewound"}

// good — date only (if needed)
{"stone": "1.vision", "status": "passed", "on": "2026-03-08"}

// bad — timestamp with time
{"stone": "1.vision", "status": "passed", "at": "2026-03-08T12:34:56Z"}
```

## .exception

if temporal order is critical for correctness (not just audit), use git commit timestamps or file system mtime — don't embed in the data.

## .enforcement

timestamp fields (with time precision) in route artifacts = **BLOCKER**
