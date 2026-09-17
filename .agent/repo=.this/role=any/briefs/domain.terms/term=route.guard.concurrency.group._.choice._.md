# domain.term: route.guard.concurrency.group

term.chosen   = group
term.kind     = noun
term.boundary = route.guard.concurrency   # the count of simultaneous runs it bounds
term.synonyms.forbidden:
- bottleneck
- pool
- lane
- cohort
- rates

## .what

a **concurrency group** is a **set of peer reviewers that contend for one resource** — a provider's
ratelimit, a host's memory, a service's connection cap. the group is who contends; the
`concurrency` is how many of them may be in flight at once.

⇒ **the group is the SET; the concurrency is its CARDINALITY.** that split is why both need a word.

```yaml
reviews:
  peer:
    - slug: alpha-checker
      level: 1
      group: anthropic        # ← MEMBERSHIP, on the reviewer
  groups:
    anthropic:
      concurrency: 10         # ← THE BOUND, on the group
```

## ⚠️ .a group is ORTHOGONAL to a level — they answer different questions

| term | answers | governs |
|---|---|---|
| **level** | *when may this reviewer run?* | **order** — a rung opens only once every rung beneath it is terminal |
| **group** | *how many of us at once?* | **rate** — a member waits for a free slot in its own group |

⇒ **a reviewer has both, and neither implies the other.** two reviewers may share a level and sit in
different groups (two providers, same rung), or share a group and sit at different levels (one
provider, two rungs).

⚠️ **a group nests inside a rung in practice, and that is a consequence rather than a rule.** rungs
are gated, so a group whose members span two rungs can never have both halves in flight at once —
its cross-rung bound is unreachable, not forbidden.

## 🔴 .the word is `concurrency group`, never bare `group`

bare `group` is a **genus** — *"a group of what?"* has no answer in the word itself, the same defect
`knowledge` (for a brief) and `tool` (for a skill) each fell to.

⇒ **the qualifier is the term, and it is not optional in prose.** in yaml the qualifier comes from
position — `group:` sits inside `reviews:` beside `concurrency:` — exactly as `level: 1` reads
unambiguously without `guard.level` spelled out. **a key is qualified by its container; a term is
qualified by its filename.**

⚠️ **`remedyGroups` in `formatGuardTree.ts` is a boundary-qualified peer, not a collision.** `remedy
group` and `concurrency group` are two qualified terms, which is precisely what
`rule.require.boundary-qualified-terms` provides for. an **unqualified** `group` in a contract would
be the violation; neither site has one.

## 🔴 .a group's bound is scoped to ONE GUARD PASS, never to the resource itself

the term says a group *"models a ratelimit"*, and that invites a reader to trust the bound further
than it reaches. **the bound is an in-process semaphore, rebuilt per call:**

- `runStoneGuardReviews.ts` builds `bottleneckByGroup` fresh on every invocation
- ⇒ two guards run in **separate processes** that both declare `group: anthropic` each get **their
  own** bottleneck, so the provider's real ratelimit is **not jointly respected**

| the scope | is the bound honored? |
|---|---|
| one level, one guard pass | ✅ yes — the whole ask |
| two levels, one guard pass | ✅ yes — one instance per group, per call |
| 🔴 **two guard passes, two processes** | 🔴 **no** — each holds a private semaphore |

⚠️ **that is a bound on the TERM, not a defect in the code.** the wish asked for intra-level
concurrency and the group delivers it. what would be a defect is a reader who declares
`concurrency: 10` against a provider quota of 10 and then runs two stones at once.

⇒ 🟡 **stated honestly: a group models a ratelimit *as one process sees it*.** cross-process
arbitration would need a lock outside the process, which no part of this contract provides.

## .refs

the term is composed into two declared `*.guard` keys and the domain object behind them:

- `src/domain.objects/Driver/RouteStoneGuard.ts` — `RouteStoneGuardReviewPeer.group` (membership) and
  `RouteStoneGuardReviewsStructured.groups` (the map that holds each bound)
- `src/domain.operations/route/guard/parseStoneGuard.ts` — where both keys are read, and where
  `assertConcurrencyGroupsResolve` refuses a membership with no bound declared
- `src/domain.operations/route/guard/review/runStoneGuardReviews.ts` — `bottleneckByGroup`, one
  `genBottleneck({ concurrency })` per declared group, and the `group → level` nest that binds them

⚠️ **this cluster carried the settlement AHEAD of the build, on purpose** — it was written at the
`1.vision` stone of `v2026_09_03.feat-peer-review-parallelism`, when neither key existed, because the
argument that chose the word decays with the round while the key does not.

## .reason

see the ref-level cluster beside this choice:

- `term=route.guard.concurrency.group._.choice.reason.md` — the wisher's coinage, the nine-instance
  enumeration that kept the word, and why `bottleneck` has no slot left
