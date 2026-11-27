# domain.term.reason: route.guard.judge

## .etymology

a judge hears the facts and rules; it does not argue. the word fits a guard step that reads a
fact a driver cannot fake (a passage report, a file a command wrote) and rules pass or hold.

the word predates the education suite: `route.stone.judge` and a guard's `judges:` list already
carry it. this cluster itemizes it, since the education suite declares a dop on it
(`getOneEducationJudgeVerdict`) and a cli verb (`education.pursuit judge`).

rejected:
- `check` — generic; names any test, with no sense of a verdict a stone waits on
- `gate` — names the guard as a whole, not one verdict within it
- `validator` — names a shape check on input; a judge reads route state
- `assertion` — a test-code word; it throws, where a judge prints a verdict

## .evidence

- every guard in the repo that rules on fact lists its judges under `judges:`
- the judge output contract is two lines, `passed:` and `reason:`, read by the guard
- a judge holds no concerns, so `--as absorbed` never applies to it
  (`rule.always.diagnose-reviewer-malfunctions`: a judge owes no `.taken`)

## .invariants

- a judge prints exactly one verdict per run, `passed: true` or `passed: false`, with a reason
- a judge never writes route state; it reads
