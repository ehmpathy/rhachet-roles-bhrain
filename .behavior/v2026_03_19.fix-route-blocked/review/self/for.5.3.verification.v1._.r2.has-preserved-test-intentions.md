# self-review r2: has-preserved-test-intentions

second pass: examine each test case.

---

## extant tests: did they change?

### [case1] route with incomplete stones

**before:** tests stone content, command options, hook mode behavior.

**after:** identical. no changes.

### [case2] route with all stones passed

**before:** tests route complete message.

**after:** identical. no changes.

### [case3] empty route

**before:** tests empty route behavior.

**after:** identical. no changes.

### [case4] vibecheck snapshots

**before:** snapshots for route output.

**after:** identical. no snapshot updates.

### [case5] route with malfunction status

**before:** tests malfunction handler.

**after:** identical. no changes.

### [case6] drum nudge after 7+ hooks

**before:** tests drum nudge visibility.

**after:** identical. no changes.

---

## new tests: what do they verify?

### [case7] tea pause after 5+ hooks

**[t0]:** verifies tea pause is ABSENT when count <= 5
- assertion: `not.toContain('tea first')`
- intention: tea pause should not clutter output on early hooks

**[t1]:** verifies tea pause is PRESENT when count > 5
- assertion: `toContain('tea first')`
- assertion: `toContain('you must choose one')`
- assertion: `toContain('--as arrived')`
- assertion: `toContain('--as passed')`
- assertion: `toContain('--as blocked')`
- assertion: `toContain('to refuse is not an option')`
- intention: tea pause shows all options and mandate

**[t2]:** snapshot test
- assertion: `toMatchSnapshot()`
- intention: visual verification of tea pause format

---

## conclusion

| test category | intention preserved? |
|---------------|---------------------|
| extant tests | ✓ unchanged |
| new tests | ✓ have clear intentions |

all test intentions preserved.

