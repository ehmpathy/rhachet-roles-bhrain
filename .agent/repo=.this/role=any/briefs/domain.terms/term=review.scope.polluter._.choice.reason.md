# domain.term.choice.reason: polluter

## .etymology

the word is the **wisher's**, coined 2026-09-24 in the directive that ordered the exclusion built.
it was adopted rather than translated, and it earns its place on one property no candidate shares:

> it names a file by the harm it does in a place it does not belong — never by what it is.

that distinction is the whole concept. a `.given.by_peer` is a careful artifact. a
`pnpm-lock.yaml` is exactly correct. a caught dream is how a followup survives a round. not one of
them is bad; each becomes a defect the moment it reaches a reviewer as a target.

## .the rejected synonyms

| candidate | why not |
|---|---|
| `noise` | grades the file's quality. a peer review is not noise, and the label mis-teaches the reader about why it is dropped |
| `cruft` / `junk` | same defect, with contempt attached. these files each do real work elsewhere |
| `chaff` | implies a worthless byproduct. a `.seeds` entry and a `.given` come from the same process, and one is allowlisted |
| `exclusion` | names the mechanism rather than the subject, and it is ambiguous against `--paths-wout`, which is a different exclusion with different reach |

`exclusion` is the near-miss worth a note. it reads neutral and professional, and it collides
head-on with the caller-supplied `--paths-wout` globs — two exclusions, one word, and they differ
in the one property that matters (see below).

## .evidence

### the measurement — 2026-09-24

over the largest real review prompt this repo has produced (2,507.7k chars, 251 targets):

| polluter | chars | share |
|---|---|---|
| the `.dream` queue | 185.2k | 7.4% |
| a route's `dreams` symlink dir | 131.2k | 5.2% |
| `pnpm-lock.yaml` | 31.4k | 1.3% |
| **total** | **348.0k** | **13.9%** |

the middle row is the duplicate: `.dream` held 29 entries, the route's `dreams` held 22, and **all
22 slugs were present in both**. `rule.always.catch-dreams-for-followups` mandates that symlink, so
the duplicate is structural rather than accidental.

### why it is not a `--paths-wout` glob

the two exclusions differ in reach, and the difference is invisible at the call site:

- `--paths-wout` is applied by `enumFilesFromGlob`, which enumerates the `--paths` side
- a `--diffs` range never passes through that enumeration
- a glob-shaped exclusion binds one of two sources and reads as though it bound both. it
  tests green on a paths-only fixture and lets every polluter through on a diffs-driven lane —
  which is every guard-run lane in this repo

so the polluter decision lands after the join, over the united set. that placement is the reason
the concept needed its own word rather than a glob constant.

## .why the route variant is matched at the repo root

two facts settled this, and the second is the expensive one.

first — a behavior is a specific kind of route, never the category. `howto.create-routes`
declares `.route/` the default variant, `.behavior/` the behavior-driven one, and `.$custom/` for
the rest. a rule keyed on `.behavior` alone lets every `.route/v*` route's paperwork through, and
this repo runs seven of them today.

second — the structural repair is worse than the defect. the obvious fix is "a route is any
dir with a `.route/` inside". seven dirs in this repo are named `.route` and hold no route at
all, and they carry 33 files between them:

```
src/domain.roles/thinker/.route/                          chance.*.md brief drafts
five more under thinker's .scratch tree                   the same drafts
src/domain.roles/thinker/briefs/thinker.tactics/.route/   [.brief.*].md drafts
```

keyed structurally, "all except the allowlist" drops the entire thinker role — real source,
real briefs — from every review scope. and the review still runs clean: the counts parse, the
verdict renders, no assertion anywhere goes red. a silent deletion of a whole role, found only by
somebody who wondered why the reviewer never mentioned it.

route discovery may key structurally, and does — `getAllBindFlagsByBranch` globs for a
`.bind.$branch.flag` inside a `.route/`. it can afford that because the bind flag is the
discriminator: the seven dirs above hold none, so they never match. `isTargetPolluter` is handed a
bare path with no flag to lean on, so the variant name is the only discriminator left to it.

the two are not inconsistent. they discriminate on different evidence, and each keys on the
strongest evidence it is given.

so `SEGMENTS_OF_ROUTE_VARIANT` is a declared set matched at the repo root. explicit beats
clever when the failure mode is a silent deletion. the cost is one line per new variant; the
alternative cost is unbounded and undetectable.

## .invariants

- a polluter is decided by path shape alone — the decision is a pure transformer, so a test walks
  every class exhaustively with no fixture on disk
- the drop is decided by path shape and source: a polluter a specific `--paths` glob named
  is the caller's subject and survives. without it, the 78 binds across 38 guards that read a
  route's own deliverable scope to zero and refuse
- a glob earns that exemption only where every target it matched is a polluter — otherwise a
  catch-all launders the whole corpus past the default
- the allowlist is an allowlist: a route artifact kind added next month is excluded by default and
  must be argued in. a denylist goes stale in silence
- every drop is recorded by name in `input.scope.debug.json`, never as a count — a drop nobody can
  see is a drop nobody can debug
- and every exemption is recorded beside it, in `targetFilesAskedForByName`. the drop list
  alone cannot part the two ways a polluter survives: it is empty under both, so a file kept by
  name and a file kept by `--polluters keep` look identical in it
- when the drop empties the scope, the refusal names the exclusion, the allowlist, and both
  escapes — the by-name glob and the flag. a caller whose globs matched only paperwork otherwise
  reads a zero count as a broken glob and re-tunes a glob that was correct
- `--polluters keep` restores the full scope, so the default is never a wall
