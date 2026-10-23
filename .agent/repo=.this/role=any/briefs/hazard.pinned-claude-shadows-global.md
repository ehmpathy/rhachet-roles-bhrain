# hazard.pinned-claude-shadows-global

## .what

if you pin the brain CLI (`@anthropic-ai/claude-code`) in `package.json`, the peer-review guards
will use that **pinned** claude — NOT the global `claude` you run by hand.

a stale pin makes every l3 reviewer launch a stale brain, even though your own `claude` works.

## .why

`$rhx` in a guard expands to `<repoRoot>/node_modules/.bin/rhx`, and the guard runner prepends
`<repoRoot>/node_modules/.bin` to `PATH` before it spawns the subprocess. so when
`rhx enroll claude` spawns `claude`, PATH resolves to **`node_modules/.bin/claude`** — the
repo-pinned version — which shadows your global install.

| who | binary | version (example) | outcome |
|---|---|---|---|
| human types `claude` | global (`~/.local/share/pnpm/claude`) | 2.1.87 | works |
| guard runs `$rhx enroll claude` | repo-local `node_modules/.bin/claude` | 2.0.76 (pinned) | hangs / stale |

both are true at once. the only difference is which `claude` binary `PATH` resolved — so the bug
is invisible to anyone who debugs it with their global `claude`.

## .measured

bhrain pinned `@anthropic-ai/claude-code: 2.0.76`; every l3 enroll guard hung until timeout, even
though every manual repro on global `2.1.87` worked. a pin bump to match global cured it.

## .how to detect

```sh
# what the GUARD launches (the one that matters):
cat node_modules/.bin/claude        # see the @anthropic-ai+claude-code@X.Y.Z path it exec's

# what a HUMAN launches:
which -a claude                     # global install path

# if the versions differ, reviewers and humans run different brains
```

## .how to avoid

- prefer to NOT pin the brain CLI; let reviewers use the same brain humans use.
- if you must pin, keep it current; treat a stale brain pin as a defect.
- when an l3 enroll guard misbehaves but a hand-run `rhx enroll claude` does not, suspect a
  version mismatch FIRST — before exotic causes (symlink cycles, `.agent` topology, etc).
- rhachet now names this failure itself: the enroll lane exits `✋ ConstraintError: brain-cli
  'claude' is X at …/node_modules/.bin/claude, below the floor Y`, and the given lists the
  shadowed global. bump the pin with `rhx set.package.upgrade --package @anthropic-ai/claude-code
  --to <global version>`.

a version bump is not done until `node_modules/.bin/claude --version` answers. 2.1.x ships a
native binary via its postinstall, and pnpm skips a dependency's postinstall unless it is
allowlisted — so the pin installs and the binary does not. run
`node node_modules/@anthropic-ai/claude-code/install.cjs`, then re-check the version.

## .see also

- `src/domain.operations/route/guard/runStoneGuardReviews.ts` — `substituteVars` ($rhx → repo .bin) + PATH prepend
- `node_modules/rhachet/dist/domain.operations/enroll/enrollBrainCli.js` — spawns `claude`
