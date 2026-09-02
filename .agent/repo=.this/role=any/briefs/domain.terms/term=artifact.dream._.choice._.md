# domain.term: dream

term.chosen   = dream
term.kind     = noun
term.boundary = artifact     # SETTLED 2026-08-31 — `artifact` was paved, and it reaches the root
term.synonyms.forbidden:
- todo
- backlog
- ticket
- tech-debt

## .what
a **dream** is **a followup that was seen and not done, recorded with the context that made it
visible.**

it is a two-file contract, and both files are owed:

```
.dream/v$date.$kind.$slug.md            # the DREAM — the repo-wide queue. the ORIGINAL
$route/dreams/v$date.$kind.$slug.md     # a SYMLINK back — so the route shows what it deferred
```

⚠️ **the dream file is the original; the route holds the link.** never the reverse — a dream that
lives inside one route dies with it, and the queue is what makes it findable at all.

the `$kind` names what the followup **is**, so the queue sorts by work type:

| kind | the followup is |
|---|---|
| `entool` | a leftover step a tool should have taken |
| `enbrief` | a lesson that is owed a brief |
| `reseed` | work whose home is another repo |
| `amend` | a change to an artifact that already exists |

## ⚠️ .a dream is CAUGHT locally; it is DISPATCHED separately

`.dream/` is the local queue; the radio is the transmission. **`caught` and `dispatched` are two
states, not one** — a `reseed` dream is dispatched only when a push actually lands.

## .refs
where the term composes declared contracts:
- src/domain.roles/learner/briefs/rule.always.catch-dreams-for-followups.md     # the rule
- src/domain.roles/achiever/briefs/rule.always.fix-forward-under-scouts-honor.md # the peer
- .dream/v*.md                                                                  # the queue
- .behavior/*/dreams/v*.md                                                      # the symlinks

## .reason
see the ref-level cluster beside this choice:
- `term=artifact.dream._.choice.reason.md` — etymology, the rejected synonyms, and why it is no `seed`
