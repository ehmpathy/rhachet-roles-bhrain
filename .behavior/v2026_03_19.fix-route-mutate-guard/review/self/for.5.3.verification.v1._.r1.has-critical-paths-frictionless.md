# self-review: has-critical-paths-frictionless (r1)

## question

are the critical paths frictionless in practice?

## examination

### critical paths for this behavior

since no repros artifact exists, the critical paths are derived from the wish:

1. **bind to route at `.route/xyz/`** → should work without error
2. **write artifact to bound route** → should be allowed
3. **metadata writes to `.route/` subdirectory** → should be blocked with clear guidance

### path 1: bind to .route/xyz route

verified through acceptance tests:
- `rhx route.bind.set --route .route/v2026_03_19.declapract.upgrade/` works
- creates bind flag at `.route/.bind.branch.flag`
- no errors on bind

### path 2: write artifact to bound route

verified through integration tests [case7], [case8]:
- Write tool with `file_path=.route/xyz/artifact.md` exits 0
- guard allows without friction
- no permission prompts beyond expected

### path 3: blocked metadata writes

verified through integration tests [case7], [case8]:
- Write tool with `file_path=.route/xyz/.route/passage.jsonl` exits 2
- guard provides clear guidance: "instead, run rhx route.drive"
- message is helpful, not cryptic

## conclusion

all critical paths verified as frictionless:
- bind works
- artifact writes allowed
- metadata blocked with clear guidance
