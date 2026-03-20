# self-review r3: has-journey-tests-from-repros

third pass: what tests do we have instead?

---

## the tests we implemented

### [case7] tea pause visibility

| test | type | purpose |
|------|------|---------|
| [t0] | unit | count <= 5, no tea pause |
| [t1] | unit | count > 5, tea pause visible |
| [t2] | snapshot | visual verification |

---

## are these journey tests?

**no.** these are unit tests for a format function.

a journey test would test:
1. driver boots
2. driver runs route.drive
3. hook counter increments
4. after 6+ hooks, driver sees tea pause
5. driver marks status
6. route continues or halts

---

## should we have journey tests?

the blueprint (3.3.1.blueprint.product.v1.i1.md) specified unit tests:

```markdown
### unit tests (stepRouteDrive.test.ts)

| test case | description |
|-----------|-------------|
| [case7] tea pause after 5+ hooks | verify tea pause visibility |
| [t0] fewer than 6 hooks | output does NOT contain tea pause |
| [t1] 6 or more hooks | output contains tea pause with all three options |
| [t2] tea pause snapshot | vibecheck snapshot |
```

the blueprint did not specify journey tests.

---

## conclusion

the route does not have a repros artifact.
the blueprint specified unit tests, not journey tests.
this criterion is not applicable.

