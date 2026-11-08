# F20 — the rhachet upgrade rides this pr, in its own commit

## .the fork

- **A.** the rhachet 1.51 bump, its lockfile, its `prepare:rhachet` role list, and the declapract output it regenerates ride this pr as a separate commit, named in the pr body
- **B.** split them into their own pr, merged first

## .taken — A

the toggle stands on 1.51: case3 runs 1.51's peer derive, and the yield's Q7 and Q8 cite 1.51 source. the bump landed in the work tree before this route opened, so B leaves this branch with no rhachet it was tested against until the other pr merges. a separate commit gives a reviewer the same split in the diff view, at the one checkpoint where a human grants the commit quota.

## .verdict — at the checkpoint, A held as one commit

`git.commit.set` refuses a `chore:` as a branch's first commit. the toggle also cannot build without 1.51, so the bump cannot land after the feature. the upgrade rides the `feat` commit, and the commit body and the pr body each name it apart from the toggle.

## .rework — clean

`git.branch.cutover` or a cherry-pick moves the upgrade commit to its own branch.

## .confidence — 80%, why not higher

the commander may prefer an upgrade to ship alone, so it can be reverted alone.

## .where

the checkpoint commit (F11)
