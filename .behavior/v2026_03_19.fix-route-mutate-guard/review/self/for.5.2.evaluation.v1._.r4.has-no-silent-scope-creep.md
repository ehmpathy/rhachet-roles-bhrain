# self-review: has-no-silent-scope-creep (r4)

## question

deeper scrutiny: is there undocumented scope?

## issue found

examined git diff for getBlockedChallengeDecision.ts and found TWO changes:

1. **blocker path change** (documented)
2. **failhide fix** (NOT documented)

```diff
-    .catch(() => false);
+    .catch((error: NodeJS.ErrnoException) => {
+      // allow: ENOENT (file not found) is expected when file absent
+      if (error.code === 'ENOENT') return false;
+      throw error;
+    });
```

this failhide fix was added in execution phase when peer-review guard flagged it.

## issue fixed

updated evaluation artifact (5.2.evaluation.v1.i1.md) to document:

### codepath tree update
- added failhide fix to getBlockedChallengeDecision.ts codepath

### divergence table update
- added "failhide fix (getBlockedChallengeDecision)" divergence
- added "failhide fix (test helper)" divergence (route.mutate.guard.integration.test.ts)

### divergence resolution
- both marked as [backup] with rationale: peer-review guard flagged failhide violations; fixes were mandatory

## conclusion

scope creep was found but it was NOT opportunistic:
- both failhide fixes were mandated by peer-review guard
- they represent bug fixes, not feature additions
- now properly documented as divergences

no undocumented scope remains.
