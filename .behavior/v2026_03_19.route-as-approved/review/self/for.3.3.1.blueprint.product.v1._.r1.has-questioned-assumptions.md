# self-review: has-questioned-assumptions

## assumption.1: multi-line guidance string renders correctly

**what we assume:**
the formatter renders `guidance: string` as a tree leaf via `lines.push(`   └─ ${input.guidance}`);`

**question:** can a multi-line string be rendered correctly with proper tree indentation?

**examination:**
the vision output shows:
```
   └─ as a driver, you should:
      ├─ `--as passed` = signal work complete, proceed
      ├─ `--as arrived` = signal work complete, request review
      └─ `--as blocked` = escalate if stuck

   the human will run `--as approved` when ready.
```

the current formatter only adds `   └─ ` prefix to the first line. subsequent lines need `      ` (6 spaces) for proper tree alignment.

**verdict:** VALID with adjustment.

the guidance string must be pre-formatted with internal tree characters. the formatter handles the first-line prefix; caller handles continuation indentation.

example guidance string:
```
as a driver, you should:
      ├─ `--as passed` = signal work complete, proceed
      ├─ `--as arrived` = signal work complete, request review
      └─ `--as blocked` = escalate if stuck

   the human will run `--as approved` when ready.
```

this is a valid approach — no type change needed, just careful string construction.

---

## assumption.2: header override is sufficient in formatRouteStoneEmit

**what we assume:**
only the header needs to change in the formatter for blocked action.

**question:** are there other codepaths that need modification?

**examination:**
the current blocked action branch:
1. pushes header (HEADER_SET)
2. pushes stone
3. pushes reason
4. pushes guidance

our change: override header to "🦉 patience, friend." for blocked action.

the guidance is passed from setStoneAsApproved.ts, so the tree structure is in the string itself.

**verdict:** VALID.

the formatter code for blocked action is minimal. only header override needed. the structured output comes from the pre-formatted guidance string.

---

## assumption.3: `say` level brief in boot.yml

**what we assume:**
briefs registered under `say:` are loaded when relevant context is present.

**question:** is this behavior documented? will it work?

**examination:**
the wish explicitly states: "lets create a say level boot.yml brief"

the boot.yml structure shows extant `ref:` section. a new `say:` section follows the same pattern.

**verdict:** VALID.

explicit requirement from wisher. follows extant patterns.

---

## assumption.4: extant tests can be extended

**what we assume:**
no new test cases needed — extend assertions in extant blocked action tests.

**question:** do the extant tests cover the right scenarios?

**examination:**
- setStoneAsApproved.test.ts [case3]: tests non-human caller
- formatRouteStoneEmit.test.ts: tests blocked action format
- driver.route.approval-tty.acceptance.test.ts [case1]: tests agent runs --as approved

all scenarios match the wish requirements.

**verdict:** VALID.

extant test structure is correct. only assertions need extension.

---

## summary

| assumption | status | notes |
|------------|--------|-------|
| multi-line guidance renders correctly | valid with care | caller pre-formats with tree chars |
| header override is sufficient | valid | minimal formatter change |
| say level brief works | valid | explicit wisher requirement |
| extant tests can be extended | valid | structure matches scenarios |

all assumptions hold. implementation can proceed with confidence.

