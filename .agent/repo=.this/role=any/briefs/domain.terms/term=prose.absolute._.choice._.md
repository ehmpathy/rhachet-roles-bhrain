# domain.term: absolute

term.chosen   = absolute
term.kind     = noun
term.boundary = prose
term.synonyms.forbidden:
- universal
- blanket
- categorical

## .what
an `absolute` is **a quantifier over a set the author did not walk** — `never` · `always` · `every` ·
`all` · `none` · `impossible` · `cannot`, each of which claims a property over a whole set.

it is legitimate where the author walked the set, or where a mechanism closes it. it is a
**termsmell** in every other case, and every other case is the common one.

## 🟡 .the boundary is `prose`, and the filesystem sense is why

`absolute` is heavily overloaded outside this boundary — an *absolute path*, `symlink --mode
absolute`, an absolute import. that sense is a **coordinate system**, and this one is a
**quantifier**; they share only the english word.

⇒ so the qualified form is what a reader dereferences. a bare `absolute` in this repo is ambiguous
by construction, which is the case `rule.require.boundary-qualified-terms` exists for.

## .the shape it is parted from

| shape | what it does | verdict |
|---|---|---|
| `prose.absolute` | asserts a property over an unwalked set | 🟡 the smell |
| `prose.contrastive` | excludes ONE named alternative in a stated binary | permitted |

⇒ the two wear the same words. **the tell is whether you can name what the word ranges over**, and
that seam is argued at `term=prose.contrastive`.

## .why it is a TERMSMELL, over a plain forbid

the argument is `rule.forbid.absolutes`'s, under `.why it is a TERMSMELL` — the cheap-claim asymmetry,
and the reason a reader cannot part a measured absolute from an unmeasured one.

what belongs here is the **kind** that argument selects: a termsmell grades a WORD as the tell for a
defect beneath it, so this term is graded at the same rung as `gerund` and not at the rung of the
defect itself.

## .why each synonym is forbidden

| word | why not |
|---|---|
| `universal` | names the scope correctly and loses the wisher's own ground — *"only the sith deal in absolutes"* |
| `blanket` | smuggles a volume claim, where the defect is one word |
| `categorical` | a term of art in logic for a different shape, so it imports an argument we do not make |

## .the test it is defined by

> **what is the set, and did you walk it?**

walked it → state the count. *"zero of 74"* outranks *"never"* · a mechanism closes it → state the
mechanism · you did not walk it → a guess dressed as a certainty; state the bound.

## .the peer defects it does not name

- `prose.subversive.shallow` — the **mirror** failure. a hedge understates where this overstates, and
  the pair is tabled in `rule.forbid.absolutes`'s `.see also`
- `prose.obfuscation` — grades the choice of evidence, where this grades the **quantifier**

## .refs
where the term composes declared contracts:
- src/domain.roles/telepath/briefs/rule.forbid.absolutes.md   # the rule named for it
- src/domain.roles/telepath/briefs/rule.forbid.absolutes.md.min
- src/domain.roles/telepath/boot.yml                          # the say-tier wire
- src/domain.roles/telepath/readme.md                         # the canon's grader table

## .reason
see the ref-level cluster beside this choice:
- `term=prose.absolute._.choice.reason.md` — the wisher's coinage, the measured corpus, the
  filesystem overload, and the open fulcrum on its carve-out
