# rule.forbid.websearch-and-webfetch

## .what

> **`websearch` and `webfetch` do not return a source. they return a MODEL'S SUMMARY of a source —
> and they return it in the shape a source would take.**

so their output may be used as a **pointer** and never as **evidence**:

| the use | verdict |
|---|---|
| find a URL, a name, a lead — then fetch it with `bhrowser` | ⚠️ **tolerated, never the default** — see below |
| quote it, cite it, or draw a conclusion from it | 🔴 **forbidden** |
| assert what a source says, on their output alone | 🔴 **forbidden** |
| assert what **no** source says, on their output alone | 🔴 **forbidden** |

the positive peer, `rule.always.reach-for-bhrowser`, says *which tool to reach for*. this one says
*what their output may be trusted to be*, once you have reached for the wrong one anyway.

## 🔴 .the SEARCH goes through `bhrowser` too — the pointer use is a fallback, not a lane

> *"even here, searches should also be done with bhrowser too"* — the wisher, 2026-08-31
> (`.seeds/inventory.of=seeds.case=S20-*.md`)

`bhrowser` does not merely fetch a page you already hold. **it searches.** so the pointer row above
is not a sanctioned parallel lane for lead-discovery — it is what remains when the browser
genuinely cannot reach the query.

| you need | reach for |
|---|---|
| a lead, a URL, a name, a term to look up | 🔴 **`bhrowser`.** it runs the search AND returns the real page |
| the words on a page | `bhrowser`, always |
| a lead where `bhrowser` is unavailable or refused | `websearch` — **labelled as such**, and the fetch still goes through `bhrowser` |

⇒ **the reason is the same one that governs the evidence half.** an index's snippet is a window cut
for relevance to your query, so **the set of leads it returns is already filtered by a ranker you
cannot inspect.** a search that surfaces the wrong three sources produces a flawless yield about
the wrong three sources — and the yield reports no such bound.

⚠️ **the one honest use that remains** is a query `bhrowser` cannot serve. say so on the page, and
say what you tried.

## .why — a paraphrase, returned in a quote's clothes

each tool interposes a lossy layer between you and the page, and **neither announces that it did**:

| tool | what it hands back | what it drops, silently |
|---|---|---|
| `websearch` | the **index's own snippet** — a window cut for relevance to your query | each passage outside that window, plus any rephrase the index applied |
| `webfetch` | a **model's answer to your prompt**, computed over the page | any detail the summarizer judged irrelevant — and it **adds** any detail the summarizer inferred |

⇒ **a summary that omits and a summary that invents are indistinguishable from a faithful read**,
because all three arrive in the same shape. that is `rule.forbid.failhide` at the evidence layer:
an absence that reads as a completed check.

⚠️ **and the failure compounds downstream, which is what makes it worth a blocker.** a citation is
a promise the next reader inherits without a re-check
(`rule.always.reuse-pavement-before-improvise`). a paraphrase cited as a quote is therefore not one
defect — it is one defect per future reader, forever, and no one of them can see it.

## .the measured case — this repo, and it was a HUMAN paraphrase

**2026-08-30 · `rhachet-roles-bhrain` · `.agent/.cache/.../progress.2026-08-30.md`, round 10.** a
paraphrase of `ehmpathy/rhachet`'s determinism spectrum sat inside a **blockquote**, attributed to
a named upstream file. it propagated to **four briefs** before anyone fetched the source.

it had deleted one word — `mixed` — and that word carried the whole crystallization model. the
wisher then had to correct the mental model it produced **separately, as if it were a new lesson**.
it was the same defect, surfaced twice.

⇒ that was **one** paraphrase, made **once**, by an author who believed they quoted.
**`websearch` and `webfetch` manufacture that artifact on every call**, and their output carries no
tell at all.

## .the cues — when → then

| when… | then… |
|---|---|
| a `webfetch` returns a clean, well-organized answer to your exact question | 🔴 that shape is the summarizer's, not the page's. the tidiness is the tell |
| you are about to **quote** a line that arrived from either tool | fetch the page with `bhrowser` and quote what sits on it |
| you are about to write *"per `<source>`, X"* | did you read `<source>`, or a summary of it? only the first licenses that sentence |
| a search snippet **answers your question exactly** | 🔴 the index cut that window **for your query**. it is the excerpt most apt to deceive |
| you need a **URL, a package name, a term to look up** | 🔴 `bhrowser` searches too. reach for it — a `websearch` here needs a reason on the page |
| you are about to write *"no source discusses X"* | 🔴 forbidden outright — see the peer rule; an index's silence is not the field's |
| you cite a passage in a **blockquote** | 🔴 a blockquote is a claim of verbatim. attribute the source, and **fetch** the words |

## .the test — forced articulation, before the citation lands

> **"did I read the page, or did I read an account of the page?"**

- you read the page → cite it
- you read an account → 🔴 **fetch the page.** the account may be right, and you cannot tell
- you cannot answer → you have already lost the provenance. re-fetch

⚠️ the question is answerable **at the moment of the call**, and near-unanswerable an hour later —
which is why it belongs on the cue list rather than in a review rubric.

## .the seam with its peer — two DIFFERENT failures

both rules point at `bhrowser` and neither restates the other:

| rule | the failure it names | what you lose |
|---|---|---|
| `rule.always.reach-for-bhrowser` | **depth** — search sees the top slice of an index | sources you never learned exist |
| **this rule** | **fidelity** — what search returns is a paraphrase | a source you *did* find, misquoted |

⇒ so the peer's `.when search is enough` carve-outs are **narrower than they read**. they are void
for evidence, and — per the section above — they are a **fallback** even for a pointer, because
`bhrowser` searches too. a `websearch` call now needs a stated reason, whatever it was reached for.

## .enforcement

- a quotation, a blockquote, or a `"per <source>"` claim built on `websearch` / `webfetch` output =
  **blocker**
- a conclusion drawn from a `webfetch` summary, with no `bhrowser` fetch of the page = **blocker**
- a probe yield that cites a source it reached only through search = **blocker** — the depth rule
  grades the tool choice; this one grades the citation
- either tool used to obtain a **pointer**, where `bhrowser` was available and unattempted =
  **nitpick** — the browser searches too, so the fallback was never reached
- either tool used for a pointer **with a stated reason** `bhrowser` could not serve the query =
  **not a violation** — that is the one honest use left
- either tool used to confirm a term **exists**, labelled as such = **not a violation**

## .see also

- `rule.always.reach-for-bhrowser` — the positive peer; it grades the **depth**, this one the
  **fidelity**
- `rule.require.classify-the-yields-document-kind._.md` — the third of the researcher's three
  probe-time rules: depth, fidelity, shape
- `rule.forbid.failhide` (ehmpathy/mechanic) — the parent shape: an absence that reads as a pass
- `rule.always.reuse-pavement-before-improvise` (learner) — why a citation is a promise, and why a
  bad one costs every later reader
- `rule.require.persist-domain-term-evidence` (ehmpathy/architect) — what a checkable citation owes
