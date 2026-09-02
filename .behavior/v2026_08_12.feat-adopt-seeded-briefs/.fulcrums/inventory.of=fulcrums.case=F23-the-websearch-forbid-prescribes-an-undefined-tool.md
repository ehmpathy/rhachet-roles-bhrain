# fulcrum F23 — the websearch forbid rests on two claims i did not verify

| field | value |
|---|---|
| **the fork** | A: fold the wisher's *"those almost always lie"* into the extant `reach-for-bhrowser` rule · B: a peer `rule.forbid.*` on a **different** failure — fidelity, beside its depth |
| **taken, and why** | **B.** depth (sources you never found) and fidelity (a source you did find, misquoted) are two failures with two repairs; one file that carried both would state neither cleanly |
| **rework** | **clean** — a merge is a copy-paste plus one `boot.yml` line |
| **status** | ✅ **claim two SETTLED** 2026-08-31 — see below. claim one still open |
| **where** | `src/domain.roles/researcher/briefs/rule.forbid.websearch-and-webfetch.md` |
| **confidence** | **~80%** |

## 🔴 .claim one, unverified — what `webfetch` actually returns

the rule's central mechanism:

> `webfetch` returns a **model's answer to your prompt**, computed over the page — so a detail it
> judged irrelevant is absent, a detail it inferred is present, and neither is marked.

**i did not fetch that tool's contract.** the claim is inferred from its signature — it takes a
prompt alongside a URL, and a tool that takes a prompt answers it. that inference is reasonable and
it is **exactly the class of claim this very rule forbids** — a conclusion drawn from a summary
rather than the source.

⇒ **the rule is its own first violation.** recorded here rather than papered over.

## 🔴 .claim two, unverified — `bhrowser` is defined nowhere in this repo

```
rhx grepsafe --pattern 'bhrowser' --glob '*.md'
  → 9 hits, all inside the three researcher briefs (and their dist copies)
```

so the sanctioned alternative is named by these briefs and **by no definition, skill, or seed in
this tree.** a reader who obeys the rule cannot find out what to run.

⚠️ **and that inherits from the peer rule**, which already prescribed it — this rule did not
introduce the gap, it deepened it. the fix is a `define.bhrowser` or a pointer to whichever repo
owns it, and it is out of scope for a briefs-only round only if the definition itself is a brief.

## ✅ .claim two, SETTLED — and the settlement exposed a SECOND error the wisher's answer would have hidden

**2026-08-31.** the wisher: *"rhachet-roles-bhrowser exists, yes; you can install it as a dev dep or
peer dep or whatever."* installed at `0.1.0`; audit clean.

⚠️ **and the read of the package refuted the briefs' MECHANISM, though the wisher had confirmed the
tool.** the package publishes:

| what the briefs said | what the package holds |
|---|---|
| *"fetch it with `bhrowser`"* — a command | **a repo name.** it ships `playwright` 📽️ and `inspector` 📐 roles |
| an invocation | **briefs only — zero skills.** `rhx browser.start` → *"no skill found in any linked role"* |
| — | the real commands are `browser.*`, taught by the `playwright` role and **supplied separately** |

⇒ 🔴 **existence confirmed is not contract confirmed.** the wisher answered the question i asked —
*does it exist?* — and the question i should have asked was *what is its contract?* had i stopped at
their **yes**, three blocker-severity briefs would still prescribe a command that does not exist.

**this is F27's class, one layer up.** F27 says *a seed is one document; its claims are not one
claim.* this adds: **an authority's answer settles the question you put, and no more.**

## .the part that IS well-supported

the **downstream cost** argument stands on this repo's own measured incident: round 10, a
paraphrase in a blockquote propagated to **four briefs** and deleted the word `mixed`, which
changed the claim, and the wisher had to correct the model it produced separately as if new.

⇒ one human paraphrase, made once, cost four files and a re-correction. that is the argument for a
**blocker** severity, and it does not depend on either unverified claim above.

## .what would settle it

- fetch `webfetch`'s actual contract → confirms or refutes claim one; the rule's severity may drop
  to a nitpick if the tool returns the page verbatim
- define `bhrowser` here, or cite its owner → closes claim two
- 🟡 if `bhrowser` turns out to be unavailable in this harness, **the rule forbids the only two
  tools a researcher has**, which would make it unfollowable rather than strict
