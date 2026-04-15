# self-review: behavior-declaration-adherance (r6)

## review question

review for adherance to the behavior declaration. verify implementation correctly matches the spec.

## deeper reflection

before I proceed, let me pause and question my assumptions:

**q: did I truly read the code line by line?**
a: yes. I read stepRouteStoneAdd.ts (102 lines), getContentFromSource.ts (43 lines), isValidStoneName.ts, route.ts (routeStoneAdd function ~70 lines), and the test file (509 lines).

**q: could there be subtle deviations I missed?**
a: let me re-check the most critical path — the template expansion. the wish says "use a template to bootup the stone". the implementation uses `template($behavior/...)` syntax where `$behavior` expands to the route path. this correctly allows templates relative to the route directory.

**q: does the error output match what the wish expects?**
a: the wish says "failfast if none" for bound route. the implementation throws `BadRequestError('route not found')` which results in exit code 2 and clear error message. this matches the failfast expectation.

**q: is the plan/apply pattern correctly implemented?**
a: yes. plan mode (line 61-79) returns preview without disk write. apply mode (line 81-100) writes to disk. both use formatRouteStoneEmit for consistent output.

## articulation

### file-by-file adherance check

#### file: src/domain.roles/driver/skills/route.stone.add.sh

**wish:** "rhx route.stone.add --where --how"

**implementation:** accepts `--stone` (where) and `--from` (how)

**adherance check:**
- `--stone` matches wish intent (where to add)
- `--from` matches wish intent (how to source content)
- follows plan/apply convention like other route.stone.* skills

**verdict:** ✅ adheres to wish

#### file: src/domain.operations/route/stepRouteStoneAdd.ts

**wish requirements verified line by line:**

1. "grant drivers ability to self add stones"
   - line 82: `await fs.writeFile(stonePath, content, 'utf-8');`
   - creates stone file in route directory
   - ✅ correctly implements

2. "use a template to bootup the stone"
   - line 51-55: delegates to `getContentFromSource`
   - template path expansion in getContentFromSource.ts:29
   - ✅ correctly implements

3. "declare contents via stdin"
   - input accepts `stdin: string | null`
   - passed to getContentFromSource
   - ✅ correctly implements

4. "--where must be within current bound route (failfast if none)"
   - line 28-32: validates route exists
   - throws BadRequestError if route not found
   - ✅ correctly implements

5. "match extant conventions"
   - uses `formatRouteStoneEmit` (same as route.stone.set)
   - plan/apply pattern matches extant skills
   - ✅ correctly implements

**verdict:** ✅ adheres to wish

#### file: src/domain.operations/route/stones/getContentFromSource.ts

**wish:** "use a template to bootup the stone" + "declare contents via stdin"

**implementation:**

line 19-24: @stdin handler
```ts
if (input.source === '@stdin') {
  if (!input.stdin || input.stdin.trim() === '') {
    throw new BadRequestError('no content provided via stdin', {});
  }
  return { content: input.stdin };
}
```
- correctly detects @stdin source
- correctly validates stdin is not empty
- ✅ adheres

line 27-38: template handler
```ts
const templateMatch = input.source.match(/^template\((.+)\)$/);
if (templateMatch) {
  const templatePath = templateMatch[1]!.replace(/\$behavior/g, input.route);
  // ... read file
}
```
- correctly parses template($path) syntax
- correctly expands $behavior to route path
- ✅ adheres

line 41: literal handler
- fallback returns source as-is
- ✅ adheres (wish: "--how must be from either @stdin or 'words...'")

**verdict:** ✅ adheres to wish

#### file: src/domain.operations/route/stones/isValidStoneName.ts

**implicit requirement:** stone names follow numeric prefix convention

**implementation:** validates stone has numeric prefix + alpha segment

**verdict:** ✅ adheres to convention

#### file: src/contract/cli/route.ts (routeStoneAdd function)

**wish:** "match extant flags and conventions"

**implementation:**
- `parseArgs(process.argv)` matches other cli functions
- validates required args (`--stone`, `--from`)
- defaults to plan mode
- prints help on `--help`

**verdict:** ✅ adheres to extant conventions

### overall adherance check

| wish statement | adherance |
|----------------|-----------|
| "grant drivers ability to self add stones" | ✅ stepRouteStoneAdd creates stone file |
| "use a template to bootup the stone" | ✅ template($path) syntax works |
| "declare contents via stdin" | ✅ @stdin source works |
| "--where must be within current bound route" | ✅ route validation with failfast |
| "--how must be from either @stdin or 'words...'" | ✅ supports @stdin, template(), literal |
| "match extant flags and conventions" | ✅ verified in has-consistent-conventions |
| "cover with snaps" | ✅ each test case has snapshot |

## deviations found

none. implementation correctly follows the wish.

## final verdict

✅ implementation adheres to behavior declaration

no deviations found. all changed files match the spec.
