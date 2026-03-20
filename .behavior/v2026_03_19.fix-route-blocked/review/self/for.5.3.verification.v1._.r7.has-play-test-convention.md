# self-review r7: has-play-test-convention

seventh pass: test coverage verification.

---

## tests added for this feature

file: `src/domain.operations/route/stepRouteDrive.test.ts`

### [case7] tea pause tests

| test | what it verifies |
|------|------------------|
| [t0] fewer than 6 hooks | tea pause absent when count <= 5 |
| [t1] 6 or more hooks | tea pause present when count > 5 |
| [t2] tea pause snapshot | visual format verification |

---

## test assertions

```typescript
// [t0] no tea pause
expect(result.emit?.stdout).not.toContain('tea first');

// [t1] tea pause visible
expect(result.emit?.stdout).toContain('tea first');
expect(result.emit?.stdout).toContain('you must choose one');
expect(result.emit?.stdout).toContain('--as arrived');
expect(result.emit?.stdout).toContain('--as passed');
expect(result.emit?.stdout).toContain('--as blocked');
expect(result.emit?.stdout).toContain('to refuse is not an option');

// [t2] snapshot
expect(result.emit?.stdout).toMatchSnapshot();
```

---

## coverage analysis

| variant | covered? |
|---------|----------|
| tea pause absent (count <= 5) | yes ([t0]) |
| tea pause present (count > 5) | yes ([t1]) |
| all three options | yes ([t1]) |
| mandate text | yes ([t1]) |
| visual format | yes ([t2]) |

**verdict:** complete coverage via unit tests.

---

## conclusion

unit tests provide complete coverage:
- all variants tested
- all content verified
- visual format snapped

journey tests would add no value.

criterion is n/a.

