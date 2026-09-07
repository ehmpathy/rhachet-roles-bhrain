# rule.always.reach-for-bhrowser

## .what

> **for thorough research, reach for `bhrowser`. `websearch` and `webfetch` are samples, not
> surveys — and the yield must say which one it used.**

a probe that ran on search alone is bounded by whatever the index chose to surface, and **that
bound is invisible in the yield.**

## ✅ .what `bhrowser` IS — read from the package, 2026-08-31

**`bhrowser` is a REPO, never a command.** it is `rhachet-roles-bhrowser`, and it publishes two
roles and **no skills at all**:

| role | marker | its subject |
|---|---|---|
| `playwright` | 📽️ | repeatable browser playbooks — clicks, fills, navigates, workflows |
| `inspector` | 📐 | visual assessment — screenshots, diffs, regressions |

⇒ so *"reach for `bhrowser`"* means **enroll the `playwright` role**, whose briefs teach the
`browser.*` command family:

```sh
browser.start    --session <name> --mode HEADFUL|HEADLESS
browser.describe --session <name>
browser.snapshot --session <name> --focused
browser.action   --session <name> --play ./<playbook>.play.ts
browser.session  get|set --session <name> --into|--from <path>
browser.stop     --session <name>
```

🟡 **those commands are supplied separately from the role package**, so a probe that enrolls
`playwright` and finds no `browser.*` executable has hit a supply gap, never a rule violation —
diagnose it as such (`rule.always.diagnose-reviewer-malfunctions`, driver).

🟡 **and its mascot is the chameleon 🦎**, not the owl. a `bhrowser` surface speaks in its own
voice; `define.bhrain-repo-mascot`'s claim binds this repo's speech, never a dependency's.

## .why — the failure is SILENT

a shallow tool does not error. it returns a result, so a researcher reads the yield as complete
when it is a sample. three concrete bounds:

| the tool | what it cannot see |
|---|---|
| `websearch` | the top slice of an index, never the set. a page that ranks 40th is invisible, and no signal says it is there |
| `webfetch` | the pre-render of a JS-heavy source — the researcher never sees the content a human would read |
| either | a paginated list, an anchor deep in a long doc, a link the answer actually lives behind |

⇒ **an absence that reads as a completed check.**

## .the cues — when → then

| when… | then… |
|---|---|
| you dispatch a probe subagent | 🔴 `bhrowser` by default. search is the fallback, not the floor |
| a `webfetch` returns a page that reads thin or oddly structured | that is the pre-render. re-fetch through the browser before you conclude the source is thin |
| an answer sits behind pagination, a login, an anchor, or a JS tab | search cannot reach it at all. browse it |
| you write a probe yield | name the tool used, per source. a yield with no tool named cannot be graded |
| you are about to write *"no source discusses X"* | 🔴 stop — on search alone, that claim is unsupportable. it means *"the index did not surface one"* |

## .when search is enough

the rule is a default, not an absolute. search is the right reach when:

- you need a **pointer**, not an answer — a probe's aim phase, where breadth of leads beats depth
- you want to confirm a term **exists**, rather than to survey its field

🟡 in each of those, the yield still names the tool. a defensible shallow pass is fine; an
unlabelled one is not.

## 🔴 .and a known URL is NOT one of them

a `webfetch` of a URL you already hold does **not** settle it. what returns is a model's answer to
your prompt, computed over the page — so a detail it judged irrelevant is absent, a detail it
inferred is present, and neither is marked.

⇒ **that is a second failure, and this rule does not govern it.** depth is about the sources you
never found; **fidelity** is about the source you *did* find, misquoted. the peer rule
`rule.forbid.websearch-and-webfetch` carries it, and it voids the known-URL case outright: a
**pointer** may come from search, and the **words** must come from `bhrowser`.

## .enforcement

- a thorough research probe run on `websearch`/`webfetch` alone, where the source needed a browser
  = **blocker**
- a probe yield that names no tool per source = **blocker** — the depth is ungradeable
- a *"no source discusses X"* claim made on search alone = **blocker** — it asserts the field's
  absence from the index's silence
- a deliberate search pass, labelled, for a pointer or an existence probe = **not a violation**

## .see also

- 🔴 `rule.forbid.websearch-and-webfetch` — **the negative peer, and a different failure.** this
  rule grades the **depth** of a probe; that one grades the **fidelity** of what came back, and
  forbids either tool's output as evidence
- `rule.require.classify-the-yields-document-kind._.md` — the peer: the yield's shape is decided too
- `readme.md` — the five-phase route this fires inside, at `2.probes.emit`
- `rule.forbid.failhide` (ehmpathy/mechanic) — the parent shape: an absence that reads as a pass
