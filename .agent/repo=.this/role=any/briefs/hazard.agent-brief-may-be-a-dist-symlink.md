# hazard: a brief under `.agent/` may be a symlink into `dist/` — your edit is reverted

## .what

it binds every `.agent/repo=*/role=*/briefs/` tree, not merely `repo=.this/role=any`. the two
shapes differ, and the second is the one a reader looks past:

| shape | where | what is linked |
|---|---|---|
| a per-file link | `repo=.this/role=any/briefs/` | one brief, cross-listed from `src/` |
| a whole-directory link | `repo=<dep>/role=<role>/briefs/` | the entire dir, into `dist/` |

🟡 **the second shape defeats the per-file check below**, so it is stated first. see
`.the ancestor case`.

`.agent/repo=.this/role=any/briefs/` holds two kinds of file that look identical:

| kind | git mode | edit it directly? |
|---|---|---|
| a real tracked brief | `100644` | yes — it is the source |
| a symlink into `dist/` | `120000` | **no** — edit `src/domain.roles/<role>/briefs/` instead |

the second kind points at `dist/`, which `npm run build` regenerates by
`rsync -a … src/ dist/`. so **an edit through the symlink is silently overwritten by the next
build**, and the file reads exactly as it did before you touched it.

## .why it bites

the failure is silent and delayed:

- the edit tool reports success
- the file reads back correct
- the reversal happens later, in an unrelated `npm run build`
- ⇒ so the symptom — *"my change is gone"* — arrives with no link to its cause
  - and the natural read is *"the edit never landed"* rather than *"the build reverted it"*

🟡 and the two kinds are **indistinguishable from a path**. `.readme.md` beside
`term=externalize.pave._.choice._.md` in one directory: the first is a symlink, the second is a real file.

## .the ancestor case — the per-file check returns a FALSE SAFE

**a symlink at a parent directory makes every file beneath it a real file.** so `file <the-file>`
reports `ASCII text` and reads as *safe*, while the path still lands in `dist/`.

measured 2026-09-05, on `.agent/repo=bhrain/role=learner/briefs/rule.require.a-cue-is-not-a-claim.md.min`:

| the path component | is it a link? |
|---|---|
| `.agent` · `repo=bhrain` · `role=learner` | no |
| `briefs` | **yes** → `../../../dist/domain.roles/learner/briefs` |
| the `.md.min` itself | no — a real file, so `file` says `ASCII text` |

⇒ six edits landed in `dist/`. every one reported success, the file read back correct, and **the
diff held none of them** — `git status` tracked only the `src/` copy, which was untouched.

🟡 the shape that bit is the COMMON one. every dependency role this repo enrolls is linked at
its `briefs/` dir, so the per-file check is a false safe across the whole `repo=<dep>` tree.

## .the check — one command, before you edit

**expand the whole path; do not inspect the file.** only a full expand sees an ancestor link:

```sh
realpath '.agent/repo=<repo>/role=<role>/briefs/<the-file>'
```

- the result stays under `.agent/` → real file, edit it here
- the result lands in `dist/` → edit `src/domain.roles/<role>/briefs/<name>` instead,
  then `npm run build`

🟡 `file` is not sufficient and `lstat` is worse — both look at the final component only, and
the link is usually above it.

### the cheapest guard is to never CONSTRUCT the risky path

the check above catches the hazard. it fires only where you already suspect it, and the measured
failure is one where the author had no suspicion at all:

> a tool reported `learner/briefs/rule.require.a-cue-is-not-a-claim.md.min`, rooted at
> `src/domain.roles`. the author read the role name off that line, rebuilt the path as
> `.agent/repo=bhrain/role=learner/briefs/<same-name>`, and wrote through the link into `dist/`.

⇒ the correct path was already on the screen. it was retyped into the dangerous form from a
role name, which is the one input both forms share.

| when… | then… |
|---|---|
| a tool, a grep, or an audit hands you a path | **use it verbatim.** do not rebuild it from a role name |
| you are about to type `.agent/repo=` in an EDIT | ask why — reads are safe there, writes are not |
| you must reach a dependency's brief to edit it | its source is `src/domain.roles/<role>/briefs/`, always |
| you batch an edit across roles | a batch multiplies this: one wrong prefix writes every file into `dist/` |

🟡 **`.agent/` is a READ surface and `src/` is the WRITE surface**, and that split holds with no
`realpath` call at all. reach for the check when a path arrives from elsewhere; reach for the split
when you are the one who types it.

