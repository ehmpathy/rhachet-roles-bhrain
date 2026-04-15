# self-review: behavior-declaration-coverage (r5)

## review question

review for coverage of the behavior declaration. verify each requirement from the wish is addressed in the code and tests.

## articulation

### wish requirements mapped to implementation

| # | wish requirement | implementation | test coverage |
|---|------------------|----------------|---------------|
| 1 | grant drivers ability to self add stones | `stepRouteStoneAdd.ts` + `route.stone.add.sh` | case1, case2 |
| 2 | use a template to bootup the stone | `getContentFromSource.ts` handles `template($path)` | case5 |
| 3 | declare contents via stdin | `getContentFromSource.ts` handles `@stdin` | case6 |
| 4 | --where must be within bound route (failfast if none) | `stepRouteStoneAdd.ts` validates route exists | case10 |
| 5 | --how must be from @stdin or 'words...' | `--from` flag accepts @stdin, template(), or literal | case1, case5, case6 |
| 6 | match extant flags and conventions | verified in has-consistent-conventions review | all cases |
| 7 | cover with snaps | `toMatchSnapshot()` in each test case | all cases |

### detailed verification with line-by-line code references

#### requirement 1: grant drivers ability to self add stones

**code:** `src/domain.operations/route/stepRouteStoneAdd.ts`

line 14-26: orchestrator signature accepts:
- `stone: string` — the stone name
- `source: string` — content source specifier
- `stdin: string | null` — piped content if @stdin
- `route: string` — route directory
- `mode: 'plan' | 'apply'` — execution mode

line 28-32: validates route exists via `fs.access`
line 35-38: validates stone name via `isValidStoneName`
line 41-48: collision detection via `getAllStones`
line 51-55: content resolution via `getContentFromSource`
line 61-79: plan mode returns preview without disk write
line 82: apply mode writes file via `fs.writeFile`

**test:** case1 (plan mode) + case2 (apply mode) verify end-to-end

**verdict:** ✅ covered

#### requirement 2: use a template to bootup the stone

**code:** `src/domain.operations/route/stones/getContentFromSource.ts`

line 27: `const templateMatch = input.source.match(/^template\((.+)\)$/);`
line 29: `templatePath = templateMatch[1]!.replace(/\$behavior/g, input.route);`
line 31: `const content = await fs.readFile(templatePath, 'utf-8');`

**test:** case5 verifies template source:
- uses `template($behavior/refs/template.research.adhoc.stone)`
- verifies `res.stoneContent.toContain('research: adhoc')`
- template file located in `blackbox/.test/assets/route-driver/refs/`

**verdict:** ✅ covered

#### requirement 3: declare contents via stdin

**code:** `src/domain.operations/route/stones/getContentFromSource.ts`

line 19: `if (input.source === '@stdin')`
line 20: validates stdin not empty
line 23: `return { content: input.stdin };`

**test:** case6 verifies stdin source:
- passes `stdin: stdinContent` to `invokeRouteSkill`
- verifies `res.stoneContent.toContain('research: api integration')`

case7 verifies empty stdin error:
- passes `stdin: ''`
- verifies `res.cli.stderr.toContain('no content provided via stdin')`

**verdict:** ✅ covered

#### requirement 4: --where must be within bound route

**code:** `src/domain.operations/route/stepRouteStoneAdd.ts`

line 28-32:
```ts
try {
  await fs.access(input.route);
} catch {
  throw new BadRequestError('route not found', { route: input.route });
}
```

**test:** case10 verifies route not found error:
- passes `route: './nonexistent'`
- verifies `res.cli.stderr.toContain('route not found')`

**note:** the wish says "within current bound route" but implementation accepts explicit `--route` flag. when invoked via shell skill without `--route`, the cli layer detects bound route (via `getRouteBindByBranch`). this is consistent with other route.stone.* skills.

**verdict:** ✅ covered

#### requirement 5: --how must be from @stdin or 'words...'

**code:** `src/domain.operations/route/stones/getContentFromSource.ts`

line 19-24: handles `@stdin`
line 27-38: handles `template($path)`
line 41: handles literal text (fallback)

**test:**
- case6: `@stdin` with multiline content
- case5: `template($behavior/refs/template.research.adhoc.stone)`
- case1, case2: `'custom research content'` literal

**verdict:** ✅ covered

#### requirement 6: match extant conventions

verified in `r4.has-consistent-conventions.md`:
- skill name: `route.stone.add.sh` follows `route.stone.<verb>.sh`
- flags: `--stone`, `--from`, `--mode` match extant patterns
- output: uses `formatRouteStoneEmit` (same as route.stone.set)
- shell entrypoint: same structure as route.stone.get/set/del

**verdict:** ✅ covered (see prior review)

#### requirement 7: cover with snaps

**test:** each acceptance test case includes snapshot:

case1:67 `expect(res.cli.stdout).toMatchSnapshot();`
case2:134-135 `expect(res.cli.stdout).toMatchSnapshot();`
case5:265-266 `expect(res.cli.stdout).toMatchSnapshot();`
case6:339-340 `expect(res.cli.stdout).toMatchSnapshot();`

**snapshot file:** `blackbox/__snapshots__/driver.route.stone.add.acceptance.test.ts.snap`

**verdict:** ✅ covered

### edge case coverage

| case | scenario | code line | test |
|------|----------|-----------|------|
| case3 | collision | stepRouteStoneAdd.ts:43-48 | verifies 'stone already exists' error |
| case4 | invalid name | stepRouteStoneAdd.ts:35-38 | verifies 'numeric prefix' error |
| case7 | empty stdin | getContentFromSource.ts:20-22 | verifies 'no content' error |
| case8 | template 404 | getContentFromSource.ts:34-36 | verifies 'template file not found' |
| case9 | no args | route.ts:798-808 | verifies '--stone is required', '--from is required' |

## final verdict

✅ all wish requirements are covered by implementation and tests

no gaps found. each requirement has matched code (with line numbers) and test coverage.
