## .what

require a `## .tl;dr` at the top of every `1.vision.yield.md` (the vision stone's template and its guard), raised in review of ehmpathy/rhachet-roles-bhrain#693 (comment 4371947954).

the tl;dr demonstrates the heart of the fix in max signal, min noise:

- one line: the defect, stated as cause
- the smallest artifact that shows the change — a before/after diff, a before/after output
- one line: what the fix is, and what it is not

## .why

- a reviewer reads the top of the vision first; the heart of the change must sit there, not after the reframe and the root-cause tables
- a demonstration (a diff, an output) is verifiable at a glance; prose about it is not

## .the worked case

ehmpathy/rhachet-roles-bhrain#693, `.behavior/v2026_10_23.fix-judge-pass-exhausted-all-better/1.vision.yield.md` — the tl;dr shows the stance key before/after (an absolute path vs the given filename) and the judge verdict before/after (`passed: false` vs `passed: true … after 3 blockers shed`).

## .enforcement (proposed)

- a `1.vision.yield.md` with no `.tl;dr` at the top = blocker
- a tl;dr in prose with no demonstrated artifact = nitpick
