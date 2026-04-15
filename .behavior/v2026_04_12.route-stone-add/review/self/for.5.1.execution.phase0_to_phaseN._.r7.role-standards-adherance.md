# self-review: role-standards-adherance (r7)

## review question

review for adherance to mechanic role standards. verify code follows all required patterns.

## deeper reflection

**q: have I actually checked against the briefs, or just assumed compliance?**
a: I enumerated the relevant briefs directories and checked each file against each pattern. let me verify I have not missed any important rules.

**q: are there any rules I might have overlooked?**
a: let me check for domain-operation specific rules...
- rule.require.get-set-gen-verbs — stepRouteStoneAdd uses `step` prefix which is the orchestrator convention (not get/set/gen which is for leaf operations). this is correct because it orchestrates multiple leaf operations.
- rule.forbid.io-as-domain-objects — no domain objects are used for io. inputs are inline types. ✅
- rule.require.arrow-only — all functions use arrow syntax. no `function` keyword. ✅
- rule.require.sync-filename-opname — file name matches operation name (stepRouteStoneAdd.ts exports stepRouteStoneAdd). ✅

**q: did I check the test file patterns thoroughly?**
a: yes. the test uses given/when/then from test-fns, useThen for shared results, and follows BDD patterns with [caseN] and [tN] labels.

## briefs directories enumerated

relevant rule categories from `.agent/repo=ehmpathy/role=mechanic/briefs/practices/`:

1. `code.prod/evolvable.procedures/` — procedure patterns
2. `code.prod/pitofsuccess.errors/` — error patterns
3. `code.prod/readable.comments/` — comment patterns
4. `code.prod/readable.narrative/` — code narrative patterns
5. `code.test/` — test patterns

## file-by-file standards check

### file: stepRouteStoneAdd.ts

#### rule.require.input-context-pattern ✅
```ts
export const stepRouteStoneAdd = async (input: {
  stone: string;
  source: string;
  stdin: string | null;
  route: string;
  mode: 'plan' | 'apply';
}): Promise<{...}> => {
```
- uses `input` as first argument
- no context needed (no dependencies injected)
- follows (input, context?) pattern

#### rule.require.what-why-headers ✅
```ts
/**
 * .what = orchestrates stone creation in a route
 * .why = enables drivers to add stones on the fly
 */
```
- has `.what` and `.why` jsdoc

#### rule.require.narrative-flow ✅
- code paragraphs separated by blank lines
- early returns for validation
- no else branches
- linear flow

#### rule.require.failfast ✅
```ts
if (!validation.valid) {
  throw new BadRequestError(validation.reason!, {});
}
```
- uses BadRequestError for constraint errors
- fails fast on invalid input

### file: getContentFromSource.ts

#### rule.require.what-why-headers ✅
```ts
/**
 * .what = extracts content from source specifier
 * .why = enables flexible content sources (stdin, template, literal)
 */
```

#### rule.require.input-context-pattern ✅
```ts
export const getContentFromSource = async (input: {
  source: string;
  stdin: string | null;
  route: string;
}): Promise<{ content: string }> => {
```

#### rule.require.narrative-flow ✅
- three clear branches: @stdin, template, literal
- early returns
- no else branches

#### rule.require.failfast ✅
- throws BadRequestError for empty stdin
- throws BadRequestError for template not found

### file: isValidStoneName.ts

#### rule.require.what-why-headers ✅
```ts
/**
 * .what = validates stone name format
 * .why = ensures consistent stone names across routes (numeric prefix + alpha segment)
 */
```
- has `.what` and `.why` jsdoc

#### rule.require.input-context-pattern ✅
```ts
export const isValidStoneName = (input: {
  name: string;
}): { valid: boolean; reason: string | null } => {
```
- uses `input` as first argument
- pure function, no context needed

#### rule.require.narrative-flow ✅
- early returns for invalid cases
- no else branches
- linear validation flow

### file: route.ts (routeStoneAdd)

#### rule.forbid.else-branches ✅
- uses early returns for validation
- no else branches

#### rule.require.stderr-for-errors ✅
```ts
console.error('error: --stone is required');
process.exit(2);
```
- errors go to stderr
- uses exit code 2 for constraint errors

### file: blackbox test

#### rule.require.given-when-then ✅
- uses `given`, `when`, `then` from test-fns
- follows BDD pattern

#### rule.require.useThen-for-shared-results ✅
```ts
const res = useThen('invoke add skill', async () => {
  ...
  return { cli, tempDir, stoneExists };
});
```

## standards adherance summary

| file | pattern | status |
|------|---------|--------|
| stepRouteStoneAdd.ts | input-context | ✅ |
| stepRouteStoneAdd.ts | what-why-headers | ✅ |
| stepRouteStoneAdd.ts | narrative-flow | ✅ |
| stepRouteStoneAdd.ts | failfast | ✅ |
| getContentFromSource.ts | input-context | ✅ |
| getContentFromSource.ts | what-why-headers | ✅ |
| getContentFromSource.ts | narrative-flow | ✅ |
| getContentFromSource.ts | failfast | ✅ |
| isValidStoneName.ts | input-context | ✅ |
| isValidStoneName.ts | what-why-headers | ✅ |
| isValidStoneName.ts | narrative-flow | ✅ |
| route.ts (add) | stderr-for-errors | ✅ |
| route.ts (add) | forbid-else | ✅ |
| acceptance test | given-when-then | ✅ |
| acceptance test | useThen | ✅ |

## violations found

none.

## final verdict

✅ all mechanic role standards are followed

no violations found. all changed files adhere to required patterns.
