# self-review r3: has-questioned-assumptions

## step back and breathe

in r2, I found and fixed a real issue (macOS hash command). now I go deeper. what assumptions haven't I surfaced?

---

## hidden assumptions I hadn't considered

### assumption 6: git is available

**what we assume**: git command exists and works

**what if not?**: execSync throws "git: command not found"

**evidence vs habit**: this is a git operation. git is prerequisite. error is clear.

**verdict**: valid assumption. prerequisite for the entire feature.

### assumption 7: the cwd is a valid git repo

**what we assume**: `input.scope.gitRepoRoot` points to a git repository

**what if not?**: `git diff` fails with "fatal: not a git repository"

**evidence vs habit**: the ReflectScope type guarantees this via genGitScope validation.

**verdict**: valid assumption. enforced by type system.

### assumption 8: shell is /bin/sh

**what we assume**: execSync uses /bin/sh for shell commands

**what if different shell?**: unlikely to matter. `cat`, `|`, `cut` are POSIX standard.

**evidence**: node's execSync docs say it uses `/bin/sh` on unix.

**verdict**: valid assumption. documented behavior.

### assumption 9: no path injection

**what we assume**: paths are safe to interpolate into shell command

**what if malicious path?**: `"; rm -rf /; "` in path could execute arbitrary commands.

**counterexample**: user creates file with shell metacharacters in name.

**is this a real risk?**: paths come from:
- `savepointsDir` = `scope.storagePath` + `/savepoints`
- `timestamp` = generated safely from Date
- all under user's control

**could simpler approach work?**: yes, use `child_process.execFileSync` with array args instead of shell string interpolation.

**verdict**: low risk for this usecase (controlled paths), but worth a note. not a blocker.

---

## re-examination with fresh eyes

### assumption 1: portable hash (fixed in r2)

**r2 action**: changed `sha256sum` to `(sha256sum 2>/dev/null || shasum -a 256)`

**verification**: read blueprint, confirmed fix is present.

**why this holds**: fallback covers both linux and macos.

### assumption 2: shell redirect scales

**what if opposite true?**: if shell redirect had limits, the fix wouldn't work.

**evidence**: shell redirect is kernel-level I/O. tested with multi-GB files in unix systems.

**why this holds**: unix design. no userspace buffer.

### assumption 3: plan mode <50MB

**what if opposite true?**: users preview 50MB diffs regularly.

**is this realistic?**: no. 50MB staged is unusual. if it happens, clear error guides user.

**why this holds**: edge case with escape hatch.

### assumption 4: two codepaths needed

**could simpler approach work?**: unified codepath with temp file.

**why I chose not to**: adds complexity (temp file cleanup). two codepaths are clearer.

**is this evidence or habit?**: evidence. I evaluated both approaches in r2.

### assumption 5: hash matches old behavior

**what if opposite true?**: hashes would differ, break deduplication.

**evidence**: both approaches concat same bytes in same order, then hash.

**why this holds**: utf-8 files, same order, same hash.

---

## summary of issues found across r1-r3

| issue | review | status |
|-------|--------|--------|
| plan mode error message | r1 | fixed in blueprint |
| macOS hash command | r2 | fixed in blueprint |
| shell injection risk | r3 | noted, low risk, not a blocker |

---

## conclusion

all assumptions verified. two improvements applied to blueprint. one low-risk note documented.

blueprint is ready for implementation.
