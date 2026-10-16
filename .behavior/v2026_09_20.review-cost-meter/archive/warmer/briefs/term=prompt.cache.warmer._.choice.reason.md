# domain.term: warmer — the reason

## .etymology

plain english. a warmer warms, and what it warms is a cache — the one metaphor the whole
prompt-cache domain already runs on (`cold` / `warm` rounds, a `cold` replica, a `warm` prefix).
the agent noun falls out of the adjective the domain held before it.

it was in use before it was a term, which is the strongest evidence a coinage can have.
`term=prompt.cache.poke._.choice._.md` — the file that forbade it — used it in its own body,
in exactly its canonical sense:

> a warmer owes a prediction clamp: the head it replays must be asserted against the
> prefix the next round realizes

the word had already survived a live artifact and two paragraphs of argument before anyone
proposed it as vocabulary — the same route `poke` itself took.

## .why the word fits

| the plain sense | the domain agent |
|---|---|
| it warms | it sends `poke`s to keep a prefix resident |
| it acts on another party | the replica's cache, never its own state |
| it has a duty cycle | `k` pokes, `m` apart, then it exits |
| it is an agent, not an act | `genReviewWarmer` spawns one; `getOnePokeMeasured` sends one poke |

the split is the one `rule.forbid.domain-term-ambiguity` asks for: the act is a `poke`, the
agent is a `warmer`, and no sentence in the domain needs one word for both.

## .the dispute that freed the word

`warmer` sat on `poke`'s forbidden-synonym list from the moment that cluster was written, and the
warmer shipped under the forbidden word — `--warmer` among them, a **published cli flag**, which
`rule.forbid.domain-term-synonyms` names as the most expensive place a synonym can land.

the dated dispute lives at `term=prompt.cache.poke._.choice.reason.md`. its hinge:

> the rejection's argument is "you cannot say 'three warms' the way you can say 'three pokes'"
> — a claim about the act, and a correct one. "three warmers" is perfectly sayable.

the word was rejected for one sense and adopted for another. that is not drift; it is the
second trigger `howto.domain-term-disputes` names — a word that names a genuinely distinct
concept, which earns its own term — and the outcome it prescribes is a fresh cluster, which is
this one.

the forbid was not wrong; it was under-qualified. `warm` as a name for one act remains
forbidden, and stays on `poke`'s list. what changed is that the list now says which sense binds.

## .why `keep-alive` was superseded

the `poke` cluster reserved `keep-alive` for the strategy, and that reservation was **right about
the split and wrong about the word**:

| the objection | why it bites |
|---|---|
| **not an agent noun** | the domain's real sentences break: *"one keep-alive per reviewer"*, *"kill the keep-alive"*, *"a keep-alive spawned and a second did not"*. each reads as a category error, and each is a sentence the pid-lock design has to say |
| **a borrowed http term** | `Connection: keep-alive` holds a **socket** open across requests. a warmer holds no connection at all — it opens a new one per poke. the false friend is close enough to mislead, which is the same test that rejected `touch` for `poke` |
| **worse at the boundary** | `--keep-alive 3x,15m` against `--warmer 3x,15m`. a flag is read far more often than a brief |

so the argument that earned the split is upheld in full, and only its proposed word is replaced.

## .the rejected synonyms

| rejected | why |
|---|---|
| **keep-alive** | see above — the split was right, the word was not |
| **poker** | the mechanically correct agent noun for "one who pokes", and unusable: it reads as the card game on every surface it would appear |
| **refresher** | `refresh` was already rejected for `poke` because it asserts lru, which was the open question the eviction probe existed to settle. the agent form inherits the assumption |
| **cache daemon** | names the mechanism (a detached unix process) rather than the motive. the repo's own discovery rule is to name from the motive — a warmer would still be a warmer in the foreground, which `--warmer` on a hand-run review already is |

## .invariants

- **one live warmer per reviewer.** the spawn is a findsert keyed on a LIVE pid, never on a pid
  file — a file outlives every warmer that was killed, crashed, or spent its budget, so a
  presence check would latch the lock shut and leave that lane cold for the rest of the route
- **a warmer sends the byte-identical head.** it truncates only the USER message. the affinity
  key is `sha256(model + \0 + systemPrompt)`, so a warmer that trims the system slot lands on a
  replica the real call never reaches — it spends, protects naught, and every surface test passes
- **a deferral is not an attempt.** it spent no money and protected no bytes

## .see also

- `term=prompt.cache.poke._.choice._.md` — the act this agent schedules, and the dispute's home
- `term=prompt.cache.shared-prefix._.choice._.md` — what a poke aims to become
- `.behavior/v2026_09_20.review-cost-meter/1.vision.experience.case=7.a-warmer-spends-while-nobody-watches.md`
  — the critipath that obliges a warmer's spend to be recorded
