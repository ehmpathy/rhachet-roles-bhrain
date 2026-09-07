# gap: `sentinel` — one word across three concepts

**state** = open · **kind** = overload · **measured** 2026-09-05 — **88 lines** in `src/`, three
subsystems

## .the three concepts under one word

| sense | what it is | out-of-band? | read for | where |
|---|---|---|---|---|
| the staleness file | `progress.$date.md`, whose mtime + content decide freshness | no — a real file | existence · mtime · content | `learn/getSweepProgress.ts` · `getDomainTermsPaths.ts` |
| the reserved value | `JUDGE_LEVEL = Number.MAX_SAFE_INTEGER`, a level above every real peer rung | **yes** | its value | `route/guard/review/peer/meter/JUDGE_LEVEL.ts` |
| the planted tracer | `term=__boottest__`, written to prove a glob pooled it | no — a real member | existence | `domainTermsBootReachability.integration.test.ts` |

⇒ only the middle one is the classic sense:

- in computer science a sentinel is a *reserved out-of-band value*
  - a null terminator, a `-1` for absent
- the other two are ordinary members of their own domain, read for their presence

## .why it is an overload, not one word in three contexts

`rule.forbid.domain-term-ambiguity` routes to a boundary where the senses differ by context, and to
second words where they differ by concept. **the properties disagree, so it is the second route:**

| property | staleness file | `JUDGE_LEVEL` | tracer |
|---|---|---|---|
| a member of its own domain? | yes | **no — reserved against it** | yes |
| carries information in its value? | its mtime, yes | its value is the whole point | no — presence only |
| planted deliberately to be found? | no — it is the record | no | yes, that is its job |
| removed after the check? | no | no | yes, in `afterAll` |

⇒ three concepts.

## .why it is not repaired yet

the enumeration is done; **the coinage is not.** it wants two things:

- three words chosen against a set of near neighbours — `tracer`? `canary`? `probe`? `ledger`?
- a triage of ~88 occurrences across three subsystems that no single author owns

🟡 and a sweep would be wrong, for the reason `rule.forbid.brackets-in-filenames` records for its own
cleanup: a find-and-replace cannot part a citation of a word from an instance of it. here the three
senses are interleaved inside one test file.

## .see also

- `.agent/.cache/repo=bhrain/role=learner/skill=learn.domain.terms/progress.2026-09-05.md` §2 — the
  sweep that found it
- `gap=flake.md` — the peer overload, same shape, same *costed rather than guessed* disposition
- `.readme.md` — the census row this file backs
