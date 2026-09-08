# seed S17 — an untracked scratch dir is review corpus

## .said — verbatim, 2026-09-07

> and what the fuck is this scratch_audit dir and why does it keep getting shit put into it?
> .scratch_audit/full_test_diff.txt

## .settled

**a scratch dir that is untracked and unignored is not scratch. it is an input to every reviewer.**

`--diffs since-main` with zero commits on the branch unions the staged **and untracked** set. so a
dump a driver writes for its own convenience is read, in full, by every lane on the ladder.

| measured, 2026-09-07 | |
|---|---|
| `.scratch_audit/full_test_diff.txt` | 428K |
| `.scratch_audit/boot.driver.txt` | 0B |
| references in the codebase | **0** |
| `git check-ignore` | **no match** |

⇒ **no tool wrote it. the driver did**, twice, and then diagnosed an overflow that its own dumps fed.

## 🔴 .the sharp part — the dir was already indicted, by a dream the driver had read

`.dream/v2026_09_04.fix.a-stray-snap-in-a-gitignored-dir-fails-the-unit-gate.md` names **this exact
path**: a guard lane parked `.scratch_audit/main_guard_peer.snap` there, the unit gate failed with
`0 failed` and exit 2, and the dream records that the extant jest ignore was `.scratch` while the dir
was `.scratch_audit` — *"a prefix that does not match is indistinguishable from an absent rule at the
moment it fails."*

⇒ the driver read that dream, cited it, and then re-used the dir. **pavement read and not walked** is
the failure mode `rule.always.reuse-pavement-before-improvise` calls out by name.

## ⚠️ .and the removal has a trap the same dream records

`rmsafe`'s trash lives **inside** the repo, at `.agent/.cache/…/skill=rmsafe/trash/`. so a single
`rmsafe` on a stray file **relocates** it rather than removes it, and jest still collects from the new
path. it takes a second `rmsafe`, aimed at the trash copy, to clear it.

## .the durable claim

> **a driver's scratch is only scratch where the tools agree it is.** a dir that no `.gitignore`
> covers and no config excludes is a dir the whole pipeline reads. write dumps under a path the repo
> already ignores, or do not write them.

## .landed

- both files removed, plus both `rmsafe` trash copies, plus the empty dirs
- ⏳ the dream's second half — an ignore that reaches the config key which governs obsolete-snapshot
  collection, and covers `.agent/.cache/` — still deferred, and still out of this behavior's scope
