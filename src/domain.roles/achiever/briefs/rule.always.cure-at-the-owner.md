# rule.always.cure-at-the-owner

> **aim each fix at the file its owner publishes, never at a copy. before an edit, name the owner of the source and whether the edit reaches the next reader.**

## .what

a file can be a link to the source, a copy of it, or a package the owner publishes. an edit lands everywhere only at the source. a fix in a local copy leaves the defect in every other reader and returns at the next sync.

## .why

- go to the source and see for yourself (Ohno, genchi genbutsu), then ask why until the cause no longer changes (the five whys). a fix at the symptom replaces the fuse and leaves the dry part that blew it
- most troubles belong to the system, which the owner of the system alone can change (Deming, 1982: an estimate of 94 parts in 100, stated as experience and never as a measure). a patch in the copy is a patch the owner never sees
- the weak places to push are the parameters; the strong places are the rules, the flows of information, and the goals of the system (Meadows, 1999). the owner's source is where a rule is set
- a fix that treats the symptom and feeds the problem later is the archetype "fixes that fail" (Senge, 1990)

## .the table

| the miss | the cure |
|---|---|
| a local copy of a skill or brief that an upstream publishes | a mod, a patch, or a task into the repo of the owner. the copy is no fix |
| a symptom met in one tree | the cause in the shared source. a one-tree grant bridges the tick and never cures |
| a defect in a peer's output | the peer's own tool or role, built by its owner |

step one, before any edit: read where the path resolves (a link to main, a copy, an installed package) and who publishes it.

## .the test

> **who publishes this file, and does my edit reach the next reader?**

## .enforcement

- a fix aimed at a copy where an owner publishes the source = **blocker**
- a fix with no named owner of its source = **nitpick**

case: `rule.always.cure-at-the-owner.example=the-local-copy.md`

⇒ see also: `rule.forbid.workarounds` (bhrain/role=driver — the cause, never the input) · `rule.require.solve-at-cause` (ehmpathy/role=architect)

## .sources

- Ohno, T. (1988). Toyota Production System. on the five whys and go and see: https://en.wikipedia.org/wiki/Five_whys
- Deming, W. E. (1982). Out of the Crisis, p. 315. https://www.spcforexcel.com/knowledge/deming/remembering_deming
- Meadows, D. H. (1999). Leverage Points: Places to Intervene in a System. Sustainability Institute. https://donellameadows.org/wp-content/userfiles/Leverage_Points.pdf
- Senge, P. M. (1990). The Fifth Discipline, the archetype "fixes that fail". https://en.wikipedia.org/wiki/Fixes_that_fail
