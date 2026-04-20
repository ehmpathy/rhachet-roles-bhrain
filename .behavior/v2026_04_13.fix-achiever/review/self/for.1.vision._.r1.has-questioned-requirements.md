# self-review: has-questioned-requirements

## requirement 1: add achiever briefs / onBoot hook

**who said this was needed?** the wisher, in 0.wish.md item 1 and 5.

**evidence:** boot.yml already exists and boots briefs at session start. the gap is post-compaction refresh.

**what if we didn't do this?** after compaction, brains would lose context about goals and how to use them. they'd have to re-discover the workflow each time.

**could we achieve this simpler?**
- option: rely on extant boot.yml — but that only fires once at session start, not after compaction
- option: embed goal state in the conversation — but that bloats context
- **conclusion**: onBoot hook is the right mechanism. holds.

---

## requirement 2: discourage --scope repo

**who said this was needed?** the wisher, in 0.wish.md item 2.

**evidence:** scope detection via `getRouteBindByBranch()` already exists. the --scope flag is redundant when auto-detection works.

**what if we didn't do this?** brains would continue to pass `--scope repo` explicitly, which is verbose and error-prone.

**scope question:** should we fully remove --scope or just deprecate?
- removal is a break change
- deprecation adds warn noise but is backwards-compatible
- **conclusion**: deprecate first, remove in next major. holds.

---

## requirement 3: clearer skill headers/help

**who said this was needed?** the wisher, in 0.wish.md item 3 and 7.

**evidence:** current headers are terse. they lack examples and best practices.

**what if we didn't do this?** brains would struggle to use goals correctly. they'd guess at syntax and make errors.

**is the scope too large?**
- we're not rewrite all skills, just the achiever skills
- **conclusion**: scoped appropriately. holds.

---

## requirement 4: clearer "do the work" message (escalation)

**who said this was needed?** the wisher, in 0.wish.md item 4.

**evidence:** route.drive has blockers.json that tracks repeated blocks and escalates messages. goals lack this.

**what if we didn't do this?** brains would receive the same gentle reminder every time. they might ignore it.

**could we achieve this simpler?**
- option: just make the message longer — but that's noise, not signal
- option: add counter-based escalation — that's the proposed approach
- **conclusion**: escalation is the right pattern. holds.

---

## requirement 5: onBoot hook for goal.triage.next

**who said this was needed?** the wisher, in 0.wish.md item 5.

**evidence:** goal state persists in .goals/ but context doesn't. after compaction, brain loses awareness.

**is this the same as requirement 1?**
- requirement 1 is about briefs (teach the workflow)
- requirement 5 is about goal state (remind what's unfinished)
- **conclusion**: distinct but related. both hold.

---

## requirement 6: forbid unknown args

**who said this was needed?** the wisher, in 0.wish.md item 6.

**evidence:** current implementation may silently ignore unknown args. this hides user errors.

**what if we didn't do this?** typos like `--satatus` instead of `--status` would silently fail.

**is this complex?** no, it's a simple validation check. holds.

---

## requirement 7: better --help output

**who said this was needed?** the wisher, in 0.wish.md item 7.

**evidence:** --help should be comprehensive with yaml examples.

**is this redundant with requirement 3?**
- requirement 3 is about skill headers in the .sh file
- requirement 7 is about runtime --help output
- **conclusion**: distinct but related. both hold.

---

## summary

all seven requirements questioned. all hold.

| requirement | verdict | reason |
|-------------|---------|--------|
| 1. achiever briefs / onBoot hook | holds | post-compaction refresh is a real gap |
| 2. discourage --scope repo | holds | auto-detection is better ux |
| 3. clearer skill headers | holds | current headers lack examples |
| 4. escalation messages | holds | repeated gentle reminders get ignored |
| 5. onBoot for goal.triage.next | holds | distinct from briefs, refreshes state |
| 6. forbid unknown args | holds | fail-fast prevents silent errors |
| 7. better --help output | holds | runtime help distinct from file headers |

no requirements need removal or modification based on this review.
