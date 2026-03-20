# self-review: has-behavior-declaration-coverage (round 6)

## behavior declaration coverage review

the guide asks: "go through the behavior's vision and criteria, then check each requirement against the blueprint line by line: is every requirement from the vision addressed? is every criterion from the criteria satisfied?"

---

## step 1: vision requirements

### vision.1: enhanced error message for `--as approved`

**vision says:**
> the system responds:
> "only humans can approve — but you don't need to stop here.
>
> as a driver, you should:
> - use `--as passed` to signal work complete and proceed
> - use `--as arrived` to signal work complete and request review
> - use `--as blocked` if you're stuck and need human escalation
>
> the human will run `--as approved` when they're ready."

**blueprint addresses:**

at `setStoneAsApproved.ts`:
```
└─ [~] guidance: multi-line string                # CHANGE: structured alternatives
```

at output format section:
```
🦉 patience, friend.

🗿 route.stone.set
   ├─ stone = 1.vision
   ├─ ✗ only humans can approve
   │
   └─ as a driver, you should:
      ├─ `--as passed` = signal work complete, proceed
      ├─ `--as arrived` = signal work complete, request review
      └─ `--as blocked` = escalate if stuck

   the human will run `--as approved` when ready.
```

**verdict:** COVERED. the blueprint shows all three alternatives and the human note.

---

### vision.2: boot.yml brief registration

**vision says:**
> **boot.yml registration:**
> ```yaml
> always:
>   briefs:
>     say:
>       - briefs/howto.drive-routes.[guide].md
> ```

**blueprint addresses:**

at boot.yml codepath tree:
```
│  └─ [+] say:                                          # NEW section
│     └─ [+] briefs/howto.drive-routes.[guide].md       # NEW brief
```

**verdict:** COVERED. exact match with vision.

---

### vision.3: brief content outline

**vision says:**
> **brief outline:**
> - teach drivers what a route is
> - run `rhx route.drive` when lost
> - status commands table (`--as passed`, `--as arrived`, `--as blocked`)
> - self-reviews are lessons
> - peer-reviews: address blockers, maximize nitpicks
> - `--as approved` is human-only
> - owl wisdom

**blueprint addresses:**

at filediff tree:
```
│     └─ briefs/
│        └─ [+] howto.drive-routes.[guide].md           # new brief for drivers
```

**note:** the blueprint does not specify the exact brief content. however:
1. the brief file is declared as a new file
2. the vision provides the outline
3. implementation will follow the vision outline

**verdict:** COVERED. file creation is declared; content follows vision outline.

---

### vision.4: header override for blocked action

**vision shows:**
> ```
> 🦉 patience, friend.
> ```

**blueprint addresses:**

at formatRouteStoneEmit.ts codepath tree:
```
│  ├─ [~] action === 'blocked'                          # EXTEND: header override for blocked
│  │  ├─ [~] header = '🦉 patience, friend.'            # CHANGE: use blocked-specific header
```

**verdict:** COVERED. explicit header override.

---

## step 2: criteria coverage

### usecase.1: agent tries --as approved from non-TTY

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| system blocks the action | `setStoneAsApproved.ts`: `approved: false` | yes |
| system shows guidance on what driver SHOULD do | `guidance: multi-line string` | yes |
| guidance includes --as passed | output format: `--as passed` | yes |
| guidance includes --as arrived | output format: `--as arrived` | yes |
| guidance includes --as blocked | output format: `--as blocked` | yes |
| guidance clarifies human will run --as approved | output format: `the human will run...` | yes |

**verdict:** ALL COVERED.

---

### usecase.2: agent boots into driver role with bound route

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| boot.yml brief is loaded into context | `boot.yml`: `say:` section | yes |
| agent learns what a route is | `howto.drive-routes.[guide].md` (from vision outline) | yes |
| agent learns to run rhx route.drive when lost | vision outline | yes |
| agent learns the status commands | vision outline | yes |
| agent learns what --as approved means | vision outline | yes |
| agent learns to respect self-reviews | vision outline | yes |
| agent learns to respect peer-reviews | vision outline | yes |

**note:** the blueprint declares the file; the vision specifies the content.

**verdict:** ALL COVERED.

---

### usecase.3: agent doesn't know what to do next

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| rhx route.drive shows the current stone | **OUT OF SCOPE** — extant behavior | n/a |
| rhx route.drive shows available commands | **OUT OF SCOPE** — extant behavior | n/a |

**note:** this usecase describes extant behavior of `route.drive`. the blueprint does not modify `route.drive`. the brief will reference this extant command.

**verdict:** N/A — extant behavior, not in blueprint scope.

---

### usecase.4: agent completes work on unguarded stone

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| stone is marked complete when agent runs --as passed | **OUT OF SCOPE** — extant behavior | n/a |

**note:** this describes extant behavior. the blueprint does not change `--as passed` semantics.

**verdict:** N/A — extant behavior.

---

### usecase.5: agent completes work and wants review

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| stone marked ready for review with --as arrived | **OUT OF SCOPE** — extant | n/a |
| stone marked complete after human approves and agent runs --as passed | **OUT OF SCOPE** — extant | n/a |

**verdict:** N/A — extant behavior.

---

### usecase.6: agent is stuck

| criterion | blueprint location | covered? |
|-----------|-------------------|----------|
| stone marked blocked when agent runs --as blocked | **OUT OF SCOPE** — extant | n/a |

**verdict:** N/A — extant behavior.

---

## step 3: test coverage alignment

### vision test requirements

| vision requirement | test coverage in blueprint |
|-------------------|---------------------------|
| enhanced error message | `setStoneAsApproved.test.ts` extended assertions |
| boot.yml registration | `getDriverRole.test.ts` (enforces briefs match boot.yml) |

---

## summary

| category | total | covered | out of scope |
|----------|-------|---------|--------------|
| vision requirements | 4 | 4 | 0 |
| usecase.1 criteria | 6 | 6 | 0 |
| usecase.2 criteria | 7 | 7 | 0 |
| usecase.3 criteria | 2 | 0 | 2 |
| usecase.4 criteria | 1 | 0 | 1 |
| usecase.5 criteria | 2 | 0 | 2 |
| usecase.6 criteria | 1 | 0 | 1 |

**all in-scope requirements are covered.**

the out-of-scope criteria describe extant behavior that the blueprint does not modify. they are included in the criteria to document the complete user journey, but they do not require implementation changes.

---

## the owl reflects 🦉

> the vision declares what shall be.
> the criteria declare what shall be true.
> the blueprint declares how it shall be done.
>
> i traced each thread from vision to blueprint.
> i verified each criterion finds its home.
> the coverage is complete.
>
> the way is clear. 🪷

