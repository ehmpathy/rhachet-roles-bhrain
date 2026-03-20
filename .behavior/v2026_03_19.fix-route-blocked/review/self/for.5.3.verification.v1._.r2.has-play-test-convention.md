# self-review r2: has-play-test-convention

second pass: verify test file locations.

---

## test files for this behavior

```bash
ls src/domain.operations/route/*.test.ts
```

result:
- stepRouteDrive.test.ts

---

## test file inspection

file: `src/domain.operations/route/stepRouteDrive.test.ts`

| suffix | convention | is journey? |
|--------|------------|-------------|
| `.test.ts` | unit test | no |
| `.play.test.ts` | journey test | n/a |

the test file uses `.test.ts` suffix (unit test convention).

---

## test structure

the tests follow BDD pattern:

```typescript
given('[case7] tea pause after 5+ hooks', () => {
  when('[t0] fewer than 6 hooks', () => {
    then('no tea pause', ...);
  });
  when('[t1] 6 or more hooks', () => {
    then('tea pause visible', ...);
  });
  when('[t2] tea pause snapshot', () => {
    then('output matches snapshot', ...);
  });
});
```

this is unit test structure, not journey structure.

---

## conclusion

test files are in correct location:
- `src/domain.operations/route/stepRouteDrive.test.ts`
- uses `.test.ts` suffix (unit)
- no journey tests needed

criterion is n/a.