🟡 **the link's target takes one of two forms, and both carry the same instruction: edit the
source.** do not read the shape of the target as a verdict on whether a direct edit is safe.

| the target reads | it hops | on a fresh clone, before `npm run build` |
|---|---|---|
| `…/repo=bhrain/role=<role>/briefs/<name>` | through `dist/` | **dangles** — `dist/` is gitignored and absent |
| `…/src/domain.roles/<role>/briefs/<name>` | straight to the source | resolves |

⇒ prefer the source-path form for a new link. it resolves before a build has ever run, and it
names the file you must edit anyway.

the first form is extant under `domain.terms/`, on these links — two concepts, each linked twice,
once per tier:

| the link | its target |
|---|---|
| `rule.forbid.domain-term-synonyms.md` | `repo=bhrain/role=learner/briefs/…` — an indirect hop |
| `rule.forbid.domain-term-synonyms.md.min` | `dist/domain.roles/learner/briefs/…` — a direct hop |
| `rule.require.domain-term-itemization.md` | `repo=bhrain/role=learner/briefs/…` — an indirect hop |
| `rule.require.domain-term-itemization.md.min` | `dist/domain.roles/learner/briefs/…` — a direct hop |

each is named at `say` in `role=any/boot.yml`, so a fresh clone boots a path that points at no
file until the first build. they are left in place until disturbed; a retarget is clean.

🟡 the `.md` rows are the ones a `dist` grep misses:

- their target reads `repo=bhrain/…`, which is itself a link into `dist/`
- so a search for the literal `dist` finds two of the four and reports that as the set
- ⇒ the hop is transitive; the string match is not

⇒ this passage is enumerated rather than counted, and that is the repair for what it used to be:

- it read *"three links — `.readme.md`, …"* until 2026-09-05
- by then `.readme.md` had become a real file — it holds this repo's census, not the learner's generic doc
- and the survivors had gained a tier suffix
- ⇒ so the count, the names, and the extensions were wrong at once

🟡 census the set, never sample it — and the census has been wrong twice. the table above is
the set; the number is not restated here, so it cannot drift from it.

| the attempt | its method | what it missed |
|---|---|---|
| a `file` call on five paths picked by hand | a sample | `.readme.md` — it was never looked at |
| a walk that matched the literal `dist` | a census, wrong predicate | the two `.md` links, which hop **through** `repo=bhrain/` |

⇒ the second is the sharper lesson: a full walk is not a census if its predicate is wrong. the
first attempt failed to look; the second looked at everything and asked the wrong question of it.

to see every symlink under a tree at once, and where each truly lands:

```sh
git ls-tree -r HEAD --format='%(objectmode) %(path)' '.agent/repo=.this/role=any/briefs'
```

`120000` marks a symlink; `100644` marks a real file. then `realpath` each `120000` row — the
mode says a link exists, and only the expand says where it ends.

## .the cues — when → then

| when… | then… |
|---|---|
| you are about to edit any file under `.agent/` | `realpath` it first — `file` misses an ancestor link |
| the path is `repo=<a dependency>/role=<role>/` | the whole `briefs/` dir is linked. edit `src/` |
| you confirmed the FILE is not a symlink | that check is not the one. **walk the parents, or `realpath`** |
| a change you made "did not stick" after a build | check whether you edited through a symlink |
| a review flags text you are certain you already fixed | same check — the reviewer read the reverted copy |
| you edit a brief under `src/domain.roles/` | safe; that IS the source. run `npm run build` after |

## .why the symlinks exist at all

a brief that is **both** a published role brief and a rule this repo applies to itself lives once
in `src/` and is cross-listed into `role=any` by symlink, rather than copied. one source, two
homes — which is correct, and which is exactly what makes the edit target ambiguous.

## .enforcement

blocker: an edit applied through a `.agent/` symlink rather than to its `src/` source — the next
build reverts it, and no tool reports the loss · an edit under `.agent/repo=<a dependency>/` at
all — that whole tree is linked into `dist/`, so the edit is never in the diff.

## .see also

- `rule.always.reuse-pavement-before-improvise` (learner) — check before you act, not after
- `rule.require.specialize-a-rule-its-readers-look-past` (learner) — **why this brief grew a second
  scope.** every path in it read `repo=.this/role=any`, so a reader who held it in context edited
  `repo=bhrain/role=learner` with no flicker of recognition. the repair was not a louder caveat; it
  was the shape the reader actually occupied, named in their own coordinates
