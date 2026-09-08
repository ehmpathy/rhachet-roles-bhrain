# domain.term: bind

term.chosen   = bind
term.kind     = verb                 # noun | verb | adj — reused across objects & operations
term.boundary = route
term.synonyms.forbidden:
- attach
- link
- pin
- associate

## .what

**to fasten one route to one branch, so `--route` need not be supplied.**

the act writes a flag at `$route/.route/.bind.$branchFlat.flag`, and every route operation that
takes an optional `--route` derives it from that flag instead (`stepRouteDrive.ts:44-51`,
`stepRouteReview.ts:31-45`).

⇒ it is **one route to one branch**, enforced: a second bind on a bound branch throws
*"already bound to … use route.bind --del first"* (`setRouteBind.ts:55`), and a bind on a protected
branch is refused outright (`:37`).

## 🔴 `bind` names the ROUTE fastening, and no other concept

**measured 2026-09-06.** across a full round this word was spoken in a second sense — *"the guard
**binds** `--paths-with '…'`"*, *"the guard **binds** are blind"*, *"I **rebound** five lanes"* —
meaning **the flag arguments a reviewer lane declares**. that is a different concept in this word's
clothes, and `rule.forbid.domain-term-ambiguity` forbids it.

⚠️ **the overload lived entirely in prose, never in a contract** — no operation, field, or flag
carries it. that is what let it spread for five rounds unchallenged: there was no compiler, no
grep, and no reviewer surface on which the two senses ever met.

### the three concepts, and the word each already had

| the concept | the canonical word | where it is declared |
|---|---|---|
| a **route** fastened to a **branch** | ✅ **bind** | `setRouteBind.ts`, `route.bind.set/get/del` |
| the **arguments a reviewer lane declares** | ✅ **run** | the guard's own yaml key: `run: $rhx review …` |
| the **file set those arguments select** | ✅ **scope** | `writeInputArtifacts.ts:20` — `term=review.scope` |

⇒ 🔴 **not one word had to be coined.** all three already existed in declared contracts; the overload
was prose that reached past them. *"the guard binds"* is `run`; *"what the lane received"* is `scope`.

## .refs

- `src/domain.operations/route/bind/setRouteBind.ts` — the write, and both refusals
- `src/domain.operations/route/bind/getRouteBind.ts` · `getRouteBindByBranch.ts` — the two reads
- `src/domain.operations/route/bind/delRouteBind.ts` — the idempotent removal
- `src/domain.operations/route/bind/getAllBindFlagsByBranch.ts` — the shared lookup
- `src/domain.operations/route/gitignore/findsertRouteGitignore.ts:18` — `!.bind.*`, the one
  route-state file kept under version control beside `passage.jsonl`
- `.agent/repo=bhrain/role=driver/skills/route.bind.{set,get,del}.sh`

## .reason

see the ref-level cluster beside this choice:
- `term=route.bind._.choice.reason.md` — etymology, the rejected synonyms, and the 2026-09-06
  overload with its measurement
