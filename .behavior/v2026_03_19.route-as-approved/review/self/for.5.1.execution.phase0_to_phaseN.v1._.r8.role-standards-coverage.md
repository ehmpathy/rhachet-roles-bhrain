# self-review: role-standards-coverage (round 8)

## the question

are all relevant mechanic role standards applied where they should be? did the junior forget to add error handlers, validation, tests, types, or other required practices?

## method

i enumerated each briefs/ subdirectory relevant to this code. then i walked through each changed file line by line with fresh eyes, as if for the first time.

---

## step 1: enumerate rule directories

### relevant directories

| directory | relevance |
|-----------|-----------|
| `practices/code.prod/readable.comments/` | changed files need .what/.why headers |
| `practices/code.prod/readable.narrative/` | code flow structure |
| `practices/code.prod/evolvable.procedures/` | (input, context) pattern |
| `practices/code.prod/pitofsuccess.errors/` | fail-fast, error context |
| `practices/code.prod/pitofsuccess.typedefs/` | type safety |
| `practices/lang.terms/` | noun_adj order, gerund avoidance |
| `practices/lang.tones/` | owl persona, lowercase |
| `practices/code.test/frames.behavior/` | given/when/then structure |

### directories confirmed absent

| directory | why absent |
|-----------|-----------|
| `practices/code.prod/evolvable.domain.objects/` | no domain object declarations changed |
| `practices/code.prod/evolvable.repo.structure/` | no file structure changes |
| `practices/work.flow/release/` | no release workflow changes |

---

## step 2: walk each changed file

### file 1: setStoneAsApproved.ts

**line 9-12 — readable.comments:**

```typescript
/**
 * .what = marks a stone as approved by human
 * .why = enables human approval gates for milestones
 */
```

✓ applied. has .what and .why. both are concise. explains purpose.

**line 13-21 — evolvable.procedures:**

```typescript
export const setStoneAsApproved = async (
  input: {
    stone: string;
    route: string;
  },
  context: {
    isTTY: boolean;
  },
): Promise<{
```

✓ applied. (input, context) pattern. inline types. arrow function. no function keyword.

**line 29-33 — pitofsuccess.errors:**

```typescript
const stoneMatched = stonesOnRoute.find((s) => s.name === input.stone);
if (!stoneMatched) {
  throw new BadRequestError('stone not found', { stone: input.stone });
}
```

✓ applied. early exit. BadRequestError with metadata. fail-fast pattern.

**line 35-37 — pitofsuccess.errors (second check):**

```typescript
const isHuman = context.isTTY;
if (!isHuman) {
  return {
```

✓ applied. early return on invalid state. no else branch.

**line 46-53 — guidance content:**

```typescript
guidance: [
  'as a driver, you should:',
  '   ├─ `--as passed` = signal work complete, proceed',
  '   ├─ `--as arrived` = signal work complete, request review',
  '   └─ `--as blocked` = escalate if stuck',
  '',
  'the human will run `--as approved` when ready.',
].join('\n'),
```

✓ applied. lowercase prose. clear instructions. no gerunds.

**potential gap check — absent validation?**

question: should there be validation that `input.route` exists?

answer: no gap. the caller (`setStoneStatus`) validates route existence before this function is called. this function's concern is approval, not route validation.

**potential gap check — absent tests?**

question: are there tests for this function?

answer: yes. `setStoneAsApproved.test.ts` exists and covers the isTTY false case. extended assertions added for guidance content.

---

### file 2: formatRouteStoneEmit.ts

**line 287-299 — blocked branch:**

```typescript
if (input.action === 'blocked') {
  lines.push('🦉 patience, friend.');
  lines.push('');
  lines.push(`🗿 ${input.operation}`);
  lines.push(`   ├─ stone = ${input.stone}`);
  lines.push(`   ├─ ✗ ${input.reason}`);
  lines.push(`   │`);
  const guidanceLines = input.guidance.split('\n');
  guidanceLines.forEach((line, i) => {
    const prefix = i === 0 ? '   └─ ' : '      ';
    lines.push(`${prefix}${line}`);
  });
  return lines.join('\n');
}
```

**readable.narrative check:**

✓ applied. early return pattern. no else after the if block.

**lang.tones check:**

✓ applied. owl header "🦉 patience, friend." lowercase. emoji used appropriately.

**pitofsuccess.typedefs check:**

question: is `input.guidance` typed properly?

