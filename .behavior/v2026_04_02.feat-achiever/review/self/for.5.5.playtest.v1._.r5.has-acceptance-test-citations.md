# self-review: has-acceptance-test-citations (r5)

## the question

does each playtest step have an acceptance test citation?

## the review

### method

grep for `goal.infer.triage` in acceptance tests to verify CLI skill coverage.

### fresh evidence: goal.infer.triage HAS acceptance test coverage

grep results from blackbox/achiever.goal.triage.acceptance.test.ts:

- line 623: `given('[case6] goal.infer.triage shows incomplete goals separately'`
- line 664: `when('[t0] goal.infer.triage is invoked'`
- line 665: `const result = useThen('invoke goal.infer.triage', async () => {`
- line 667: `skill: 'goal.infer.triage'`
- line 742: `given('[case7] goal.infer.triage negative cases'`

### snapshot coverage confirmed

grep also found snapshots at lines 130, 148:
```
exports[`... [case6] goal.infer.triage shows incomplete goals separately when: [t0] goal.infer.triage is invoked then: stdout has good vibes 1`]
```

### corrected playtest to acceptance test map

| playtest step | acceptance test file | test case | lines |
|---------------|---------------------|-----------|-------|
| manual.1 (new goal) | lifecycle | [case1][t0] | 32-69 |
| manual.2 (status update) | lifecycle | [case1][t2] | 94-119 |
| manual.3 (get goals) | lifecycle | [case1][t1] | 71-92 |
| manual.4 (triage) | triage | [case6], [case7] | 623-770 |

### prior review correction

r4 incorrectly claimed goal.infer.triage had no acceptance test coverage. fresh grep proves it is covered by:
- [case6] tests incomplete goals display
- [case7] tests negative cases (invalid scope)
- snapshots capture stdout format

## conclusion

**holds: yes (no gaps)**

all four manual playtest steps have acceptance test coverage:
1. manual.1 → lifecycle [case1][t0]
2. manual.2 → lifecycle [case1][t2]
3. manual.3 → lifecycle [case1][t1]
4. manual.4 → triage [case6], [case7] with snapshot coverage
