# domain.term: enbrief

term.chosen   = enbrief
term.kind     = verb
term.boundary = externalize   # settled 2026-08-31; externalize is a ROOT (term=externalize._.choice.reason.md)
term.synonyms.forbidden:
- summarize
- writeup
- document
- distill

## .what
to **enbrief** is to materialize a concept as a 📚 **brief** — the step off rung 0 (🧠 tribal
knowledge) onto rung 1.

a brief holds **prethought concepts**, in whatever shape the thought wants — a lesson, a rule, a
howto, a definition, a philosophy, a catalog, whatever a librarian may collect. the artifact kind
is fixed; its contents are not.

⚠️ **so the `en-` family splits by RUNG, never by content.** `enbrief` is not the verb for
*lessons* and `enskill` the verb for *procedures* — a procedure written as prose is still an
enbrief, and it still costs a brain a read, an interpretation, and a translation into commands.

it is the **eldest of the `en-` family**, this org's three externalization verbs. each names a
**climb on the entoolment ladder**, and each retires a different cost for the next traveler:

| verb | the climb | what it retires |
|---|---|---|
| **enbrief** | 0 → 1 · 🧠 → 📚 | the **derivation** — they need not re-think it |
| **enskill** | 0 → 2 · 🧠 → 💪💧 | the **sequence** — they need not re-assemble it |
| **entool** | 2 → 4 · 💪💧 → 💪🪨 | the **execution** — they need not run it by hand |

⚠️ **the ladder is not a staircase away from briefs.** two misreads follow from that picture, and
both are wrong:

| the misread | why it fails |
|---|---|
| *"the climb targets a tool"* | every rung **is** a tool — a brief, a route, and a solid skill are all pavement a traveler uses instead of re-derives, and they differ only in imagine cost per use (`term=entool`) |
| *"a higher rung retires the ones below"* | many solid skills rest on extensive briefs, or on a prior less-deterministic skill — so `enbrief` carries load at every rung |

## 🔑 .an enbrief often UNLOCKS a skill

the most common relation between a brief and a skill is **not** substitution. it is a pair:

| the brief carries | the skill carries |
|---|---|
| that the skill exists, and when to reach for it | the execution |
| the judgment the skill cannot make | the steps the brain need not recall |
| why the paved path is the right one | the path |

⇒ **a skill nobody knows to reach for is unreachable pavement.** so an `enbrief` is frequently what
makes an `entool` usable at all, and the two compose rather than compete.

## .refs
where the term composes declared operations:
- src/domain.roles/thinker/skills/brief.articulate/stepArticulate.ts
- src/domain.roles/thinker/skills/brief.catalogize/stepCatalogize.ts
- src/domain.roles/thinker/skills/khue.instantiate/stepInstantiate.ts
- src/domain.roles/thinker/getThinkerBrief.Options.codegen.ts
- src/domain.roles/librarian/briefs/knowledge/kno301.doc.enbrief.*   # the enbrief tactics
- src/domain.roles/librarian/boot.yml                                # say-level declarations

## .reason
see the ref-level cluster beside this choice:
- `term=externalize.enbrief._.choice.reason.md` — etymology, the family, and why not `summarize`/`document`
