# F042 — a check that cries wolf leaves the role

- **fork**: keep `skeptic.claims` and `skeptic.answer.check` as Stop checks (hard holds, or notices); or remove them and let the briefs hold the doubt
- **read**:
  - `skeptic.stop.dispatch` `[case9]` `.why`: peer i006 replayed 47 real replies and judged 6 of 12 refusals false
  - this session: the two checks held honest replies over and over. a new prompt opens a new turn, so a line read one turn earlier, with no source moved, was refused as unread; a numbered proposal under "I will:" read as a claim; a decision put to the human read as a lazy question; a line marked `(unverified: <why>)` was still refused
  - `1.vision.yield.md` research item 7 owed a false-refusal rate on real sessions before the checks were trusted; it was never measured, and F002 put them on by default
  - both checks grade words (a state word with no token match in the turn's output; a question shape with no `read:` line), never whether the thought behind them was checked. so they pass a wrong claim whose token shows in some output, and refuse a right one
- **taken**: remove both. a check that flags honest replies as often as stale ones is noise; a reader learns to skip it, so it catches naught, whether it holds or notes. the doubt lives in `rule.require.read-before-relay`, `rule.forbid.i-dont-know-answers`, `rule.always.skeptic-questions-all-questions`, and `rule.always.file-an-incident-for-a-defect-you-name-in-yourself`, each with its mechanism line restated. staleness belongs to the source, never the turn: a cited evidence file is a read
- **reopens**: F002 (on by default) for these two
- **rework**: clean — a successor check returns only if it flags a contradiction with recorded facts (exit codes, call order), ships as a notice, and a labeled corpus shows ~9 in 10 of its flags are true
- **open**: the human widened the cut to every skeptic hook (`razor.stop.check`, `razor.hold.check`, `skeptic.notice`, `razor.brief.guard`); the removal of the role's hook registration was refused by the seat's auto-mode classifier as destructive, so those four stay until the human clears that edit
- **confidence**: 90%
- **where**: `src/domain.roles/skeptic/getSkepticRole.ts`, `src/domain.roles/skeptic/skills/`, the four briefs above
- **verdict**: the human's, seed S015
