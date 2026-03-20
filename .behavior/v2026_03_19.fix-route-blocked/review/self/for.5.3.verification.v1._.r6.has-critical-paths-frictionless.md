# self-review r6: has-critical-paths-frictionless

sixth pass: manual inspection of snapshot output.

---

## snapshot inspection

read `src/domain.operations/route/__snapshots__/stepRouteDrive.test.ts.snap` [case7] entry.

---

## path 1: blocked option at top

**expectation:** blocked option appears BEFORE stone content.

**verification:**

```
line 119: 🦉 where were we?
line 121: 🍵 tea first. then, choose your path.
...
line 131: │  └─ blocked and need help?
line 132: │     └─ rhx route.stone.set --stone 1.vision --as blocked
...
line 139: 🗿 route.drive
```

tea pause (lines 121-137) appears before route.drive (line 139).
blocked option (lines 131-132) is within tea pause.

**verdict:** blocked option at top ✓

---

## path 2: options are clear

**expectation:** three options with clear labels.

**verification:**

```
line 124: ├─ you must choose one
line 125: │  ├─ ready for review?
line 126: │  │  └─ rhx route.stone.set --stone 1.vision --as arrived
line 128: │  ├─ ready to continue?
line 129: │  │  └─ rhx route.stone.set --stone 1.vision --as passed
line 131: │  └─ blocked and need help?
line 132: │     └─ rhx route.stone.set --stone 1.vision --as blocked
```

each option has:
- question label (ready for review? ready to continue? blocked and need help?)
- command indented below

**verdict:** options are clear ✓

---

## path 3: mandate is visible

**expectation:** "to refuse is not an option" appears.

**verification:**

```
line 134: └─ ⚠️ to refuse is not an option.
line 135:    work on the stone, or mark your status.
```

mandate appears at bottom of tea pause with caution emoji.

**verdict:** mandate visible ✓

---

## conclusion

manual snapshot inspection confirms:
- blocked option at top ✓
- options are clear ✓
- mandate visible ✓

all critical paths are frictionless.