answer: yes. `RouteStoneEmitInput` has `guidance?: string`. the blocked branch only executes when guidance is present (caller responsibility). safe.

**potential gap check — absent test?**

question: is there a test for the blocked action format?

answer: this is tested via integration (setStoneAsApproved.test.ts). no separate unit test for formatRouteStoneEmit blocked branch.

is this a gap? no. the integration test proves the output format works end-to-end. a unit test would duplicate assertions without unique value.

---

### file 3: howto.drive-routes.[guide].md

**lang.tones check:**

the brief has:
- lowercase prose throughout
- owl emoji (🦉, 🌙, 🪷)
- "patience, friend" phrase
- blockquote wisdom section

✓ applied. matches owl persona from `im_a.bhrain_owl.md`.

**lang.terms check:**

scanned for gerunds:
- "accumulated" (line ~18) — past participle used as adjective, not gerund
- no -ing nouns found

✓ applied. no gerund violations.

**content check:**

| vision requirement | present? |
|--------------------|----------|
| what a route is | ✓ line 12-18 "paved path" |
| rhx route.drive when lost | ✓ line 26 |
| --as passed/arrived/blocked table | ✓ lines 30-34 |
| self-review respect | ✓ line 40 |
| peer-review respect | ✓ line 42 |
| only humans approve | ✓ line 46 |
| owl wisdom section | ✓ lines 50-58 |

✓ applied. all vision requirements present.

---

### file 4: boot.yml

**structure check:**

```yaml
always:
  briefs:
    ref:
      - ...
    say:
      - briefs/howto.drive-routes.[guide].md
```

✓ applied. follows extant structure. `say` parallel to `ref`.

---

## step 3: transverse checks

### error handler patterns

question: are all error paths handled with proper error types?

| location | error type | context provided? |
|----------|-----------|-------------------|
| setStoneAsApproved:32 | BadRequestError | ✓ `{ stone: input.stone }` |
| setStoneAsApproved:37-57 | return with guidance | ✓ full guidance string |

✓ no absent error handlers.

### validation patterns

question: are all inputs validated before use?

| function | input | validation |
|----------|-------|------------|
| setStoneAsApproved | input.stone | ✓ existence check via find() |
| setStoneAsApproved | context.isTTY | ✓ boolean check |

✓ no absent validation.

### test patterns

question: are all new behaviors tested?

| behavior | test location | covered? |
|----------|---------------|----------|
| guidance includes --as passed | setStoneAsApproved.test.ts | ✓ extended assertions |
| guidance includes --as arrived | setStoneAsApproved.test.ts | ✓ extended assertions |
| guidance includes --as blocked | setStoneAsApproved.test.ts | ✓ extended assertions |
| blocked format works | integration test | ✓ via setStoneAsApproved.test.ts |
| brief loaded at boot | getDriverRole.test.ts | ✓ enforces all briefs declared |

✓ no absent tests.

### type patterns

question: are all types explicit and safe?

| location | type | explicit? |
|----------|------|-----------|
| setStoneAsApproved input | inline object type | ✓ |
| setStoneAsApproved context | inline object type | ✓ |
| setStoneAsApproved return | Promise<{ approved: boolean; emit?: ... }> | ✓ |
| guidance string | string | ✓ |

✓ no absent types. no `any` or implicit types.

---

## gaps found

none.

---

## gaps not found — articulation

### why readable.comments holds

the .what/.why header pattern is present on setStoneAsApproved. the function's purpose is clear from the header. the .why explains the business reason. no additional comments needed for this scope.

### why readable.narrative holds

both changed code files use early return. no else branches. code flows top to bottom. each block is self-contained.

### why pitofsuccess.errors holds

the error path uses BadRequestError with metadata. the blocked return path provides full guidance. no errors are swallowed or silenced.

### why evolvable.procedures holds

(input, context) pattern used. arrow function syntax. inline types. no function keyword. no positional arguments.

### why lang.tones holds

owl persona applied consistently. lowercase prose. emojis used with purpose. "patience, friend" phrase present in both output and documentation.

### why tests hold

integration test covers the end-to-end flow. a unit test would duplicate assertions. boot.yml test ensures brief is declared.

### why types hold

all inputs and outputs have explicit types. no `any`. no type assertions. shape fits naturally.

---

## conclusion

all applicable mechanic role standards are applied. no gaps found.

walked through:
- 4 changed files
- 8 rule directories
- 6 transverse patterns (errors, validation, tests, types, comments, narrative)

the junior did not forget any required practices. the code is ready.

