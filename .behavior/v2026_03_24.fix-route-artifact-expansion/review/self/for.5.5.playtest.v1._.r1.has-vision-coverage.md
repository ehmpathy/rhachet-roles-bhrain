# self-review: has-vision-coverage

## the question

does the playtest cover all behaviors?
- is every behavior in 0.wish.md verified?
- is every behavior in 1.vision.md verified?
- are any requirements left untested?

## wish coverage

from 0.wish.md:
- "bhrain does NOT expand `$route` variable in guard `artifacts:` globs"
- fix: expand `$route` before glob execution

**playtest coverage:**
- step 1: runs unit test that verifies $route expansion
- step 3: runs acceptance test for full artifact detection

wish is covered.

## vision coverage

from 1.vision.md:

| vision requirement | playtest step |
|-------------------|---------------|
| $route expands to actual route path | step 1 (unit test [case4]) |
| glob runs from repo root | step 1 (no cwd override) |
| default pattern includes route prefix | step 2 (unit test [case5]) |
| end-to-end artifact detection | step 3 (acceptance test) |
| global replacement (/g flag) | edgey paths (grep check) |

all vision requirements covered.

## requirements left untested?

**no.** the playtest verifies:
1. $route expansion in custom patterns
2. default pattern with route prefix
3. glob runs from repo root (no cwd)
4. global replacement for multiple $route

no requirements remain untested.

## conclusion

the playtest covers all behaviors from wish and vision. criterion holds.
