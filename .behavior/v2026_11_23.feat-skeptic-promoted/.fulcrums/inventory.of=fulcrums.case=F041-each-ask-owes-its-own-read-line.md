# F041 — each ask to the human owes its own read line

- **fork**: widen `asNearBy` in `skeptic.answer.check` so one `read: · open:` line covers a numbered list of asks, as peer i006 r010 suggests; or keep the read line adjacent to each ask
- **read**:
  - `rule.always.skeptic-questions-all-questions`: a question to any session owes the read that could settle it, named and run; a person is asked for a call, never a lookup
  - `skeptic.answer.check.sh` `asNearBy` reads the line before and after an ask; a `read:` line there passes it
  - a list of N decisions is N questions, and each can be settled by a different read. one shared line names one read, so N−1 asks reach the human unread
- **taken**: keep it adjacent. the cost is one line per ask, paid by the session; the cost of the wider form is an ask the human settles by a lookup the session skipped, which is the defect the rule exists to catch
- **rework**: clean — widen `asNearBy` to the list block around the ask if a corpus shows the per-ask line is noise
- **confidence**: 75%
- **where**: `src/domain.roles/skeptic/skills/skeptic.answer.check.sh`
- **verdict**: driver's call, from the role's own rule; raised by peer i006 r010
