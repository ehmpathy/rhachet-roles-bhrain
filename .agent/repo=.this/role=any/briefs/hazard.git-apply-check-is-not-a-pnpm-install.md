# hazard.git-apply-check-is-not-a-pnpm-install

> **a patch that `git apply --check` accepts can still be one pnpm refuses at install. prove a
> consumer patch by an install, never by a check.**

## .the mechanism

pnpm applies a patch with its own engine (a patch-package fork), into the copy of the package it
imports from its store. that copy is not a fresh extraction:

- pnpm's store is content-addressed and hardlinked — one inode per file content, shared by every
  install on the host
- rhachet links a role's assets (briefs, skills, inits) into `.agent/`, read-only. a chmod on one
  hardlink changes the shared inode, so the store copy, and every copy pnpm makes from it, is
  read-only too
- pnpm's engine cannot write a read-only file. it reports one line, `ERR_PNPM_PATCH_FAILED: Could
  not apply patch`, with no cause, and the whole install fails

⇒ `git apply --check` against a fresh tarball extraction sees writable files and passes. the
consumer's host is the only place the refusal exists.

## .the cues

| when… | then… |
|---|---|
| a pr body hands consumers a patch | prove it: `rhx prove.consumer-patch --from <v> --patch <path>` |
| a patch edits a role asset (`.jsonc`, `.md`, `.sh` under `dist/domain.roles/`) | 🔴 it will not install. leave the asset out and name it (`gen.consumer-patch` does) |
| pnpm says `ERR_PNPM_PATCH_FAILED` and the context lines match | check the installed file's mode before the hunk |

blocker: a consumer patch shipped with no install proof · a patch that edits a role asset.

⇒ worked example: `.behavior/v2026_10_24.fix-status-line-cpu/.fulcrums/inventory.of=fulcrums.case=F35-the-consumer-patch-leaves-role-assets-out.md`
— every copy of the patch since its first draft passed the check and would not have installed.
⇒ see also: `hazard.npm-pack-on-a-pnpm-host-packs-the-local-tree.md` (the peer trap one step
earlier: how the base is fetched).
