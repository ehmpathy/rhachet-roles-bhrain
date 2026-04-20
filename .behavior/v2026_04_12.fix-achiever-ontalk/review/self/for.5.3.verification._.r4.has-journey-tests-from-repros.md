# review: has-journey-tests-from-repros (r4)

## the question

did you implement each journey sketched in repros?

## status

this behavior has no `3.2.distill.repros.experience.*.md` artifact. this is a bug fix behavior (v2026_04_12.fix-achiever-ontalk) that uses criteria as the test specification rather than separate repros.

## criteria-to-test coverage

the criteria in `2.1.criteria.blackbox.yield.md` serves as the journey specification. here's the coverage:

### usecase.1: ask accumulation via onTalk

| criterion | test case | verified |
|-----------|-----------|----------|
| ask appended to inventory | case1 [t0] | yes |
| reminder emitted to stderr | case1 [t0] | yes |
| hook exits 0 | case1 [t0] | yes |
| asks appended in order | case3 [t0] | yes |
| duplicate messages create separate entries | case4 [t0] | yes |

### usecase.2: coverage verification via onStop

this usecase is about onStop behavior, not onTalk. onStop was prior work, not part of this behavior.

### usecase.3: reminder output format

| criterion | test case | verified |
|-----------|-----------|----------|
| owl header appears first | case6 [t0] | yes |
| full message content shown | case1 [t0], case6 [t0] | yes |
| consider prompt appears | case6 [t0] | yes |
| triage command shown | case6 [t0] | yes |

### usecase.4: stdin extraction

| criterion | test case | verified |
|-----------|-----------|----------|
| prompt extracted from JSON | case1 [t0] | yes |
| empty prompt handled | case2 [t0] | yes |
| malformed input handled | case5 [t0] | yes |

### edge cases

| criterion | test case | verified |
|-----------|-----------|----------|
| special chars/emoji | case7 [t0] | yes |
| multiline message | case8 [t0] | yes |

## why it holds

1. no dedicated repros artifact exists for this behavior
2. criteria document provides BDD-style test specification
3. all criteria use cases have test coverage
4. test file follows given/when/then structure
5. each `when([tN])` step exists as specified in criteria

