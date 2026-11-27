# F9: `course exit` passes `6.exit` itself, and the guard refuses a hand pass

- **fork**: (a) exit writes its record, then appends `passed` for `6.exit` directly · (b) exit writes its record, then calls `setStoneAsPassed`, which runs the guard's judge in a subprocess · (c) no guard on `6.exit`; exit alone ends a course
- **taken**: (a). exit is the authority on its own stone, so it needs no judge to confirm a fact it just wrote; the guard (`judge --criterion exited`) still stops `rhx route.stone.set --stone 6.exit --as passed` by hand. (b) spawns `rhx` from within `rhx` and fails in a repo with no rhx on the path; (c) lets a hand pass end a course with no swap back
- **rework**: clean — one call in `exitCourseRoute`
- **confidence**: 85% — a passage row written outside `setStoneAsPassed` skips its side effects (status-line cache drop); the swap's `setRouteBind` drops that cache anyway
- **where**: `src/domain.operations/education/exitCourseRoute.ts`
- **verdict**: unresolved
