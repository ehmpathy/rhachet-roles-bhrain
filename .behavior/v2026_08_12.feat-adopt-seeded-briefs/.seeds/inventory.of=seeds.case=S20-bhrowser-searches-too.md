# seed: `bhrowser` SEARCHES too — the pointer carve-out is a fallback, not a lane

**2026-08-31. it narrows the one row `rule.forbid.websearch-and-webfetch` had marked ✅ allowed.**

## .said

> but even here, searches should also be done with bhrowser too; | find a URL, a name, a lead — then fetch it with `bhrowser` | ✅ allowed |

> src/domain.roles/researcher/briefs/rule.forbid.websearch-and-webfetch.md

## .settled

the rule forbade `websearch` / `webfetch` as **evidence** and left one row green: use them to find
a lead, then fetch the page with `bhrowser`. that row read as a sanctioned parallel lane for
lead-discovery.

**it is not.** `bhrowser` does not merely fetch a page you already hold — **it searches**. so the
pointer use is what remains when the browser cannot reach the query, and a `websearch` call now
owes a reason on the page whatever it was reached for.

⚠️ **and the reason is the rule's own argument, applied one step earlier.** an index's snippet is a
window cut for relevance to your query — so **the set of leads is already filtered by a ranker you
cannot inspect.** a search that surfaces the wrong three sources yields a flawless report about the
wrong three sources, and the report states no such bound.

⇒ the rule graded **fidelity** (a source you found, misquoted) and its peer graded **depth**
(sources you never found). this closes the seam between them: a bad *pointer* set is a depth
failure that the fidelity rule had quietly permitted.

## .landed

- `src/domain.roles/researcher/briefs/rule.forbid.websearch-and-webfetch.md` — new section
  `🔴 .the SEARCH goes through bhrowser too`; the ✅ row demoted to ⚠️ tolerated; the cue row and
  the enforcement list re-graded
