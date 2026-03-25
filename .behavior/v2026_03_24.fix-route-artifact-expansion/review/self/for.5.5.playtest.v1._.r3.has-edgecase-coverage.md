# self-review: has-edgecase-coverage

## the question

are edge cases covered?
- what could go wrong?
- what inputs are unusual but valid?
- are boundaries tested?

## edge cases in playtest

### no $route in pattern

**covered.** the "no $route in pattern" section explicitly verifies:
- unit tests [case1] and [case2] pass
- patterns without $route work as-is

### $route appears multiple times

**covered.** the edgey paths section includes:
- grep check for `/\$route/g` (global flag)
- confirms all instances replaced

### no matches

**covered.** unit tests include [case3] which verifies:
- empty array returned when no matches

## what could go wrong?

| potential issue | playtest coverage |
|-----------------|-------------------|
| $route not expanded | step 1 unit tests |
| cwd still set | acceptance test verifies paths |
| default pattern wrong | step 2 unit tests |
| partial expansion | grep for /g flag |

## boundaries tested?

| boundary | coverage |
|----------|----------|
| empty artifacts array | [case3] unit test |
| single artifact | [case4] unit test |
| multiple artifacts | acceptance test |

## conclusion

edge cases are adequately covered:
1. no $route pattern
2. multiple $route occurrences
3. no matches
4. default vs custom patterns

criterion holds.
