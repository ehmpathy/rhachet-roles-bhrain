# self-review: behavior-declaration-adherance (r5)

## question

does each implementation correctly follow the spec?

---

## deep review

I read each changed file line by line and verified correctness against the spec.

### getAllStoneArtifacts.ts changes

**change 1: added hasCustomArtifacts variable**

```diff
-  const globs =
-    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0
-      ? input.stone.guard.artifacts
+  const hasCustomArtifacts =
+    input.stone.guard?.artifacts && input.stone.guard.artifacts.length > 0;
+  const globs = hasCustomArtifacts
+    ? input.stone.guard!.artifacts
```

**spec says**: vision line 70-73 describe three changes, but do not prescribe variable extraction.

**adherance**: this is a code clarity improvement. the `!` assertion is safe because `hasCustomArtifacts` guarantees artifacts exist. no deviation from spec.

---

**change 2: default pattern prefix**

```diff
-      : [`${input.stone.name}*.md`];
+      : [`${input.route}/${input.stone.name}*.md`];
```

**spec says**: vision line 73: "prefix default pattern with route path"

**adherance**: correctly adds `${input.route}/` prefix. matches spec exactly.

---

**change 3: $route expansion**

```diff
+    const expandedGlob = glob.replace(/\$route/g, input.route);
```

**spec says**: vision line 71: "expand `$route` to `input.route`"

**adherance**: correct. uses `/\$route/g` regex to replace all instances with `input.route`.

**question**: does `input.route` contain the right value?

I checked the call site in `setStoneAsPassed.ts`:
```ts
const artifacts = await getAllStoneArtifacts({
  stone: input.stone,
  route: input.route, // e.g., ".behavior/v2026_03_24.xyz"
});
```

yes, `input.route` is the actual route path like `.behavior/xyz/`. this matches `vars.route` in reviews/judges.

---

**change 4: cwd to process.cwd()**

```diff
-    const matches = await enumFilesFromGlob({ glob, cwd: input.route });
+    const matches = await enumFilesFromGlob({
+      glob: expandedGlob,
+      cwd: process.cwd(),
+    });
```

**spec says**: vision line 72: "remove `cwd: input.route` — glob runs from repo root"

**adherance**: correct. changed from `cwd: input.route` to `cwd: process.cwd()`. the glob now runs from repo root.

**question**: is `process.cwd()` always repo root?

yes. bhrain is invoked from repo root via `npx rhachet run --skill route.drive`. `process.cwd()` returns where node was invoked.

---

### parseStoneGuard.ts changes

**change: quote strip**

```diff
+      // strip outer quotes (yaml string delimiters)
+      const unquoted = value.replace(/^["'](.*)["']$/, '$1');
+
       if (currentKey === 'artifacts') {
-        result.artifacts?.push(value);
+        result.artifacts?.push(unquoted);
```

**spec says**: the blueprint does not mention this change.

**why this is not a deviation**: the blueprint described changes to `getAllStoneArtifacts.ts`. the `parseStoneGuard.ts` change was discovered in implementation as necessary for the fix to work. YAML patterns like `"$route/..."` keep literal quotes in the simple parser, which would break glob execution.

**adherance**: this is a necessary correction not in the original blueprint. it enables the spec to work correctly. the quote removal is only applied to artifacts (not judges, reviews) because artifacts are glob patterns that should not contain quotes.

---

## found no deviations

| change | spec reference | correct? |
|--------|----------------|----------|
| hasCustomArtifacts extraction | (code clarity) | yes |
| default pattern prefix | vision line 73 | yes |
| $route expansion | vision line 71 | yes |
| cwd: process.cwd() | vision line 72 | yes |
| quote removal in parser | (discovered in impl) | yes |

---

## conclusion

all changes adhere to the spec. the parseStoneGuard.ts change was not in the original blueprint but is necessary for the $route expansion to work with quoted YAML patterns. no deviations from intent.
