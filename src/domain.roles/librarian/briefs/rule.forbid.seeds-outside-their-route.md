# rule.forbid.seeds-outside-their-route

## .what

> **a seed lives in its route's `.seeds/`, and only there. never in a role's `briefs/`, never in a
> package.**

a **seed** is the wisher's words, verbatim, one utterance per entry
(`rule.always.archive-the-wishers-words-verbatim`, driver). it is the evidence for one route's
decisions, kept beside the route that made them.

```
$route/.seeds/inventory.of=seeds._.md                  # 👍 the only home
src/domain.roles/$role/briefs/.seeds/…                 # 👎 ships to every consumer
```

## .why

- **a brief teaches a concept; a seed records an event.** a brief that ships carries a claim any
  reader can act on. a seed carries who said what, on which day, about which route — evidence a
  consumer cannot act on and was never owed
- **a seed in a package is a copy that outlives its source.** the route's seed and the shipped seed
  drift the first time either is touched, and the shipped one has no route to settle it
- **a brief that cites a seed points past the package.** once the seed stays in its route, a
  `seed S28` in a shipped brief names a file no consumer holds. state the claim in the brief's own
  words (`rule.forbid.verbatim-quotes-outside-seeds`, learner); the route keeps the source
- **a promoted role's origins stay with the route that promoted it.** a role ported from another
  repo moves its pioneer's seeds into the promotion route's `.seeds/`, never into the role

## .the test

> **is this file the wisher's words? then is it under a `$route/.seeds/`?**

yes and yes → it is home · yes and no → move it into its route's `.seeds/`, then repoint every
citer at the claim, never the file.

| when… | then… |
|---|---|
| a role ports in with a `.seeds/` dir | move it into the promotion route's `.seeds/` |
| a brief cites `seed S$n` or a seed path | restate the claim; drop the citation |
| a skill checks seeds inside a role | it checks the wrong home; it checks a route's `.seeds/` |
| a build glob takes `briefs/**` | it ships whatever sits there; a seed must never sit there |

## .enforcement

- a `.seeds/` dir under any role dir = **blocker** (clamp: `rolesShipNoSeeds.integration.test.ts`)
- a shipped brief that cites a seed by id or path = **blocker**
- a seed with no route home = **blocker**

## .see also

- `rule.always.archive-the-wishers-words-verbatim` (driver) — how a seed is caught
- `rule.forbid.verbatim-quotes-outside-seeds` (learner) — why a brief restates, never quotes
- `rule.forbid.itemization-without-coordinates` — how a seed inventory is named
