# self-review r6: has-behavior-declaration-coverage

review for coverage of the behavior declaration.

---

## vision requirements check

### vision summary (line 134-139)

the vision lists 6 items:
1. add a **tea pause section** at the top of route.drive output (after count > N)
2. the section presents all three options: arrived, passed, blocked
3. the section makes clear: to refuse is not an option
4. update **route.stone.set.sh** header to document all --as options
5. ensure **Role.hooks.onBoot** boots the route.stone.set skill
6. add **route.stone.set** to boot.yml as a `say` skill for startup awareness

### coverage matrix

| vision requirement | blueprint location | covered? |
|--------------------|-------------------|----------|
| 1. tea pause at top | blueprint section 1, line 79-105 | ✅ yes |
| 2. three options | blueprint lines 86-99 | ✅ yes |
| 3. mandate text | blueprint lines 101-102 | ✅ yes |
| 4. header update | blueprint section 2, lines 107-135 | ✅ yes |
| 5. onBoot boots skill | — | ❓ check below |
| 6. boot.yml say | blueprint section 3, lines 137-150 | ✅ yes |

### requirement 5 deep check: "ensure Role.hooks.onBoot boots the route.stone.set skill"

**vision clarification** (line 79-81 in r1 assumptions):
> "checked `getDriverRole.ts:22-27` — onBoot runs `route.drive --mode hook`. this is correct. skill awareness comes from boot.yml say, not onBoot command."

**r6 analysis**: the vision originally said "ensure onBoot boots this skill" but the r1 assumptions clarified that:
- onBoot already runs `route.drive` (not route.stone.set)
- skill AWARENESS comes from boot.yml `say`, not onBoot
- route.drive SHOWS the commands (via tea pause)
- no change needed to onBoot

**blueprint addresses this**: by add boot.yml `skills.say` section. drivers see route.stone.set header on boot.

**r6 verdict**: ✅ requirement 5 is satisfied via boot.yml say (not onBoot change)

---

## criteria requirements check

### criteria usecase.1

```
given(driver is on a stone)
  when(route.drive hook runs and count > N)
    then(tea pause section appears at TOP of output, before stone content)
    then(tea pause shows all three options: arrived, passed, blocked)
    then(tea pause shows mandate: "to refuse is not an option")
```

**blueprint coverage**:
- "tea pause appears at TOP" → blueprint line 81: "insert after line 409... before line 412"
- "all three options" → blueprint lines 86-99: arrivedCmd, passedCmd, blockedCmd
- "mandate" → blueprint lines 101-102: "to refuse is not an option"

**r6 verdict**: ✅ usecase.1 covered

### criteria usecase.2

```
given(driver boots with Role.hooks.onBoot)
  when(boot completes)
    then(route.stone.set skill header is shown)
    then(skill header documents --as arrived, --as passed, --as blocked options)
```

**blueprint coverage**:
- "skill header is shown" → blueprint section 3: boot.yml skills.say
- "header documents options" → blueprint section 2: header update with all options

**r6 verdict**: ✅ usecase.2 covered

### criteria usecase.3

```
given(driver sees tea pause)
  when(driver runs `rhx route.stone.set --stone X --as arrived`)
    then(stone is marked as arrived)
  when(driver runs `rhx route.stone.set --stone X --as passed`)
    then(stone is marked as passed)
  when(driver runs `rhx route.stone.set --stone X --as blocked`)
    then(driver must articulate blocker)
    then(stone is marked as blocked)
```

**blueprint coverage**:
- these are EXTANT behaviors in route.stone.set
- blueprint does not modify route.stone.set execution logic
- blueprint only updates VISIBILITY (header + tea pause)

**r6 verdict**: ✅ usecase.3 relies on extant behavior (no blueprint change needed)

### criteria usecase.4

```
given(driver is stuck on impossible stone)
  when(driver loops N+ times without progress)
    then(tea pause appears with clear blocked option)
  when(driver marks --as blocked with articulation)
    then(route halts gracefully)
    then(driver is no longer stuck in loop)
```

**blueprint coverage**:
- "tea pause appears" → blueprint section 1: tea pause when suggestBlocked
- "route halts gracefully" → extant behavior when blocked
- "no longer stuck in loop" → extant behavior when blocked

**r6 verdict**: ✅ usecase.4 covered (tea pause + extant blocked behavior)

---

## test coverage check

### criteria-derived tests needed

| criterion | test assertion | blueprint test coverage |
|-----------|----------------|------------------------|
| tea pause appears at top | toContain('tea first') | ✅ blueprint line 169 |
| all three options shown | toContain('--as arrived/passed/blocked') | ✅ blueprint lines 170-173 |
| mandate shown | toContain('to refuse') | ✅ blueprint line 174 |
| absent when count <= 5 | not.toContain('tea first') | ✅ blueprint line 177 |

**r6 verdict**: ✅ all criteria have test coverage in blueprint

---

## gaps found

none. all 6 vision items covered. all 4 criteria usecases covered. all test assertions mapped.

---

## conclusion

blueprint fully covers the behavior declaration:

| source | items | covered |
|--------|-------|---------|
| vision summary | 6 items | 6/6 ✅ |
| criteria usecases | 4 usecases | 4/4 ✅ |
| test assertions | 5 assertions | 5/5 ✅ |

**r6 verdict**: blueprint passes behavior declaration coverage review. no gaps found.
