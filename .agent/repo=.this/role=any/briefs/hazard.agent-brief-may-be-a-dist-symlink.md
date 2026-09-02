# hazard: a brief under `.agent/` may be a symlink into `dist/` — your edit is reverted

## .what

`.agent/repo=.this/role=any/briefs/` holds **two kinds of file that look identical**:

| kind | git mode | edit it directly? |
|---|---|---|
| a real tracked brief | `100644` | ✅ yes — it is the source |
| a symlink into `dist/` | `120000` | 🔴 **no** — edit `src/domain.roles/<role>/briefs/` instead |

the second kind points at `dist/`, which `npm run build` regenerates by
`rsync -a … src/ dist/`. so **an edit through the symlink is silently overwritten by the next
build**, and the file reads exactly as it did before you touched it.

## .why it bites

the failure is **silent and delayed**. the edit tool reports success. the file reads back correct.
the reversal happens later, in an unrelated `npm run build` — so the symptom (*"my change is
gone"*) arrives with no link to its cause, and the natural read is *"the edit never landed"*
rather than *"the build reverted it."*

⚠️ and the two kinds are **indistinguishable from a path**. `.readme.md` beside
`term=externalize.pave._.choice._.md` in one directory: the first is a symlink, the second is a real file.

## .the check — one command, before you edit

```sh
file '.agent/repo=.this/role=any/briefs/<the-file>'
```

- `ASCII text` → real file, edit it here
- **any** `symbolic link to …` → 🔴 **edit `src/domain.roles/<role>/briefs/<name>` instead**,
  then `npm run build`

⚠️ **the link's target takes one of two forms, and both carry the same instruction: edit the
source.** do not read the shape of the target as a verdict on whether a direct edit is safe.

| the target reads | it hops | on a fresh clone, before `npm run build` |
|---|---|---|
| `…/repo=bhrain/role=<role>/briefs/<name>` | through `dist/` | 🔴 **dangles** — `dist/` is gitignored and absent |
| `…/src/domain.roles/<role>/briefs/<name>` | straight to the source | ✅ resolves |

⇒ **prefer the second form for a new link.** it is strictly more robust and it names the file you
must edit anyway.

the first form is extant on **three** links, all under `domain.terms/` — `.readme.md`,
`rule.forbid.domain-term-synonyms.md`, `rule.require.domain-term-itemization.md`. all three are
named at `say` in `role=any/boot.yml`, so **a fresh clone boots three paths that point at no file**
until the first build. they are left in place until disturbed; a retarget is clean.

⚠️ **census the set, never sample it.** the count above came from
`git ls-files -s '.agent/repo=.this/role=any/briefs'` and a read of every `120000` row — 7 symlinks
in total, 3 of them through `dist/`. an earlier count of "two" came from a `file` call on five
paths picked by hand, and it missed `.readme.md`. **a sample cannot report what it did not look
at**, which is the whole claim of `rule.require.inventory-for-enumerable-concepts`.

to see every symlink under a tree at once:

```sh
git ls-tree -r HEAD --format='%(objectmode) %(path)' '.agent/repo=.this/role=any/briefs'
```

`120000` marks a symlink; `100644` marks a real file.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to edit any file under `.agent/` | 🔴 `file` it first |
| a change you made "did not stick" after a build | check whether you edited through a symlink |
| a review flags text you are certain you already fixed | same check — the reviewer read the reverted copy |
| you edit a brief under `src/domain.roles/` | safe; that IS the source. run `npm run build` after |

## .why the symlinks exist at all

a brief that is **both** a published role brief and a rule this repo applies to itself lives once
in `src/` and is cross-listed into `role=any` by symlink, rather than copied. one source, two
homes — which is correct, and which is exactly what makes the edit target ambiguous.

## .enforcement

- an edit applied through a `.agent/` symlink rather than to its `src/` source = **blocker** —
  the next build reverts it, and no tool reports the loss

## .see also

- `rule.always.reuse-pavement-before-improvise` (learner) — check before you act, not after
