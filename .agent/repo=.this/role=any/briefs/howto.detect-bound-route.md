# howto: detect bound route

## .what

use `getRouteBindByBranch` to detect if the current branch is bound to a route.

## .why

- reuse extant domain operation instead of custom logic
- consistent behavior with `route.bind.get` skill
- handles edge cases (multiple binds, no bind)

## .pattern

```ts
import { getRouteBindByBranch } from '@src/domain.operations/route/bind/getRouteBindByBranch';

// returns { route: string } | null
const bind = await getRouteBindByBranch({ branch: null }); // null = current branch

if (bind) {
  // bound to a route
  console.log('route:', bind.route);
} else {
  // not bound
}
```

## .when

- default scope detection (route vs repo)
- any feature that behaves differently when bound to a route
- cli skills that need route context

## .see also

- `rhx route.bind.get` — shell skill equivalent
- `src/domain.operations/route/bind/getRouteBindByBranch.ts` — implementation
