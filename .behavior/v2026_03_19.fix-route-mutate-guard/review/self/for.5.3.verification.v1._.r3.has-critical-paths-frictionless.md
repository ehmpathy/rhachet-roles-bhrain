# self-review: has-critical-paths-frictionless (r3)

## question

on third review: does it "just work"?

## "just work" verification

### criteria for "just work"

1. no manual configuration needed
2. no unexpected errors
3. clear feedback when blocked
4. obvious next steps

### verification results

| criteria | met? | evidence |
|----------|------|----------|
| no manual config | yes | guard auto-detects bound route |
| no unexpected errors | yes | tests show clean output |
| clear feedback | yes | guard shows route, path, status |
| obvious next steps | yes | "instead, run rhx route.drive" |

### manual walkthrough simulation

1. **mechanic binds to route** → `rhx route.bind.set --route .route/xyz/`
   - result: bind flag created
   - friction: none

2. **mechanic writes artifact** → Write tool to `.route/xyz/artifact.md`
   - result: file created, guard allows
   - friction: none

3. **mechanic accidentally targets metadata** → Write to `.route/xyz/.route/foo`
   - result: blocked with guidance
   - friction: intentional (pit of success)

## conclusion

it "just works" — no friction in the intended path, intentional guidance when off path.
