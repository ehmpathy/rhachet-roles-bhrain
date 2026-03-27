# self-review r1: has-questioned-assumptions

## step back and breathe

surface and question all technical assumptions in the blueprint.

---

## assumption 1: sha256sum is available

**what we assume**: sha256sum exists on target systems (linux/mac)

**evidence**: vision states "standard unix tool"

**what if not available?**: execSync throws "sha256sum: not found"

**counterexamples**:
- Windows without WSL
- minimal container images
- embedded systems

**could simpler approach work?**: node crypto works, but requires buffer (the problem we solve).

**verdict**: assumption holds for the target platform (rhachet runs on unix systems). error message is clear if absent. no change needed.

---

## assumption 2: shell redirect handles large output

**what we assume**: `git diff > file` works for any diff size

**evidence**: this is how unix pipes work. shell redirects stream to file without buffer.

**what if not true?**: would fail at OS level, not node level. but this is the standard approach.

**could simpler approach work?**: no. the alternative is spawn with streams, which is more complex.

**verdict**: assumption is correct. shell redirect is the right tool.

---

## assumption 3: plan mode diffs are <50MB

**what we assume**: users don't preview 50MB diffs in plan mode

**evidence**: plan mode is for preview. typical preview = small diff.

**what if not true?**: user hits "ENOBUFS" or "maxBuffer exceeded" at 50MB

**could simpler approach work?**:
- option A: use shell for plan mode too, write to temp, delete after
- option B: raise maxBuffer even higher (100MB? 200MB?)
- option C: accept the limit with clear error

**analysis**:
- option A adds complexity (temp file management)
- option B raises the cap but doesn't eliminate it
- option C (current blueprint) is simple

**verdict**: assumption is reasonable but not certain. the 50MB limit should produce a clear error if hit. could add a better error message: "diff too large for plan mode, use apply mode instead"

**action**: update blueprint to wrap plan mode execSync in try/catch with helpful error.

---

## assumption 4: two codepaths are necessary

**what we assume**: plan mode must not write files

**evidence**: extant tests verify plan mode has no side effects

**what if plan mode could write to temp?**: single codepath would work

**could we change plan mode contract?**:
- pros: simpler code, single codepath
- cons: alters plan mode semantics, may break consumers

**analysis**: the plan/apply pattern exists across rhachet. plan = preview without side effects. altering this breaks convention.

**verdict**: assumption holds. two codepaths preserve extant semantics.

---

## assumption 5: `cat | sha256sum` is correct

**what we assume**: `cat file1 file2 | sha256sum` produces correct combined hash

**evidence**: this concatenates file contents then hashes. matches old behavior of `computeHash(stagedPatch + unstagedPatch)`.

**what if order differs?**: staged comes before unstaged in both approaches. same order.

**what if files are empty?**: `cat '' '' | sha256sum` = hash of empty string. matches old behavior.

**verdict**: assumption is correct. behavior matches old implementation.

---

## summary

| assumption | status | action |
|------------|--------|--------|
| sha256sum available | holds (target platform) | none |
| shell redirect scales | holds (unix design) | none |
| plan mode <50MB | reasonable | add better error message |
| two codepaths needed | holds (preserves semantics) | none |
| cat sha256sum correct | holds (verified) | none |

one minor improvement identified: add helpful error for plan mode buffer exceeded.
