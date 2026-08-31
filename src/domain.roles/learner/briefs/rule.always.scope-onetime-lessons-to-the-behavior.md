# rule.always.scope-onetime-lessons-to-the-behavior

## .what

a lesson born inside a behavior has **two possible homes**, and most real incidents need both:

| tier | home | holds |
|---|---|---|
| **one-time** | `$behavior/` — the behavior's own dir | the concrete, instance-bound result, with its evidence |
| **durable** | `.agent/repo=.this/role=any/briefs/`, or another repo's briefs via radio | the repo-agnostic kernel |

**and the two link to each other.** the durable brief cites the behavior doc as its worked
example; the behavior doc points up to the durable brief.

⇒ the extant rules (`rule.always.externalize.lessons.into_briefs`) answer **whether** to capture.
this one answers **where**.

## .why

before this rule the learner had one home for every lesson — the durable global briefs. that
conflates two very different artifacts:

| kind | example |
|---|---|
| **one-time** | *"in THIS migration, `config/test.json` had a staged tunnel-shape regression"* |
| **durable** | *"a tsc OOM after a dep change is usually two+ versions of a schema lib; collapse via `pnpm.overrides`"* |

**to park a one-time lesson in the durable dir is a category error** — it permanently dilutes the
always-booted context for every future traveler who will never touch that behavior. a `say`-tier
brief costs tokens on **every boot, forever**; an instance-bound note repays that cost to nobody.

**and to discard the generalizable kernel inside a one-time incident is the opposite error** — the
expensive half of the lesson evaporates with the route.

⇒ both errors are avoided by the same move: **capture both, linked.**

## .the discipline

### 1. scope the instance into the behavior dir

write the concrete result — the exact files, diffs, commands, failures — into a lesson doc inside
`$behavior/`. **it lives and dies with the behavior.**

### 2. always attempt to generalize

ask: **"what is the durable, repo-agnostic kernel here?"**

if there is one, distill it into a durable brief. the durable home may be either:

- **this repo's** `.agent/repo=.this/role=any/briefs/` — if the lesson is durable for this repo
- **another repo's** briefs, dispatched via a **radio task** — if the durable home is a shared
  role or tool repo (a fixer bug belongs in the fixer's repo; an sdk gap in that sdk's)

⚠️ **a lesson whose home is another repo is re-seeded there, never adopted here.** a tree adopts
only what is scoped to itself.

### 3. link back — both directions

| the doc | must carry |
|---|---|
| the durable brief | *"first seen in `<repo>/$behavior/<slug>`"* — the behavior doc as its **worked example** |
| the behavior doc | a pointer **up** to the durable brief |

the pair is the point: **instance-with-evidence below, generalized-rule above, each a reference to
the other.** a durable brief with no example is an assertion; an example with no rule is an
anecdote.

## .the test

| the lesson is useful to… | then… |
|---|---|
| only someone who ran **this exact behavior** | behavior dir, full stop |
| a future traveler in **any** repo | generalize into a durable brief, **and** link it back |
| **both** — the common case | capture both, linked |

⇒ **most real incidents are both.** the default is not a choice between the two homes; it is a
pair of writes.

## .worked example — the incident that motivated this

in a `declapract-upgrade` behavior, a durable lesson
`lesson.tsc-oom-from-multi-version-schema-lib.md` was correctly placed in the global briefs — it
generalizes cleanly (*"any schema lib, joi or zod"*).

but **alongside it** sat purely one-time results: a staged config regression, the exact 15
integration failures. those were only ever relevant to that one route, and they landed in the
always-booted global dir anyway.

⇒ the correct shape: the one-time results stay route-scoped; the durable lesson lives in the
global briefs **and cites the route as its worked example.**

## .the anti-patterns

- **the diluted glossary** — an instance-bound note in the always-booted dir, paid for on every
  boot by every traveler who will never touch that behavior
- **the discarded kernel** — a real generalization thrown away with the route dir that held it
- **the orphan rule** — a durable brief with no worked example, so a reader cannot tell what it
  actually looked like
- **the orphan example** — a behavior lesson doc with no pointer up, so its kernel is invisible
- **the adopted foreigner** — a lesson whose durable home is another repo, written here instead of
  re-seeded there

## .enforcement

- an instance-bound lesson written into the durable briefs dir = **blocker**
- a durable kernel discarded with its behavior dir = **blocker**
- a durable brief with no worked-example citation = **nitpick**
- a behavior lesson doc with no pointer up to its durable brief = **nitpick**
- a lesson whose durable home is another repo, adopted here = **blocker** — re-seed it

## .see also

- `rule.always.externalize.lessons.into_briefs` — the WHETHER; this is the WHERE
- `rule.require.timeless-lessons` — the durable half must also be session-free
- `philosophy.pavement-saves-nature` — why a diluted always-booted dir costs on every boot
- `rule.always.reuse-pavement-before-improvise` — check whether the durable brief already exists
  before you write a second one
