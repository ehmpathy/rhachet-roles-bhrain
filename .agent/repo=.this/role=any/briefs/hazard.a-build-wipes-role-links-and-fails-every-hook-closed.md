# hazard: a build wipes the role links, and then EVERY hook fails closed

## .what

the `.agent/repo=bhrain/role=<role>/` links are relative symlinks into `dist/`. a build that removes
`dist/` and then compiles for a minute or two leaves every one of them broken for that whole window.

a PreToolUse hook that invokes a skill from a broken role link cannot look it up, and a hook that
cannot find its own skill **refuses the tool call**:

```
✋ ConstraintError: no skill "route.mutate.guard" found in any linked role
```

⇒ so one build costs you Read, Write, Edit, and Bash at once — and costs every other session in the
same worktree the same.

## ✅ .the cure — `dist/` is never absent

`npm run build` no longer writes into `dist/`. it stages, then swaps:

| step | script | touches `dist/`? |
|---|---|---|
| clear the stage | `build:clean:tsc` → `rm -rf dist.next/` | no |
| compile | `build:compile:tsc` → `tsc` + `tsc-alias` with `--outDir dist.next` | no |
| copy assets | `build:complete:dist` → `rsync src/ dist.next/` | no |
| swap | `build:complete:swap` → `mv dist dist.prev && mv dist.next dist`, then `rm -rf dist.prev/` | one rename pair |
| manifest | `build:complete:repo` → `rhachet repo introspect`, which reads the new `dist/` | no |

⇒ the old `dist/` serves every hook until the swap, and the swap is two `rename(2)` calls back to
back — microseconds, never minutes. the links resolve before, across, and after a build.

🟡 `npm run build:compile` alone now writes only to `dist.next/`. to refresh what hooks and links
read, run `npm run build`.

## .what the cure does NOT cover

| case | why it still bites |
|---|---|
| two builds at once in one worktree | both stage into `dist.next/`. one's clean can delete the other's half-written stage, and that build fails. `dist/` still holds the last good swap |
| a build that dies before the swap | `dist/` keeps the prior good build; the stale `dist.next/` is cleared by the next build |
| a `dist/` removed by hand | that is the old wipe, by hand. rebuild |

## 🔴 .the misread — a skill name that SHIFTS per tool is not a shifted failure

the error names a different skill per tool: `route.mutate.guard` on a Read,
`route.foreground.guard` on a Bash, `memory.guard` on a Bash inside a subagent. **each TOOL carries
its own hook set, and whichever hook fires first names its own skill.** the state behind all three
names is ONE state: the role's links do not resolve.

## .the escape — if you still see the refusal

```sh
./node_modules/.bin/rhachet roles link --role driver
./node_modules/.bin/rhachet roles link --role learner
```

⇒ which role to relink is READ OFF the error, never guessed: `route.*.guard` is the driver's,
`memory.guard` is the learner's. a subagent inherits the same hooks, so it cannot do this for you.

## .the cues

| when… | then… |
|---|---|
| a hook refuses with `no skill … found in any linked role` | check `dist/` exists. absent → rebuild. present → relink |
| the skill it names changes between tools | one state, many hook sets — never a tear-down in flight |
| you would edit the build scripts | 🔴 keep every write in `dist.next/`. a step that writes to `dist/` reopens the window |
| a type check reports names that plainly exist | 🟡 adjacent cause class: `tsc` read a file mid-write by a peer session. re-run it first |

## .enforcement

blocker: a build step that removes or writes into `dist/` before the swap.
false positive: a hook refusal for a skill whose role was never enrolled — that is a boot defect.

## .see also

- `hazard.agent-brief-may-be-a-dist-symlink` — the peer hazard over the same links. that one is an
  edit that VANISHES; this one is a tool that REFUSES
- `rule.require.qualified-error-headers` (ehmpathy/mechanic) — why the refusal reads as a
  `ConstraintError`, and why a hook that failed OPEN here would be the worse defect
- `.behavior/v2026_09_20.review-cost-meter` — the worked example: the lockout landed three times in
  one round before the stage-and-swap cure
