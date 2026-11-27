# hazard.an-untracked-skill-holds-no-mode

> **git records a file's exec bit only once the file is added. an untracked skill `.sh` keeps its
> `+x` only on the disk it was written on — and an uncommitted tree keeps no work across a move.**

## .the mechanism

- git stores a mode (`100755` or `100644`) per tracked path, set at `git add`
- an untracked file has no git entry, so naught carries its mode across a copy, a sync, or a
  tree moved between hosts
- a copy that does not preserve modes lands every `.sh` as `644`
- a skill without `+x` cannot run, and the build that introspects the repo's roles refuses it

## .the cue

| when… | then… |
|---|---|
| a new role's skills sit untracked while a tree moves hosts | check modes first: `tree -p <role>/skills` |
| `repo introspect` or a skill call refuses on a `.sh` you just wrote | read its mode before you read its code |
| you restore `+x` by hand | stage the skills the same turn; the add pins the mode |
| 🔴 the tree has moved hosts once already, uncommitted | it will again. the chmod is a patch; the commit is the cure |
| a role's suites call each skill as `bash <file>` | they pass on a `644` file. a unit clamp on the mode is owed: skeptic's `getSkepticRole.test.ts` `[t5]` |
| no stone asks for a commit yet | `rhx git.stage.add` the skills: the index pins `100755` with no commit |

## .the occurrences

first seen in `rhachet-roles-bhrain/.behavior/v2026_11_23.feat-skeptic-promoted`
(`5.1.execution.from_vision.yield.md`, notes): on 2026-11-24, seven skeptic skill `.sh` files,
untracked, lost `+x` after the tree moved hosts; the build refused until `chmod +x` restored them.

recurred on 2026-11-26, same tree, after a second host move (`/home/vlad` → `/home/camper`): all
eight `.sh` files at `644` again, since the 11-24 chmod was never committed. the same move dropped
every uncommitted write of the crew's reflector seat. the role suites stayed green throughout, since
each calls its skill through `bash`; the `[t5]` mode clamp was red until the chmod, then green, and
the eight files were staged at `100755`.
