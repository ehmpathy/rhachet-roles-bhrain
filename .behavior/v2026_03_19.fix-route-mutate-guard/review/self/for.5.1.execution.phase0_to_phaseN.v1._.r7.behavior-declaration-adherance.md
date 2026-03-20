# review.self: behavior-declaration-adherance (r7)

## what was reviewed

seventh pass. read each changed file slowly, questioned every assumption.

## deep dive: route.mutate.guard.sh

opened the file and read lines 130-170.

### bash tool check (lines 131-147)

the guard extracts command from stdin JSON, then checks patterns.

**original logic**: `if echo "$COMMAND" | grep -qE "\.route/"; then`

this blocked ANY command with `.route/` in it, even if the path was the bound route itself.

**fixed logic**: check if the path starts with `${ROUTE_DIR}/.route/`

this allows commands that touch the route directory, but blocks commands that touch the `.route/` metadata subdirectory within it.

**adherance**: matches vision requirement.

### file tool check (lines 161-163)

**original logic**: `elif echo "$FILE_PATH" | grep -qE "\.route/"; then`

**fixed logic**: `elif echo "$FILE_PATH" | grep -qE "^${ROUTE_DIR}/\.route/"; then`

**adherance**: matches vision requirement.

## deep dive: blocker path files

### getBlockedChallengeDecision.ts

read the file. the `articulationPath` is constructed as:
```typescript
path.join(input.route, 'blocker', `${input.stone}.md`)
```

this places blockers at `$route/blocker/`, visible alongside artifacts.

**adherance**: matches vision requirement for visible blockers.

### stepRouteDrive.ts

similar path construction:
```typescript
const articulationPath = `${input.route}/blocker/${input.stone}.md`;
```

**adherance**: consistent with getBlockedChallengeDecision.ts.

## conclusion

all files adhere to the behavior declaration. no deviations found.
