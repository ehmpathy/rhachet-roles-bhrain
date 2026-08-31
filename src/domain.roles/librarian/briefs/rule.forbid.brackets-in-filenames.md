# rule.forbid.brackets-in-filenames

## .what

no filename may carry `[` or `]`. a document kind is marked with the **coordinate form**:

```
$topic.kind=$archetype.md          # kno601.inventories._.kind=article.md
```

not the bracket form:

```
$topic.[$archetype].md             # 👎 kno601.inventories._.[article].md
```

⚠️ **this binds new and renamed files in this repo.** an extant bracketed name elsewhere — the
`[article]` / `[catalog]` / `[demo]` / `[lesson]` family in a dependency's published briefs — is
left in place until disturbed, and re-seeded to the repo that owns it.

## .why

**the marker made the file hard to reference — which is the one job a filename has.**

`[` and `]` are **glob metacharacters**. `[article]` does not read as the literal text
*"[article]"*; it reads as *"any one character from the set `a,r,t,i,c,l,e`"*. so the name a reader
sees and the name a tool matches are **different strings**, and every tool that walks a path pays:

| the tool | what brackets cost it |
|---|---|
| `Glob` / `fast-glob` / `globby` | a bracketed name is **unmatched** — the pattern silently returns fewer files than the disk holds |
| `boot.yml` glob entries | a `ref:` glob cannot address a bracketed brief |
| shell (`bash`, `zsh`) | needs `\[` escapes or `--literal`; unescaped, it expands to garbage or to itself |
| `mv` / `cp` / `rm` wrappers | this repo's own `mvsafe`, `cpsafe`, `rmsafe` carry a **`--literal` flag that exists solely for this** |
| a markdown link | `[text](url)` is link syntax, so `[article]` inside a link renders wrong |

⇒ the deciding failure is the **silent** one. an escape error is loud and gets fixed. a glob that
returns 9 files where 10 sit on disk looks like a correct answer, and the tenth file is simply
absent for everyone downstream.

## .the evidence — this repo, caught in the act

a `Glob` for `dist/**/kno601*` returned **no match** while `kno601.inventories._.[article].md` sat
on disk. the file was found only by a fallback to `rhx globsafe`. the brief was correct, wired,
and built — and invisible to the tool built to find it.

⇒ **a document kind is metadata for a reader. it must not cost the reader the ability to address
the file.**

## .why `kind=` and not a bare suffix

the replacement is **not** arbitrary — it is the coordinate form this repo already dereferences by
everywhere:

```
.agent/repo=bhrain/role=librarian/     # repo= and role= are coordinates
domain.terms/term=route.stone._.choice._.md  # term= is a coordinate
inventory.of=$concept.from=QUEUED.md   # rule.forbid.itemization-without-coordinates
```

`kind=article` is one more `$dimension=$position` pair, so it inherits all three properties that
made the bracket form fail:

- **computable** — a reader who knows the archetype knows the substring
- **globbable** — `*.kind=article.md` returns the whole archetype; `*.[article].md` returns none
- **self-describing** — `kind=` names the axis, where bare `.article.` reads as prose

a **bare** suffix (`kno601.inventories.article.md`) was rejected: this repo's filenames are
dot-segmented prose, so a bare `article` segment is indistinguishable from a topic word.

## .the cues — when → then

| when… | then… |
|---|---|
| you name a **new** document that has an archetype | write `kind=$archetype`, never `[$archetype]` |
| you **rename** or move a bracketed file you own | take the coordinate form on the way through |
| you copy a filename shape from a **dependency's** published briefs | 🔴 stop — that tree's convention is not this tree's. use `kind=` |
| you must pass `--literal` or `\[` to touch a file | the escape is the smell; the name is the defect |
| a glob returns **fewer** files than you expected | check for brackets before you doubt the glob |

## .examples

### 👎 bad — the archetype is unaddressable

```
kno601.inventories._.[article].md
howto.curate-an-inventory.[guide].md
define.routes-are-gardened.[philosophy].md
```

`rhx globsafe --pattern '**/*.[article].md'` returns no match. so does `Glob`.

⚠️ **and a bulk rename cannot fix them safely.** a find-and-replace cannot tell a **citation** of
a bad name from an **instance** of one — the three lines above are citations, and any sweep that
repaired real filenames would rewrite them too. so the repair is **file-first and by hand**: that
is one more cost the bracket form imposes, and it lands on the cleanup.

### 👍 good — the archetype is a coordinate

```
kno601.inventories._.kind=article.md
```

`*.kind=article.md` returns every article. the whole archetype is one glob away.

### 👍 good — drop the marker when the lead segment already carries it

```
philosophy.entoolment-is-the-pinnacle._.md   # not …philosophy.….kind=philosophy.md
howto.curate-an-inventory.md                 # not …howto.….kind=guide.md
```

⇒ the first still takes its `._.` cluster root, because that marks a **split subject**
(`rule.require.summary-at-the-cluster-root`) and is a different axis from the archetype marker.
one convention drops; the other stays.

a name that **opens** with its archetype does not repeat it. one concept, one statement — so the
repair for `howto.$topic.[guide].md` is to **drop** the marker, never to convert it.

## .the boundary — where this rule stops

it governs **filenames**. brackets in **prose** are untouched:

- ✅ a markdown link — `[the guide](./howto.curate-an-inventory.md)`
- ✅ a table cell, a code block, a citation of another repo's bracketed path
- ✅ an emphasis marker in a heading

the defect is a bracket a **tool must parse as a path**, never a bracket a human reads.

## .enforcement

- a new or renamed filename that carries `[` or `]` = **blocker**
- a bracketed name copied from a dependency into this repo = **blocker** — re-seed the convention
  to the owning repo rather than import the defect
- an extant bracketed filename in a dependency's published briefs = **not a violation here**;
  leave it until disturbed
- a bracket in prose, a link, or a code block = **not a violation**

## .see also

- `rule.forbid.itemization-without-coordinates` — the `$dimension=$position` contract this reuses
- `kno201.documents._.[catalog]` — the archetypes this marks. ⚠️ **cited under its extant
  bracketed name on purpose** — it is an undisturbed file, and a citation of a name that does not
  exist yet resolves to no match, which is the very defect this rule is about
- `rule.always.enskill-the-tactics-you-discover` (learner) — check the pavement before you lay
  more, **and check that the pavement is not a rut**
