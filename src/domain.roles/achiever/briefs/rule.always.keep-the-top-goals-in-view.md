# rule.always.keep-the-top-goals-in-view

> **your top goals live outside your context. read them at each boot, resume, compact, and report, and say the top three before other work.**

## .what

context is lost at a compaction, a resume, and a respawn. a goal held only in context goes with it, and the seat then acts on the nearest task, never on the most important one. the goals sit in a record that survives: `.goals/`, written by `goal.memory.set`, and the orders in force from the seat above.

## .why

- specific, difficult goals beat "do your best"; the effect needs commitment and a feedback read (Locke and Latham, 2002: effect sizes d = .52 to .82). a goal out of view gets no feedback
- a promise held in the head is an open loop; it taxes the mind until it sits in a trusted record outside it, and the record owes a review (Allen, 2001)
- a plan fails at first contact, so state the intent: the end state, simple, specific, and singular, understood two levels down (the commander's intent; Heath and Heath, 2007). the top three goals are that intent for your seat
- do first things first and second things not at all. the hard part is the posteriority: the task you decide not to do (Drucker, 1967, chapter 5). name what the top three displace

## .the table

| the moment | the read |
|---|---|
| a boot, a resume, a compact | your goal record: `rhx goal.memory.get`, inflight first, then enqueued; and the orders in force from the seat above |
| before each report | the same; the first lines name the top three and what moved each |
| a new order arrives | rank it against the top three; name what it displaces |

## .the test

> **name my top three goals and each one's last move. can I?**

cannot → read before any other act.

## .the mechanism

the achiever's onBoot hook (`goal.triage.next --when hook.onBoot`) runs on each session start, resume and compact included, and prints the inflight goals, else the enqueued ones. it prints them in record order, never in rank. so the top three are the read's to name, and the first act after a boot is that read.

## .enforcement

- the first act after a compaction or resume is an act on a task, with the top goals unread = **blocker**
- a report that does not name the top three goals in its first lines = **nitpick**
- a new order ranked against no top goal = **nitpick**

case: `rule.always.keep-the-top-goals-in-view.example=the-priorities-lost-at-each-compaction.md`

## .sources

- Locke, E. A., Latham, G. P. (2002). Building a practically useful theory of goal setting and task motivation. American Psychologist, 57(9), 705-717. https://med.stanford.edu/content/dam/sm/s-spire/documents/PD.locke-and-latham-retrospective_Paper.pdf
- Allen, D. (2001). Getting Things Done. https://en.wikipedia.org/wiki/Getting_Things_Done
- Heath, C., Heath, D. (2007). Made to Stick, chapter "Simple" (the commander's intent). https://www.morganmclintic.com/pr/2009/06/commanders-intent.html
- Drucker, P. F. (1967). The Effective Executive, chapter 5 (first things first, posteriorities). https://dansilvestre.com/summaries/the-effective-executive/
