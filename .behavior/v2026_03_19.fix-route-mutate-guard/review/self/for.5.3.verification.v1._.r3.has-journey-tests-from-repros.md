# self-review: has-journey-tests-from-repros (r3)

## question

on third review: are all journey test steps present?

## step-by-step verification

### integration test [case7] steps

```
given('[case7] route bound at .route/ location (not .behavior/)')
  when('[t0] Write to .route/xyz/ artifact') → exits 0 (allowed)
  when('[t1] Write to .route/xyz/subdir/ artifact') → exits 0 (allowed)
  when('[t2] Write to .route/xyz/.route/ metadata') → exits 2 (blocked)
  when('[t3] Bash with .route/xyz/.route/ path') → exits 2 (blocked)
```

all four steps present. each has explicit exit code assertion.

### integration test [case8] steps

```
given('[case8] route bound at .route/ with subdirectory artifacts')
  when('[t0] Write artifact in route root') → allowed
  when('[t1] Write artifact in nested dir') → allowed
  when('[t2] Write to .route/ metadata dir') → blocked
  when('[t3] Bash to .route/ metadata dir') → blocked
```

all four steps present.

### acceptance test [case7] steps

```
given('[case7] route at .route/xyz/ (not .behavior/)')
  when('[t0] guard allows artifact write') → snapshot vibecheck
  when('[t1] guard blocks metadata write') → snapshot vibecheck
```

both steps present with snapshot assertions.

## conclusion

all journey test steps verified present. BDD structure followed. each `when([tN])` step exists.
