# rule.always.persist-each-origin-in-the-seeds

> **every law of this role keeps its origin: the human's words, caught verbatim in the seeds of the route that shaped it, each with the brief or skill that carries it. a law whose origin is lost gets asked for again.**

the skeptic was asked for many times, and was still absent, because no one place held the asks. the cure was to find every origin in prior chats and transcripts, lose no background, and show how each seed reaches the role.

**how it applies the basis:** a law with no origin asks to be trusted on its own say-so. trust no one means each law can be traced to who asked and why, so a reader can doubt the law against its source — and so you, the next session, do not trust your own memory of why it exists.

## .what

an ask that is not persisted is asked again. the home is the `.seeds/` of the route where the words were said: one entry per utterance, its verbatim words, the id of the record it came from, what it settled, and the path of the brief or skill that carries it.

the seed never moves into the role. a brief ships to every consumer, and a seed records one route's event; a brief states the law in its own words and cites no seed (librarian `rule.forbid.seeds-outside-their-route`). a role ported in from another repo keeps its pioneer's seeds in the promotion route.

this is the driver's and learner's `rule.always.archive-the-wishers-words-verbatim` (bhrain): the seed is caught the same way; this rule adds that each seed lands in a law of the role.

## .the move

| step | the act |
|---|---|
| 1 | an utterance that shapes this role is caught the turn it is said, in a seed entry of the route: `.said` (verbatim, per learner `rule.always.archive-the-wishers-words-verbatim`), `.settled`, `.landed` |
| 2 | the entry names its source id: an inbox id, or a transcript timestamp shaped as an id |
| 3 | a seed with no brief or skill that carries it owes a new brief or skill, written in the same pass |
| 4 | the summary lists each case, and each `.landed` path exists in the role |
| 5 | a seed found later, in an old transcript or another tree, joins the route's inventory the turn it is found |

## .the sources to search for origins

wherever the human's words are recorded. the search of 2026-11-18 read four homes (the inbox and goal records of a director route, the session transcripts, the routes of other trees); each read was bounded:

| source | how it is read |
|---|---|
| an inbox of recorded asks | `rhx grepsafe` for entries from the human whose quoted words hold the term |
| session transcripts | `rhx grepsafe` for a typed prompt (`origin human`), with a bounded pattern; never a whole read |
| goal records and route seeds | the route's `.seeds/` and any goal notes |
| other trees | `rhx git.repo.get files --tree <tree> --paths '**/*skeptic*'` |

## .the test

> **for each law of this role, can I name the human's words that asked for it, and the file that carries it?**

no → the origin is lost. search, then persist, in the route.

## .enforcement

- an utterance that shaped the role, left out of the route's inventory = **blocker**
- a seed with no landed path, or a landed path absent from the role = **blocker**
- a seed kept in the role's briefs, or a brief that cites a seed = **blocker**
- a law with no origin named = **nitpick**

see also:
- `rule.always.persist-each-origin-in-the-seeds.example=the-fifty-asks.md` — the many asks, and the four homes that pointed at no one place
- `rule.always.archive-the-wishers-words-verbatim` (bhrain driver and learner) — the seed shape this reuses
- `rule.forbid.seeds-outside-their-route` (bhrain librarian) — where a seed lives

---

written by human + beaver 🦫
