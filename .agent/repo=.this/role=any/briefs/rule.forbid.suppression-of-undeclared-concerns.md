# rule.forbid.suppression-of-undeclared-concerns

> **a declaration discharges the concerns it NAMES. concerns it did not name survive it.**

a **concern** is the atom of review feedback — one blocker, or one nitpick
(`term=route.guard.review.concern`). a driver's declaration about one concern may not change the
disposition of any other, however they were delivered together.

## .why — the two shapes, and they are symmetric

| the move, at coarse grain | what it does silently | who is harmed |
|---|---|---|
| **dispute** a lane | **suppression** — drops concerns the driver never argued | the reviewer, and every later reader of a stone that passed dirty |
| **concede** a lane | **over-claim** — commits the driver to concerns they never read | the driver, who now owes repairs they did not weigh |

⇒ **a rule aimed at dispute alone catches half of it.** the law is stated over *declarations* for
that reason.

🔴 **the sharpest instance is that a dispute suppresses the driver's OWN concessions.** a lane raises
four nitpicks; the driver concedes three and disputes one; a per-file exclusion drops all four and
the stone passes clean. the admission of fault was deleted by the disagreement with a neighbour —
and the disagreement was the honest part.

## .the authority test

> **who has AUTHORITY to discharge this concern?**

three parties, and no other move may do it:

| the party | how they discharge it | why the authority is theirs |
|---|---|---|
| the **reviewer** that raised it | it declines to re-raise it next round | it is theirs. they may drop it |
| a **human** | a forgive / overrule | the breadth IS the grant. authority is the point |
| the **driver**, **by name** | one concern at a time, disputed or conceded | they addressed *that* concern, and said so |

⇒ **a declaration that names a FILE, a LANE, or a SLUG names no party with authority over the
concerns inside it.** that is the defect, stated mechanically.

## .the cue — the grain of the ADDRESS is the grain of the discharge

| when… | then… |
|---|---|
| a declaration takes a **slug** or a **file path** as its target | 🔴 the strongest cue. what is inside it, and how many? |
| a gate checks that an artifact **exists** rather than what it says | it discharges the whole target, whatever the target holds |
| you reuse a **human** lever's seam for a **driver** move | 🔴 you copy the authority along with the code. a forgive is coarse *because a human declares it* |
| a driver asks for `--about all` or `--all` | that flag reintroduces this defect under a friendlier name. **a driver who types `all` has not read all** |
| a settlement says *"per point"* and a mechanism reads a file | the prose and the code disagree, and only the code ships |
| you cannot name the atom your domain operates on | 🔴 the root. an unnamed grain cannot be an axis, so no walk will surface it |

## .the test

> **enumerate the concerns this declaration touches. did the driver name every one of them?**

- yes → the declaration is honest
- no, and the un-named ones are **dropped** → suppression
- no, and the un-named ones are **claimed** → over-claim
- no, and the declarer is a **human** or the **reviewer itself** → permitted; the authority is theirs

## 🟡 .the boundary

| a violation | not a violation |
|---|---|
| a driver's declaration that sheds a concern it did not name | a **human** forgive that sheds a level |
| a driver's declaration that claims a concern it did not name | a **reviewer** that declines to re-raise its own concern |
| a gate that counts targets where the domain counts concerns | a halt that discharges naught — it makes no claim about any concern |
| a concern dropped from the **arithmetic** | a concern that stops to be **re-examined** while it still counts (a cache defect, not this one) |

**the line that parts them: after the declaration, is any concern's disposition different from what
its driver stated about it?** no → honest. yes → this rule, whichever direction it moved.

## .the measured case

walked 2026-09-10 over every value `PassageReport.status` accepts — all ten — plus the two a stance
adds. **nine of twelve obey the law; the three that break it are the three at LANE or SLUG grain**,
and the pattern is exact: **every move that names a PARTY obeys; every move that names a FILE or a
SLUG does not.**

⇒ the full twelve-row verdict table, the two failure shapes, and the near-miss that is not a member
of the class: `.behavior/v2026_09_08.feat-dispute-or-concede-review-budget/1.vision.experience.case=11.the-dispute-that-buried-three-concessions.md`.

🔴 **one of the three is shipped** — `--as absorbed --that <slug>` discharges a reviewer that
carried N points, and `rule.always.converge-with-reviewers.via-a-taken-per-point` already admits it:
*"the gate counts REVIEWERS. this rule counts POINTS … the door is a floor; this rule is the work."*

⇒ **so the duty was booted, and the mechanism was not.** a rule a driver can recite is not a rule the
engine enforces.

blocker: a driver declaration whose target is a file, lane, or slug rather than a concern · a
declaration that sheds an un-named concern from the tally · a declaration that claims an un-named
concern as agreed · an `--all` variant of a per-concern declaration · a human lever's seam reused for
a driver move with its breadth intact.
nitpick: a gate that checks an artifact exists where the domain's grain is finer than the artifact.
false positive: a human forgive · a reviewer that declines to re-raise · a halt, which discharges
naught · a concern frozen by a cache while it still counts.

⇒ see also: `term=route.guard.review.concern._.choice._.md` (the atom) ·
`howdoes.a-concern-travels-from-reviewer-to-absorption` (bhrain/role=driver — the relationship) ·
`rule.always.converge-with-reviewers.via-a-taken-per-point` (bhrain/role=driver — the duty this
would mechanize) · `rule.require.judge-derived-counts`.
