# hazard.npm-pack-on-a-pnpm-host-packs-the-local-tree

> **on this host `npm` is pnpm. `npm pack <spec>` never fetches the spec — it packs the LOCAL
> project and runs its `prepare`, whatever spec it was handed.**

## .what happens

`npm pack rhachet-roles-bhrain@0.42.1 --pack-destination .temp/x` — by name or by registry tarball
url — runs `pnpm pack` in this repo. that:

1. runs `prepare`: `husky install`, a full `npm run build`, then `rhachet init --keys --hooks --roles …`
2. the init rewrites tracked files — measured: it re-sorted the allow list of
   `.agent/.actors/actor.via.repo=ambient/brain/.claude/settings.of.repo.json` (352 lines moved)
3. writes a tarball of the LOCAL build, named for the version in `package.json`

⇒ the tarball LOOKS like the published release — same name, same version — and is the local tree.
a diff against it reads "no change", which is how the defect was caught.

## .why it fools you

- `npm warn Unknown env config …` lines are the only tell that `npm` is pnpm
- the root `package.json` lists this package as its own devDep (`link:.`), so even a name spec
  reads as local
- a cwd change cannot escape it: pnpm `pack` packs the project it finds, never a remote spec

## .what to do instead

| need | do |
|---|---|
| the published tarball of a version | download `npm view <pkg>@<ver> dist.tarball` by url (node `fetch`), and check its sha512 against `dist.integrity` |
| a consumer patch against a published version | `rhx gen.consumer-patch --from <ver> --into <path>.patch` — it does both, and checks the patch applies |
| you already ran `npm pack` here | `git status` — restore any tracked file the init rewrote (`git show HEAD:<path>`) |

blocker: a "published" artifact derived via `npm pack` on this host with no integrity check.

⇒ see also: `gen.consumer-patch.sh` (the paved path) · first seen in
`.behavior/v2026_10_24.fix-status-line-cpu` (the consumer patch for 0.42.1).
