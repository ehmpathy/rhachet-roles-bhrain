# hazard: a published brief cannot cite the repo's glossary — the term file never ships

## .what

a brief under `src/domain.roles/<role>/briefs/` publishes. a term cluster under
`.agent/repo=.this/role=any/briefs/domain.terms/` does not.

⇒ **so a citation that crosses that line resolves for us and dereferences to no match for every
external consumer of the package.**

| tree | publishes? | why |
|---|---|---|
| `src/domain.roles/<role>/briefs/` | ✅ yes | `npm run build` rsyncs `src/` → `dist/`, and `dist/` is what ships |
| `.agent/repo=.this/role=any/briefs/` | 🔴 never | it sits outside `src/`, so no rsync reaches it |

🟡 verified, over assumed: a glob for `dist/**/term=*` returns exactly one file — an unrelated
thinker brief. zero `term=*._.choice.*` cluster files reach `dist/`.

## .why it bites

the failure is **invisible from inside this repo.** every citation resolves here, because the
glossary is on disk here. a reviewer reads the brief, follows the reference, finds the file, and
grades it sound.

⇒ so the defect is only observable from a vantage point nobody in this repo occupies.

and the artifact it produces is the one `rule.always.reuse-pavement-before-improvise` names
outright — **the phantom path**: *"a brief cited as the parent claim of an argument, which was
never written. it reads as authoritative and dereferences to no match."* here the file exists and
is unreachable, which reads identically to the consumer and is worse for us, because we can prove
it exists and they cannot reach it.

## .the two lawful moves

| move | when to reach for it |
|---|---|
| **(a) restate the claim inline** | the brief needs one sentence of the term's content — quote or paraphrase it, and do not send the reader anywhere |
| **(b) put the claim in a published brief, cite that** | several briefs depend on the claim — it earns its own file under `src/domain.roles/<role>/briefs/`, which ships |

⇒ **for a term whose home is correct, the fix is (a) or (b).** a citation that dereferences to no
match is the defect this brief names, and both moves close it today.

🟡 **but not every term's home IS correct** — see below. where the word itself belongs in the
published tree, (a) and (b) treat a symptom.

## 🔴 .the glossary splits two ways, and only one half is correctly unpublished

| the term | who it serves | unpublished is |
|---|---|---|
| `term=route.stone`, `term=route.guard.*`, `term=glossary.sweep.*` | this repo's own machinery — a stone, a guard, a sweep are bhrain concepts | ✅ correct |
| `term=artifact.tool`, `term=artifact.tool.skill`, `term=enbrief` / `enskill` / `entool`, `term=pave` | org-wide practice vocabulary — the words a PUBLISHED brief teaches | 🔴 **wrong** |

⇒ **the second row is the one that bites:**

- `philosophy.entoolment-is-the-pinnacle` ships to every consumer and teaches `entool`, `enskill`,
  and the tool/skill split
- and the clusters that declare those words do not ship with it
- ⇒ so a consumer is taught a vocabulary and handed no glossary for it
  - that is a **home** defect, never a citation one, and moves (a) and (b) cannot reach it

the axis is mechanical, over a taxonomy judgment: **does a published brief teach the word? then the
word must publish.** a `Grep`, never an opinion.

### the third move, for a home defect

a brief can live in `src/` (so it publishes) **and** be symlinked into `.agent/` (so it boots
here). **ten links already exist** — every `120000` row of
`git ls-files -s '.agent/repo=.this/role=any/briefs'`. 🟡 **they are not all the same
arrangement**, and the difference decides which of them is a precedent for this move:

| the link | resolves into | role |
|---|---|---|
| `im_a.bhrain_owl.md` | ✅ `src/` | driver |
| `im_an.obsessive_learner.md` | ✅ `src/` | learner |
| `research.selfreview-effectiveness.md` | ✅ `src/` | learner |
| `rule.require.review-by-wrapper-pattern.md` | ✅ `src/` | reviewer |
| `domain.terms/catalog.of=externalization._.md` | ✅ `src/` | learner |
| `domain.terms/.readme.md` | ⚠️ `dist/`, via a second hop through `.agent/repo=bhrain/` | learner |
| `domain.terms/rule.forbid.domain-term-synonyms.md` | ⚠️ `dist/`, same second hop | learner |
| `domain.terms/rule.require.domain-term-itemization.md` | ⚠️ `dist/`, same second hop | learner |
| `domain.terms/rule.forbid.domain-term-synonyms.md.min` | ⚠️ `dist/` directly | learner |
| `domain.terms/rule.require.domain-term-itemization.md.min` | ⚠️ `dist/` directly | learner |

