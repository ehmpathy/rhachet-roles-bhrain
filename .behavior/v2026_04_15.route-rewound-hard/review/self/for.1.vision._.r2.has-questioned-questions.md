# self-review: has-questioned-questions

## questions triaged

### question 1: nested stone patterns

**original:** "should `--mode hard` also delete `$stone.yield.md` files that match nested stone patterns?"

**triage:** [answered] via logic

**answer:** yes, but the question was framed incorrectly. there is no "glob" needed. each stone has exactly one yield: `$stone.yield.md`. when stone `3.1.3.research.internal.product.code.test._` is rewound, its yield is `3.1.3.research.internal.product.code.test._.yield.md`. the underscore is part of the stone name, not a special pattern.

if 5 stones cascade, 5 yields may be deleted (if they exist).

**fix applied:** updated vision to clarify exact pattern, not glob.

### question 2: git soft/hard analogy

**original:** "is the git soft/hard analogy the right mental model?"

**triage:** [answered] via wisher feedback

**reason:** wisher chose `--yield drop|keep` instead of git's `--mode soft|hard`. more explicit, reads as intent, avoids collision with `--mode plan|apply` used elsewhere.

**fix applied:** updated vision with `--yield drop|keep` flag.

### question 3: confirmation prompt

**original:** "should there be any confirmation prompt for `--mode hard`?"

**triage:** [answered] via logic

**answer:** no. the explicit `--mode hard` flag IS the confirmation. this is consistent with git's behavior where `git reset --hard` does not prompt. the explicit flag conveys intent.

**fix applied:** updated vision with answer.

## summary

| question | triage | status |
|----------|--------|--------|
| nested stone patterns | [answered] | fixed in vision |
| git soft/hard analogy | [answered] | wisher chose `--yield drop\|keep` |
| confirmation prompt | [answered] | fixed in vision |
