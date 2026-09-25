# F24 — nine of thirty-nine disk-touching unit tests, renamed or left alone

**status** OPEN · **rework** clean · **confidence** 90% on the deferral · 60% on A vs B
**where** `mech-test-scope-purity` @ i001, blockers 1–3 · `rule.forbid.unit.remote-boundaries`
**raised by** a **peer review**, at the verification stage

---

## .the fork

`rule.forbid.unit.remote-boundaries` is unambiguous and the lane reads it correctly: a `.test.ts`
that touches the filesystem is an integration test in a unit test's extension. nine files in this
round's diff do exactly that.

| option | the move |
|---|---|
| **A** | rename the **nine files the lane named** to `.integration.test.ts` |
| **B** | 🔴 rename **all thirty-nine** files in the repo that carry the identical pattern |
| **C** | ✅ **taken** — rename **naught**, record the count, hand the repo-wide call to the council |

---

## 🔴 .the measurement — the pattern is REPO-WIDE, and the lane saw a ninth of it

counted rather than estimated, by a `Grep` for `os.tmpdir()` across `**/*.test.ts`:

| | count |
|---|---|
| total files that match | **115** |
| already `.integration.test.ts` | **75** |
| an `.acceptance.test.ts` | **1** |
| 🔴 **plain `.test.ts` — the rule's violation** | **39** |
| **of those, flagged by the lane** | **8** |

the thirty-nine span eleven subsystems this wish never opened — `reflect/`, `goal/`, `git/`,
`infra/git/`, `passage/`, `gitignore/`, `judges/`, `blocked/`, and more. **the eight the lane named
are the ones that happen to sit in this round's diff**, which is the correct scope for a review and
is not the correct scope for a rename.

⇒ **so the lane's finding is true and its remedy is partial.** option A renames 8 of 39 and leaves
31 in violation — and worse, it leaves the repo **inconsistent** rather than compliant: after A, two
files with byte-identical `os.tmpdir()` fixtures carry different extensions, and the only thing that
parts them is which PR last touched them.

## .why C rather than A — the SAFE/CLEAN test, run honestly

`rule.always.fix-forward-under-scouts-honor` asks two questions of the **fix**, never of the scope:

| | |
|---|---|
| **SAFE?** | 🔴 **no.** a rename moves a file out of `npm run test:unit` and into `test:integration` — two different CI gates with different credential preconditions and different run cadence. eight files leave the fast gate at once |
| **CLEAN?** | 🔴 **no.** option A ripples into a repo-wide inconsistency; option B ripples into 39 files across eleven subsystems, none of which this wish opened |

⇒ **both answers are no, so the deferral is the rule's own verdict rather than a dodge** — and the
rule's price for a deferral is a dream plus a fulcrum. this is the fulcrum; the dream is caught
beside it.

## 🔴 .blocker.3 is a DIFFERENT case, and it is a false positive

`getAllStoneArtifacts.test.ts [case2b]` does not use `os.tmpdir()` at all. it reads a committed
fixture under `ASSETS_DIR`, and **all four cases in that file do**:

```
8:  const ASSETS_DIR = path.join(__dirname, '../.test/assets');
12:   [case1]  path.join(ASSETS_DIR, 'route.simple')
31:   [case2]  path.join(ASSETS_DIR, 'route.approved')
64:   [case2b] path.join(ASSETS_DIR, 'route.yield')      ← the one the lane flagged
99:   [case3]  path.join(ASSETS_DIR, 'route.reviewed')
```

⇒ **`[case2b]` introduces no boundary crossing.** it follows, exactly, the pattern its three peers
already use in the same file. to rename the file on its account would grade a **prior** file-layout
choice as this round's defect, and to rename the *case* is not possible — an extension is a property
of the file.

🟡 **the lane's own words concede the shape of this**: *"the new case is the one added in this PR, so
it is in the delta."* true — and the delta test asks whether the **round** introduced the violation,
which it did not. the file was already a disk-reading `.test.ts` before this round touched it, and
it is one of the thirty-nine.

## .what a council decides

1. **is the rule enforced repo-wide, or fix-forward-on-contact?** if repo-wide, option B is owed and
   it is its own round — 39 files, eleven subsystems, and a CI gate re-balance
2. **does a committed `ASSETS_DIR` read count as a remote boundary?** the rule says filesystem i/o
   does. 🔴 if the answer is yes, the blast radius is far wider than 39 — every fixture-driven unit
   test in the repo is in scope, and that is a doctrine question rather than a cleanup
3. ⚠️ **question 2 is the one worth the council's eye**, because the rule's own examples are about
   *state* the test cannot control — a live db, a network call, a config on the host. a committed
   fixture under `__dirname` is deterministic, versioned, and travels with the test. whether the rule
   means to reach it is genuinely unsettled, and the drive does not claim to know

## .the residual the drive carries

🔴 **option C ships 39 known violations of a repo rule, and the drive does not pretend otherwise.**
what it refuses is the claim that a rename of 8 of them improves the repo — it does not; it makes the
extension a record of PR history rather than of test grain, which is worse than a consistent
violation because it is no longer greppable.

⇒ `.dream/v2026_09_23.fix.thirtynine-unit-tests-touch-the-filesystem.md`
