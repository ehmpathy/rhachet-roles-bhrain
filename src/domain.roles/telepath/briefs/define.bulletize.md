# define.bulletize

## .what

to bulletize is to render a passage as a nested outline of single terse sentences, where the
nest declares each concept's relation to its parent.

```md
- $concept — one terse sentence
  - $subconcept — one terse sentence
    - $subsubconcept — one terse sentence
```

three parts, and they are the whole form:

- **one sentence per bullet** — a bullet that needs two held two concepts
- **the nest IS the relation** — a child elaborates its parent; a sibling is a peer
- **the depth IS the decomposition** — main, sub, subsub, as deep as the concept genuinely goes

🟡 **it is a rendering of an argument, never a decoration on prose.** to prefix a paragraph with a
`-` bulletizes naught.

## .why

⇒ the four benefits, and the reason the fourth earns the form a rule, are declared once in
`rule.require.bulletize`. the instinct — that the form is reached for with no decision, and that a
reader then picks their own depth — is declared once in `trait.bulletize-reflexively`. neither is
restated here. this file carries what neither can: the rendered pairs, the boundary, and the seam
with `itemize`.

## .the demos

### 👎 bad — a paragraph, four concepts, edges implied

> the reviewer grades prose, so its scope must drop `src/`, though it must keep `.behavior/` because the
> convergence loop reads the `.taken` files, which means the narrow-scope fix that #423 warns
> against is a different fix than this one — theirs omits `.behavior/`, ours omits `src/`.

🟡 **59 words, and every relation is a connective.** *"so"*, *"though"*, *"because"*, *"which
means"* — four edges, decoded in order, with no chance to skip.

### 👍 good — the same four concepts, as a tree

> **the reviewer's scope is prose-only**
> - drops `src/` — it grades prose, never the code fix
> - keeps `.behavior/` — the convergence loop reads the `.taken` files
> - 🟡 not the fix #423 warns against
>   - #423's trap omits `.behavior/`
>   - this omits `src/`

⇒ 44 words, and the tree is on the page. a reader who trusts the scope jumps to the warn line; a
reader who doubts it reads two bullets and holds the ground.

---

### 👎 bad — one bullet, two concepts, joined by an *"and"*

> - the guard hardcodes `--diffs since-main` and the flags actually live in each guard's `run:` line

🟡 **the *"and"* is a seam.** the second half **refutes** the first, and as written a reader may take
them as complements.

### 👍 good — the seam split, the relation nested

> - the guard **files** carry `--diffs since-main` by convention
>   - ⇒ the **engine** hardcodes none of it — the flags live in each guard's `run:` line
>   - ⇒ so a per-reviewer scope is a declaration, never a guard change

---

### 👎 bad — a bulleted paragraph, which is no outline at all

> - The reviewer needs a narrow scope because it grades prose and not code, and if it inherited
>   the default diff range it would pull in every TypeScript file changed since main, which is what
>   made four reviewers overflow their context gate on the prior route.

🟡 **one bullet, 47 words, three concepts.** the `-` character is present and the form is absent.

### 👍 good — the same content, decomposed

> - the reviewer wants a **narrow scope**
>   - it grades prose, never code
>   - the default `--diffs since-main` pulls in every changed `.ts` file
>     - ⇒ measured: four reviewers overflowed their context gate on the prior route

---

### 👎 bad — an outline where the concepts share one axis

> - **fresh** — computed this round, full cost
> - **cached** — reused from a prior round, zero cost

### 👍 good — one axis is a table, never a nest

> | attempt | when | cost |
> |---|---|---|
> | **fresh** | computed this round | full |
> | **cached** | reused from a prior round | zero |

⇒ **an outline nests; a table aligns.** if every child answers the same question about a different
subject, that is a column, not a depth.

## .the boundary — what stays prose

| stays prose | why |
|---|---|
| a verbatim quote | a quote is verbatim. never reformat one (`rule.always.archive-the-wishers-words-verbatim`) |
| a narrative in a `.demo=` artifact | its declared subject IS the sequence, and a sequence is prose |
| a single claim | one bullet under one heading is a `-` on a sentence. write the sentence |
| a table's cell | the table already carries the structure |

## 🟡 .the seam with `itemize`, stated so the glossary catches it

`itemize` is a declared term, and its etymology is *"an item is given its own **line**"*
(`term=itemization.itemize._.choice.reason.md`). close enough to want a statement:

| verb | the unit it addresses | its artifact |
|---|---|---|
| **itemize** | one entry, its own file, at its coordinates | an inventory — a filetree |
| **bulletize** | one concept, its own line, at its depth | a passage |

⇒ they share a shape and part on the artifact: **itemize demands a dereferenceable address;
bulletize demands only a position in a tree.** per `rule.require.boundary-qualified-terms` this wants
`term=prose.bulletize` if it earns a cluster, never a bare `bulletize`.

## .see also

- `rule.require.bulletize` — the rule this definition grounds: the bar, the test, the enforcement
- `trait.bulletize-reflexively` — the instinct: the form reached for with no decision, and the
  reader-chosen depth that makes it the closest prose gets to telepathy
- `rule.forbid.narration` — its clamp; the smell the trait pulls away from
- `rule.forbid.subversive-prose` — the outline is where a truism has no place to hide
- `rule.require.place-a-passage-by-its-subject` — a nest is a placement claim
- `rule.prefer.short-sentences` (mechanic) — the per-bullet length bound
