# rule: converge to terminal — work every reviewer before the human is pulled

## .what

when you hold the driver role and a stone gates on peer reviews, you drive each reviewer
to a **terminal** verdict before a human is ever pulled. a level is terminal when every
reviewer at it is terminal — `approved`, `exhausted`, `malfunction`, or `constraint` (the
four verdicts `isReviewPeerVerdictTerminal` counts; a rejected or queued reviewer is NOT
terminal). you work the whole ladder — level by level — to terminal, and only then, at the
very bottom, is the human the final backstop.

this brief leads with the `approved` / `exhausted` pair because they are the two outcomes a
driver **drives toward** (approval through convergence, or earned exhaustion when a reviewer
is insatiable). `malfunction` and `constraint` are terminal-for-unlock too — a broken or
constrained reviewer does not hold the ladder — but the driver's response to those is
governed by `rule.always.diagnose-reviewer-malfunctions` (D4), not by convergence. all four
unlock the next level; see the vision's "exhausted (or otherwise terminal)".

this is the exhaustion facet of convergence. its companion `rule.always.converge-with-reviewers`
governs how you settle a single dispute; this rule governs the whole ladder: press on,
level after level, until no reviewer is left to drive.

## .why

escalation to a human is the **last resort** — never the first, never mid-ladder. the
human's attention is the scarcest resource in the loop; the entire design conserves it.
the route unlocks the next level the instant the prior is terminal, so you can drive on
without a human — that unlock exists precisely so the human is summoned only once every
level is spent.

when a level `exhausts`, it is terminal, so the next level runs in that same pass. you do
not stop. you do not knock on the human's door. you drive on down the ladder until every
reviewer you could possibly work with has gone terminal.

## .the rule

| the level did... | you must... |
|------------------|-------------|
| approve | continue — the next level is already live |
| exhaust (earned) | continue — exhaustion is terminal; the next level runs now |
| reject (has budget) | converge — fix the code, or articulate why it holds, and re-arrive |
| all levels terminal | now — and only now — the human may be pulled to overrule |

you re-arrive (`--as arrived`) after each round of work. the ladder advances itself. the
same command drives the whole way down.

## .exhaustion is earned, never casual

to reach exhaustion is to have spent a reviewer's whole budget on **genuine convergence
effort** and still not reached approval. that is a costly outcome, not a shortcut:

- **manufactured exhaustion** — budget burned without genuine engagement, to reach the
  bottom — is a **defect**. you have not converged; you have coasted. this is forbidden.
- **earned exhaustion** — genuine attempts to converge against a reviewer that could not
  be satisfied — is **legitimate**. some reviewers are genuinely insatiable, and the moon
  glyph (`🌙`) marks exactly this case.

the healthy outcome of every level is **approval through convergence**. earned exhaustion
is the rare, accountable tail — not the norm you aim for.

## .earned exhaustion demands a cited record

when you exhaust a reviewer, you owe a record — write it into your `.taken.by_self`
contemplation artifacts, so the human who reads the trail sees the truth of it:

1. **your attempts to reason** — what you tried each round to converge: the fixes you
   applied, the arguments you articulated. this proves genuine effort was spent, not
   budget burned.
2. **what would fix the review in the future** — a concrete note on how the reviewer or
   its rubric could be improved so this insatiability does not recur (e.g. "rule X reads
   two ways between A and B", "the rubric demands Y, which conflicts with Z"). this turns a
   dead-end into a feed-forward that improves the reviewer for the next traveler.

an exhausted level with no such record is indistinguishable from a coast. the record is
what makes earned exhaustion legible — and what earns the trust that lets the ladder
advance on your word.

## .why the ladder trusts you

the reason it is safe to let the next level run the moment a level exhausts is that we
**trust you already did all that was possible** to satisfy it. exhaustion is not "the level
was skipped" — it is "the level was worked to the end and could not be satisfied." given
that, the next level should proceed; no further move remains for you at the exhausted
level, so a wait would only stall the road and pull the human early.

your cited record is what earns that trust. honor it, and the ladder carries you.

## .converge, do not coast

for almost every blocker there is a path to converge — you can converse with reviewers.
the contemplation loop (`.given.by_peer` / `.taken.by_self`, threaded back via
`--as contemplated`) means you are never stuck with a bare verdict: either **fix the
code**, or **articulate why it holds** with concrete evidence and persuade the reviewer to
drop it. because that conversation exists, exhaustion is almost always avoidable.

so when you near a reviewer's budget, ask: have i truly tried to converge, or do i coast
to the bottom? the first is the work. the second manufactures a defect.

## .the owl's wisdom 🦉

> the road has many gates. you open each by convergence,
> or, when a gate cannot be satisfied, you note why and pass.
>
> you do not wake the keeper at every gate.
> you wake them once, at the last, once you have walked the whole road.
>
> exhaustion is not rest. it is a gate you could not open,
> marked honestly, so the next traveler opens it clean. 🍵
