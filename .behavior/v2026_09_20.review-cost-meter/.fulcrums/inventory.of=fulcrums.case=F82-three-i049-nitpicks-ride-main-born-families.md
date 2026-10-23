# F82 — three i049 nitpicks ride main-born families

- rework = **dirty** — each repair reshapes a family main owns, of which this branch added one member
- confidence = 🟡 **80%**
- raised.by = r026 enroll-impl-arch-defects (nitpick.1, nitpick.3) and r027 enroll-impl-arch-defects-review-ops (nitpick.1), at i049

## .the fork

| concern | what this branch added | what main owns |
|---|---|---|
| r026 n1 — `parseReviewArgs` casts a choice flag before the refusal check | `polluters`, one line in the family | `join`, `focus`, `goal`: the same cast, and `getAllReviewFlagChoiceRefusals` typed against it |
| r026 n3 — `tallier` and `talliedBy` can contradict | `talliedBy`, one field | `tallier`, and every reader of `ReviewVerdict` |
| r027 n1 — `metrics.realized.json` stores display prices | readers of those prices | the writer in `stepReview`, and every run log on disk |

| option | what it yields |
|---|---|
| concede | three refactors of main's shapes in a cost-meter branch — a parser contract, a verdict shape, a log format — each a merge hazard, and the first leaves one of four siblings different from the rest |
| dispute | the family stays one shape; this branch's member matches its siblings; the repair lands once, for the whole family, where main owns it |

## .taken — dispute

- each reviewer graded its concern `[nitpick][better]` and named no shipped harm: the one reader of `polluters` runs the refusal check first; `asReviewVerdict` sets both tally fields from one run; every stored price is USD at full precision
- a fix to this branch's member alone splits a family into two shapes, which is the drift each concern itself warns against
- `rule.prefer.scouts-honor` bounds fix-forward to cheap in-scope edits; a parser contract, a verdict reshape, and a log-format migration are none of the three

## .why confidence is not higher

`talliedBy` and the `polluters` line are this branch's own, so a reader may hold that the branch owes the family fix the moment it added a member.

## .verdict

🟡 BEST-GUESSED 2026-10-02 — dispute.
