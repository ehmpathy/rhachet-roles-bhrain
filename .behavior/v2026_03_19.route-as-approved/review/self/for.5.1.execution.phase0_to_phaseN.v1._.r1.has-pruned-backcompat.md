# self-review: has-pruned-backcompat

## artifacts reviewed

- setStoneAsApproved.ts (guidance string update)
- formatRouteStoneEmit.ts (blocked action header override)
- howto.drive-routes.[guide].md (new brief)
- boot.yml (say section addition)
- test files (assertion extensions)

## backwards compatibility checklist

### did the wisher explicitly say to maintain any compatibility?

**no.** the wish did not mention backwards compatibility. this is a new feature addition, not a change to extant behavior.

### what backwards compat did we add?

**none.**

- the `--as approved` error message was changed, not extended with a fallback
- no old message format was preserved
- no deprecated parameters were kept
- no legacy paths were maintained

### is there evidence any backwards compat is needed?

**no.**

- the old message was simply "please ask a human to run this command"
- no external systems depend on this exact message format
- no tests rely on the old message text (tests were updated to reflect new guidance)

### did we assume any backwards compat "to be safe"?

**no.**

- did not preserve the old message format alongside the new one
- did not add any feature flags to toggle between old/new behavior
- did not add deprecation warnings
- made a clean cut to the new guidance format

## conclusion

no backwards compatibility concerns were added. the change is a direct replacement with no legacy support, which is appropriate for an internal CLI message improvement.