⇒ **only the five `src/` rows are precedent for the move above.** the five `dist/` rows are the
*other* hazard — a link into a build artifact, which resolves only after a build
(`hazard.agent-brief-may-be-a-dist-symlink`). both arrangements publish, since `dist/` is what
ships; they differ in what breaks on a clean checkout.

⇒ **both term RULES are on the list, and one `domain.terms/` file is src-rooted
(`catalog.of=externalization._.md`). only the term CLUSTERS are left behind** — which is the shape
of the defect: the discipline ships and the vocabulary it governs does not.

⇒ so the third move is **already in use for this exact directory.** what stops a sweep is cost,
never possibility: the split touches the `boot.yml` globs, `domainTermsBootReachability`, and
`genDomainTermsScaffold`.

⚠️ **this census read `seven` from 2026-08-30 to 2026-09-08**, and the three it missed are the
three that arrived after it was written. **it was derived once, by the command printed above it,
then maintained by hand.** ⇒ a census with its own derivation command one line up is the cheapest
artifact in the repo to re-derive, and it still went stale — so **re-run the command; do not read
the table and trust it.**

🟡 **safe, and not clean** — caught as `.dream/v2026_08_31.enbrief.org-wide-terms-do-not-publish.md`.

## .what is NOT a violation

a `term=…` string is not always a citation. two uses are lawful in a published brief:

- **a shape template** — `term=<x>._.choice._.md` in `template.domain-term`, which declares the
  name convention rather than points at a file
- **a worked example of the convention** — `term=route.stone._.choice._.md` in
  `rule.require.summary-at-the-cluster-root`, where the reader needs the *shape*, never the file

the violation is a reference the reader is told to **go read**: `` (`term=skill`) ``,
`` see `term=inventory` ``.

## .the check — before a published brief lands

```sh
rhx grepsafe --pattern 'term=[a-z]' --path src/domain.roles --glob '*.md'
```

🟡 **scope with `--path`, never with a slash in `--glob`.** `grepsafe --glob` matches the
BASENAME, so `'src/domain.roles/**/*.md'` matches no file and reports a clean `0 matches`,
exit 0 — a check that renders as passed and ran over naught.

then, per hit, one question:

> **"do i declare the SHAPE, or point at a FILE?"**

- the shape → lawful, leave it
- a file → restate it inline, or move the claim to a published brief

## .the cues — when → then

| when… | then… |
|---|---|
| you write `` (`term=…`) `` in a brief under `src/domain.roles/` | 🔴 stop — that reference does not ship |
| you reach for a term cluster as the **source** of a claim in a published brief | quote the sentence you need; do not send the reader to the cluster |
| you write in `.agent/repo=.this/` and cite a term | lawful — both files sit in the same unpublished tree |
| a term's `.reason` holds the argument a published brief depends on | that argument earns a published brief of its own — move it, then cite the new file |

## .the measured state

**9 unreachable citations across 6 published briefs**, as of 2026-08-30.

- two of them are broken twice — `rule.prefer.decompose-a-subject-via-suffixes` and
  `rule.require.inventory-for-enumerable-concepts` both cite `term=inventory`, where the declared
  cluster is `term=itemization.inventory`
- ⇒ so the name is stale AND the path is unreachable, and neither defect was catchable from inside
  this repo

🟡 **the repair of those 9 is a separate pass.** this brief exists so the count stops its growth; it
claims no arrears are paid.

## .enforcement

- a brief under `src/domain.roles/` that cites a `domain.terms/` cluster as a file to read =
  **blocker** — it dereferences to no match for every external consumer
- a `term=…` string used as a **shape template** or a worked example of the name convention =
  **not a violation**
- a citation between two files that both sit under `.agent/repo=.this/` = **not a violation**

## .see also

- `hazard.agent-brief-may-be-a-dist-symlink` — the peer fact about the same `src/` → `dist/`
  chain, from the other direction: which `.agent/` files are safe to edit
- `rule.always.reuse-pavement-before-improvise` (learner) — the phantom-path anti-pattern this is
  one mechanical cause of
- `rule.require.domain-term-itemization` — why the glossary exists. 🟡 it does **not** say the
  glossary must stay unpublished; that clause was this brief's own over-reach, corrected above
- `.dream/v2026_08_31.enbrief.org-wide-terms-do-not-publish.md` — the home defect the correction
  above names, caught rather than swept
