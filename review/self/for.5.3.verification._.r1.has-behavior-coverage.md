# self-review: has-behavior-coverage

## question: does every behavior in wish + vision have a test?

i walked the wish and vision and mapped each promised behavior to its test. findings below.

### wish behaviors → tests

| wish behavior | test coverage | verdict |
|---------------|---------------|---------|
| statusline phase suffix (yield/review.self/review.peer/judge) | routeStatusLine.acceptance case2,6,7,8,9 + asStatusLine.test | ✅ covered |
| attention-color emoji per phase (🌾🔍👋✋💥) | routeStatusLine.acceptance case6-15 (each snaps the glyph) | ✅ covered |
| `r7/r10` self-review counter | asStatusLine.test + routeStatusLine.acceptance case6 (`r1/r2`) | ✅ covered |
| `l3@i002` peer level@rounds | asStatusLine.test + routeStatusLine.acceptance case7 (`l1@i002`) | ✅ covered |
| `judge, approved? 👋` approval halt | routeStatusLine.acceptance case8 | ✅ covered |
| complete 🎉→🌴🤙 swap | asStatusLine.test case4 + drive/rewind blackbox snapshots | ✅ covered |
| blocked clears on re-arrival (stale halt) | stepRouteDrive.integration + asStoneDisposition.test | ✅ covered |
| exhausted as its own status → 👋 | routeStatusLine.acceptance case11 + setStoneAsPassed.exhausted.integration | ✅ covered |
| forward-motion-clears-blocker (every --as writes passage) | setStoneAsPromised.test + setStoneAsContemplated.test + setStoneAsPassed arrived-entry (failsafe acceptance now asserts last-wins) | ✅ covered |
| onStop push/halt parity with statusline | stepRouteDrive.integration case10-13 + asStoneDisposition (shared) | ✅ covered |

### vision render matrix → acceptance cases

every row of the vision's render matrix maps to a dedicated acceptance case with a snapshot
(case1 blank … case15 malfunction). verified 1:1 in the checklist table. no matrix row is
unmapped.

### the one gap i probed

the exhausted 👋 vs a calm review.peer 🔍 — is exhausted truly distinguished? yes:
`exhausted` is now its own passage status (setStoneAsPassed writes `status:'exhausted'`),
mapped by asStoneDisposition to `halt(exhausted)` → 👋, snapped in case11
(`l1@i003, exhausted 👋`). it does not mask as a calm push. holds.

## conclusion

no behavior lacks a test. every wish + vision behavior maps to at least one test, and the
full render matrix is snapshot-covered. no gap to fill. coverage holds.
