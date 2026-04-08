# self-review r2: has-questioned-assumptions (deeper pass)

## assumption: the problem is real

**what we assume**: people actually get confused by `v1.i1.md`

**questioned**:
- has anyone ever complained about this?
- is this a genuine pain point or theoretical concern?
- what evidence do we have that this confusion exists?

**evidence**: the wisher (internal team member) raised this. the fact that someone cared enough to wish for it suggests the confusion is real to at least one person.

**counter**: absence of explicit complaints doesn't mean absence of confusion. newcomers may just accept the convention without comprehension.

**verdict**: the problem is real enough to warrant the improvement. low cost, clear benefit.

**holds**: yes.

---

## assumption: the scope is correctly bounded

**what we assume**: we're ONLY renaming the default artifact suffix

**questioned**:
- what about guard artifacts? review artifacts? feedback files?
- does this change affect `.guard`, `.stone`, or other file types?
- are we inadvertently altering more than intended?

**evidence**: the wish specifically says "the `v1.i1.md` pattern" - this is used for stone output artifacts only. guards use `.guard`, reviews use `.review.*`, feedback uses `.[feedback].*`.

**verdict**: scope is correctly bounded to stone yields only.

**holds**: yes.

---

## assumption: "yield" doesn't conflict with reserved terms

**what we assume**: no language, tool, or convention reserves "yield"

**questioned**:
- javascript has `yield` keyword (generator functions)
- python has `yield` keyword
- could file-based tools misinterpret `.yield.md`?

**evidence**: file extensions don't interact with language keywords. `.yield.md` is just a file name convention, not executable code.

**verdict**: no conflict. file names and code keywords are separate domains.

**holds**: yes.

---

## assumption: the change is backwards compatible at runtime

**what we assume**: code that reads behavior artifacts can handle both patterns

**questioned**:
- what if the code hardcodes `.v1.i1.md` pattern?
- what if glob patterns break?
- what if tests expect specific file names?

**evidence**: this needs verification. the vision acknowledges this in "needs verification" but doesn't detail what code paths to check.

**gap found**: the vision should list specific code areas to verify:
1. route driver logic that finds artifacts
2. guard review logic that reads artifacts
3. test fixtures that use the pattern
4. template files that reference the pattern

**action**: add these to research phase scope.

**holds**: partially. verification scope now explicit.

---

## assumption: the farm metaphor is universally understood

**what we assume**: "stone → yield" metaphor works globally

**questioned**:
- do all cultures use this agricultural frame?
- does the metaphor translate to non-english contexts?

**evidence**: "yield" as "output/product" is standard business english. the farm metaphor is illustrative, not required for comprehension.

**verdict**: the word "yield" stands on its own; the metaphor is optional flavor.

**holds**: yes.

---

## assumption: we don't need to preserve iteration capability

**what we assume**: iterations (i1, i2, i3) are never needed

**questioned**:
- what if someone wants to track multiple attempts at a stone?
- what if the first yield fails review and a second is needed?

**evidence**: git history tracks revisions. if review fails, the file is edited in place and committed again. the `i1` suffix was never incremented in practice.

**verdict**: iteration tracker via filename is redundant with git. if multiple attempts are needed, git diff shows the history.

**holds**: yes.

---

## summary

| assumption | r1 status | r2 status | notes |
|------------|-----------|-----------|-------|
| problem is real | not checked | holds | wisher raised it |
| scope is bounded | not checked | holds | only stone yields |
| no keyword conflict | not checked | holds | file name ≠ code |
| backwards compat | needs verification | verification scope explicit | code areas listed |
| metaphor universal | not checked | holds | word > metaphor |
| no iteration needed | not checked | holds | git handles revisions |

deeper review complete. one gap addressed: backwards compat verification scope now explicit.
