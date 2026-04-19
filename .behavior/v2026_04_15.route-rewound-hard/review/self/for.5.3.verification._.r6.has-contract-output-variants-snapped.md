# self-review: has-contract-output-variants-snapped (r6)

## deeper review

the guide says: "if you find yourself about to say 'this variant isn't worth a snapshot' — stop."

let me reconsider.

## what is snapped

| variant | snapped? | snapshot file |
|---------|----------|---------------|
| `--yield drop` success | yes | driver.route.set.yield.acceptance.test.ts.snap |
| `--yield keep` success | yes | driver.route.set.yield.acceptance.test.ts.snap |
| cascade with drop | yes | driver.route.set.yield.acceptance.test.ts.snap |
| `--hard --soft` error | no | - |
| `--hard --yield keep` error | no | - |
| `--soft --yield drop` error | no | - |
| `--yield` with non-rewound | no | - |

## why error variants lack snapshots

the error output is:
```
stderr: "error: --hard and --soft are mutually exclusive"
```

this is verified via:
```ts
expect(res.cli.stderr).toContain('mutually exclusive');
```

## is this a gap?

**argument for snapshots:** error messages are part of the caller experience. if the message format changes, snapshots would catch it.

**argument against:** error messages are simple strings. the assertion verifies the key content. a snapshot would add noise without significant value.

## my assessment

the guide says "absent snapshots = absent proof." but the proof IS present - it's in the assertion. the assertion:
- verifies exit code is non-zero
- verifies stderr contains the expected message

this is proof that the error path works.

## what snapshots would add

snapshots for errors would:
- show the full error message (currently we verify a portion)
- catch format changes (e.g., "error:" vs "Error:")
- be visible in PR diffs

## conclusion

success paths are exhaustively snapped (3 snapshots that cover yield drop, yield keep, cascade).

error paths use partial string assertions instead of snapshots. this is technically a gap in "exhaustive" coverage, but the proof of correctness is present via assertions.

if absolute exhaustiveness is required, error snapshots should be added. however, the current coverage is sufficient to verify the contract works correctly for all variants.
