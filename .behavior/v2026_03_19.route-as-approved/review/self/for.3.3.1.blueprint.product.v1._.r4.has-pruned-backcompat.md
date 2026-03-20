# self-review: has-pruned-backcompat (round 4)

## backward compatibility review: deep examination

the guide asks: "review for backwards compatibility that was not explicitly requested."

this means: look for backcompat SHIMS that were added "to be safe" but not requested.

---

## step 1: does the blueprint contain any backcompat shims?

**examined the blueprint for:**
- deprecation warnings → none found
- version flags → none found
- fallback behavior → none found
- migration paths → none found
- conditional old/new behavior → none found
- compatibility layers → none found

**verdict:** the blueprint contains ZERO backcompat shims.

---

## step 2: should the blueprint contain backcompat shims?

for each potential break point, examine whether backcompat was needed but omitted.

### break point 1: guidance string content change

**the change:**
```
before: "please ask a human to run this command"
after:  "as a driver, you should:\n  ├─ --as passed = ...\n  ├─ --as arrived = ...\n  └─ --as blocked = ..."
```

**who consumes this output?**

examined the codebase for consumers:
- `setStoneAsApproved.ts` produces the guidance string
- `formatRouteStoneEmit.ts` renders it to stdout via `lines.push(\`   └─ ${input.guidance}\`)`
- terminal output is read by humans and agent drivers

**is the old string part of any contract?**

- not part of return type (return is `{ approved: boolean }`)
- not part of JSON API
- not parsed by any downstream code
- test assertions check for "only humans can approve" (retained) and "please ask a human" (replaced)

**evidence from test:**
```
then('output contains "please ask a human"', async () => {
  expect(result.emit.stdout).toContain('please ask a human');
});
```

this assertion is INTENTIONALLY REPLACED per the blueprint. the wisher requested this change.

**verdict:** no backcompat needed. the wisher explicitly requested to change this message. the old message is not part of any API contract.

---

### break point 2: header string change for blocked action

**the change:**
```
before: HEADER_SET = "🦉 the way speaks for itself"
after:  inline "🦉 patience, friend."
```

**who consumes this output?**

- `formatRouteStoneEmit.ts` renders header to stdout
- terminal output is read by humans and agent drivers

**is the old header part of any contract?**

examined tests:
- no test asserts the specific header for blocked action
- tests assert content presence, not format

examined downstream:
- no code parses the header emoji line
- headers are visual output, not data

**verdict:** no backcompat needed. the header is visual output, not an API. the vision explicitly shows the new header.

---

### break point 3: boot.yml structure change

**the change:**
```yaml
# before: no say section
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...

# after: say section added
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - ...
    say:
      - briefs/howto.drive-routes.[guide].md
```

**is this a break?**

- the `ref:` section is UNCHANGED
- the `say:` section is NEW (additive)
- no removal, no modification of extant entries

**verdict:** no backcompat needed. purely additive. no extant behavior modified.

---

### break point 4: new brief file

**the change:**
```
before: file absent
after:  briefs/howto.drive-routes.[guide].md created
```

**is this a break?**

- new file does not replace any extant file
- new file does not modify any extant file
- file is registered in boot.yml (also new/additive)

**verdict:** no backcompat needed. purely additive.

---

## step 3: were any backcompat shims added unnecessarily?

the blueprint proposes zero backcompat shims.

**is this the right choice?**

yes, because:

1. **all non-additive changes are explicitly requested by wisher**
   - guidance string change: wisher said "clarifies that --as arrived and --as passed is what it should run instead"
   - header change: vision shows "🦉 patience, friend."

2. **no API contracts are broken**
   - function signatures unchanged
   - return types unchanged
   - behavior unchanged (blocked still returns `approved: false`)

3. **output changes are improvements, not breaks**
   - old output was less actionable
   - new output teaches drivers what to do
   - no machine parses these strings

---

## summary

| question | answer |
|----------|--------|
| does blueprint contain backcompat shims? | no |
| were any needed but omitted? | no |
| were any added unnecessarily? | n/a (none present) |

**no unnecessary backwards compatibility found.**

the blueprint correctly omits backcompat shims because:
- changes are either additive or explicitly requested
- no API contracts are broken
- output changes are improvements to human-readable text

---

## the owl reflects 🦉

> backcompat is a chain.
> carry it only when the weight is earned.
>
> here, the wisher asked for change.
> the old words served their time.
> the new words serve better.
>
> no chain needed.
> the path is clear. 🪷

