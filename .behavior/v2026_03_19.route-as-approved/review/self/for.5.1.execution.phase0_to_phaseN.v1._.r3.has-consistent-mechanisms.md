# self-review: has-consistent-mechanisms (round 3)

## the question

did we create new mechanisms that duplicate extant functionality?

## deeper inspection

i re-examined the codebase with specific searches:

### search 1: multi-line guidance strings

```bash
grep -r "join('\\\n')" src/domain.operations/route/
```

**findings:**

the pattern of constructing multi-line strings with `.join('\n')` is used throughout:
- `formatLetsReflect.ts`
- `formatPatienceFriend.ts`
- `formatWhatHaveYouSeen.ts`
- `formatRouteStoneEmit.ts`

our guidance string in `setStoneAsApproved.ts` uses the same pattern.

**verdict:** consistent.

### search 2: tree-format output with box characters

```bash
grep -r "├─\|└─" src/domain.operations/route/
```

**findings:**

the `├─` and `└─` characters are used extensively:
- `formatRouteStoneEmit.ts:` dozens of usages
- `formatLetsReflect.ts:` tree-format reflection prompts
- `formatWalkTheWay.ts:` tree-format guidance

our guidance uses these same characters with consistent indent.

**verdict:** consistent.

### search 3: action-specific conditional branches

```bash
grep -r "input.action === " src/domain.operations/route/formatRouteStoneEmit.ts
```

**findings:**

```typescript
if (input.action === 'challenge:absent')
if (input.action === 'challenge:first' || input.action === 'challenge:rushed')
if (input.action === 'passed' && input.passage === 'allowed')
if (input.action === 'passed' && input.passage === 'blocked')
```

our `if (input.action === 'blocked')` branch follows this exact pattern.

**verdict:** consistent.

### search 4: boot.yml structure

```bash
cat src/domain.roles/driver/boot.yml
```

**findings:**

the file already uses the `always.briefs.ref` structure. the `say` level is documented in rhachet's role system. we added a `say` section parallel to `ref`, which is the intended structure.

**verdict:** consistent.

## why no duplication exists

each component we added reuses extant patterns:

| component | extant pattern | our implementation |
|-----------|----------------|-------------------|
| guidance string | `lines.join('\n')` | same |
| tree format | `├─` / `└─` with 3-space indent | same |
| action branch | `if (input.action === 'X')` | same |
| brief file | `howto.{topic}.[{type}].md` | same |
| boot.yml | `always.briefs.say` | same |

## conclusion

no new mechanisms were introduced. every code change uses extant patterns and conventions from the codebase.
