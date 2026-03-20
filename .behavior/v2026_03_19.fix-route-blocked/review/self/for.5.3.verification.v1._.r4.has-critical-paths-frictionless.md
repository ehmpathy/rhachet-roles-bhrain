# self-review r4: has-critical-paths-frictionless

fourth pass: derive critical paths from wish and vision.

---

## original wish

from `0.wish.md`:

> today,
>
>      │
>      └─ are you blocked? if so, run
>         └─ rhx route.stone.set --stone 5.1.execution.phase0_to_phaseN.v1 --as blocked
>
> only shows up at the bottom of the route.drive hook stdout
>
> lets add a separate dedicated fallen-leaf challenge section at the top

**critical path derived:** blocked option must be visible at TOP.

---

## vision outcome

from `1.vision.md`:

> a driver agent boots up, runs `route.drive`, and immediately sees a clear challenge section at the top

**critical path derived:** challenge appears immediately (at top, not bottom).

---

## critical path walkthrough

### path 1: driver sees blocked option at top

**steps:**
1. driver runs route.drive
2. hook count exceeds 5
3. tea pause appears at top
4. blocked option is visible in tree

**verification:**
- [case7] test confirms tea pause at top
- snapshot shows blocked option in tree
- assertion confirms `--as blocked` text present

**friction:** none — path works as intended.

### path 2: driver understands the options

**steps:**
1. driver sees tea pause
2. driver reads three options
3. driver understands mandate

**verification:**
- snapshot shows clear option labels
- mandate text is direct: "to refuse is not an option"

**friction:** none — options are clear.

### path 3: driver marks blocked

**steps:**
1. driver runs `rhx route.stone.set --stone X --as blocked`
2. route records blocked status
3. driver can articulate blocker

**verification:**
- extant behavior (not changed by this feature)
- skill header documents the option

**friction:** none — command works.

---

## conclusion

critical paths derived from wish and vision are frictionless:
- blocked option visible at top ✓
- options are clear ✓
- command works ✓

