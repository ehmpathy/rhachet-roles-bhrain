# self-review: has-questioned-assumptions (round 2)

## deep examination of technical assumptions

---

## assumption.1: multi-line guidance string in tree format

**what we assume without evidence:**
we assume `lines.push(`   └─ ${input.guidance}`)` will correctly render a multi-line guidance string with proper tree alignment.

**what if the opposite were true?**
if the formatter does NOT handle multi-line strings correctly, each line after the first would appear without the proper indentation:
```
   └─ as a driver, you should:
├─ `--as passed` = ...    <-- BROKEN: no leading spaces
```

**evidence gathered:**
from `3.1.3.research.internal.product.code.prod._.v1.i1.md`:
```typescript
if (input.action === 'blocked') {
  lines.push(`🗿 ${input.operation}`);
  lines.push(`   ├─ stone = ${input.stone}`);
  lines.push(`   ├─ ✗ ${input.reason}`);
  lines.push(`   └─ ${input.guidance}`);
  return lines.join('\n');
}
```

the `\n` join means each line in guidance will be on its own line. the first line gets `   └─ ` prefix, but subsequent lines get no prefix.

**simpler approach:**
pre-format the guidance string with internal newlines and proper indentation. the caller (setStoneAsApproved.ts) is responsible for the internal tree structure:

```typescript
guidance: `as a driver, you should:
      ├─ \`--as passed\` = signal work complete, proceed
      ├─ \`--as arrived\` = signal work complete, request review
      └─ \`--as blocked\` = escalate if stuck

   the human will run \`--as approved\` when ready.`
```

**verdict:** assumption VALID with this approach. no formatter change needed beyond header.

---

## assumption.2: header override scope

**what we assume without evidence:**
the blocked action header should be "🦉 patience, friend." to match the vision.

**what if the opposite were true?**
other parts of the codebase might use different headers for blocked states. inconsistency could confuse users.

**evidence gathered:**
from `3.1.3.research.internal.product.code.prod._.v1.i1.md`:
```typescript
const HEADER_GET = '🦉 and then?';
const HEADER_SET = `🦉 the way speaks for itself`;
const HEADER_DEL = `🦉 hoo needs 'em`;
```

currently blocked uses `HEADER_SET`. the vision explicitly shows "🦉 patience, friend." which aligns with the guidance tone (wait for human).

**exceptions or counterexamples:**
the `challenge:*` actions use `formatPatienceFriend` which might also use a patience-related header. consistency is important.

**verdict:** assumption VALID. "patience, friend" fits blocked guidance better than "the way speaks for itself" (which implies success).

---

## assumption.3: boot.yml `say` level works

**what we assume without evidence:**
a `say:` section in boot.yml will load briefs when relevant context is present.

**architecture choice: evidence or habit?**
the wish explicitly states "lets create a say level boot.yml brief". this is a wisher requirement, not an assumption.

**evidence gathered:**
from `3.1.3.research.internal.product.code.prod._.v1.i1.md`:
```yaml
always:
  briefs:
    ref:
      - briefs/im_a.bhrain_owl.md
      - briefs/define.routes-are-gardened.[philosophy].md
      - briefs/research.importance-of-focus.[philosophy].md
      - briefs/howto.create-routes.[ref].md
```

extant structure uses `ref:` level. the wish asks for `say:` level which is a different load behavior.

**counterexample:**
if `say:` is not implemented or breaks, the brief won't load. but this is a wisher requirement — implementation must support it.

**verdict:** assumption VALID. this is a requirement, not an assumption to question.

---

## assumption.4: test extension vs new cases

**what we assume without evidence:**
extant test cases for blocked action can be extended with new assertions.

**simpler approach check:**
could we skip tests entirely? NO — the vision defines specific output format that must be verified.

could we add fewer assertions? NO — each alternative (`--as passed`, `--as arrived`, `--as blocked`) must be present.

**evidence gathered:**
from `3.1.3.research.internal.product.code.test._.v1.i1.md`:
```typescript
given('[case3] caller is not human', () => {
  when('[t0] isTTY is false', () => {
    then('approval fails with clear message', async () => { ... });
    then('output contains "only humans can approve"', async () => { ... });
    then('output contains "please ask a human"', async () => { ... });
  });
});
```

the extant test already has the right structure. we extend assertions in this case rather than create a parallel one.

**verdict:** assumption VALID. extension is simpler than duplication.

---

## summary

| assumption | questioned | verdict |
|------------|------------|---------|
| multi-line guidance renders | yes — caller pre-formats | valid |
| header override scope | yes — fits guidance tone | valid |
| say level works | yes — wisher requirement | valid |
| test extension | yes — simpler than duplication | valid |

all assumptions examined. none require blueprint changes. implementation can proceed.

