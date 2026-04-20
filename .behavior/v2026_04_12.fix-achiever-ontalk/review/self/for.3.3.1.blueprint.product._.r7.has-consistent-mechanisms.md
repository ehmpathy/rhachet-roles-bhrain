# self-review: has-consistent-mechanisms (r7)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read:
1. the research file (3.1.3.research.internal.product.code.prod._.yield.md)
2. the blueprint new functions section
3. grep for extant mechanisms in src/

for each new mechanism, I asked:
- does the codebase already have a mechanism that does this?
- do we duplicate extant utilities?
- could we reuse an extant component?

---

## new mechanisms in blueprint

the blueprint introduces two new functions:
1. `extractPromptFromStdin`
2. `emitOnTalkReminder`

---

## analysis: extractPromptFromStdin

### what it does

```ts
const extractPromptFromStdin = (): string | null => {
  const raw = readStdin();
  if (!raw.trim()) return null;
  try {
    const json = JSON.parse(raw);
    const prompt = json.prompt;
    if (typeof prompt !== 'string' || !prompt.trim()) return null;
    return prompt;
  } catch {
    return null;
  }
};
```

### extant mechanisms searched

| mechanism | location | does it do this? |
|-----------|----------|------------------|
| `readStdin` | goal.ts:474-491 | reads raw stdin, returns string |
| JSON parse utilities | searched src/ | none found for this shape |
| prompt extractors | searched src/ | none found |

### verdict

`extractPromptFromStdin` composes `readStdin` (extant) with new JSON parse logic. the JSON parse is specific to Claude Code's UserPromptSubmit format. no extant mechanism handles this shape.

**consistent:** reuses `readStdin`, adds new logic for new format.

---

## analysis: emitOnTalkReminder

### what it does

```ts
const emitOnTalkReminder = (content: string): void => {
  console.error(OWL_WISDOM);
  console.error('');
  console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
  console.error('   ├─ from = peer:human');
  console.error('   ├─ ask');
  console.error('   │  ├─');
  console.error('   │  │  ');
  for (const line of content.split('\n')) {
    console.error(`   │  │    ${line}`);
  }
  console.error('   │  │  ');
  console.error('   │  └─');
  console.error('   │');
  console.error('   └─ consider: does this impact your goals?');
  console.error('      ├─ if yes, triage before you proceed');
  console.error('      └─ run `rhx goal.triage.infer`');
};
```

### extant mechanisms searched

| mechanism | location | does it do this? |
|-----------|----------|------------------|
| `OWL_WISDOM` | goal.ts:30 | owl header constant |
| `emitOwlHeader` | goal.ts:32-35 | emits owl to stdout |
| `emitSubBucket` | goal.ts:46-54 | emits sub.bucket to stdout |
| hook.onStop output | goal.ts:953-1001 | inline console.error |

### key finding: stdout vs stderr

- `emitOwlHeader` uses `console.log` (stdout)
- `emitSubBucket` uses `console.log` (stdout)
- hook.onStop uses `console.error` (stderr) with inline calls

the blueprint needs stderr output. there is no extant `emitOwlHeaderStderr` or `emitSubBucketStderr`.

### pattern consistency check

hook.onStop uses inline console.error calls:
```ts
console.error('🦉 to forget an ask is to break a promise. remember.');
console.error('');
console.error('🔮 goal.triage.infer --when hook.onStop');
// ... more inline calls
```

the blueprint follows the same pattern for hook.onTalk:
```ts
console.error(OWL_WISDOM);
console.error('');
console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
// ... more inline calls
```

**verdict:** consistent with hook.onStop pattern. no stderr functions exist to reuse.

---

## research disposition verification

the research marked these dispositions:

| pattern | disposition | blueprint usage |
|---------|-------------|-----------------|
| `readStdin` | [REUSE] | reused in `extractPromptFromStdin` |
| `setAsk` | [REUSE] | called in hook.onTalk branch |
| `OWL_WISDOM` | [REUSE] | referenced in `emitOnTalkReminder` |
| `getScopeDir` | [REUSE] | called in hook.onTalk branch |
| `emitSubBucket` | [REUSE] | NOT reused — different channel |

### why emitSubBucket is not reused

- extant `emitSubBucket` outputs to stdout
- hook.onTalk needs stderr output
- no stderr variant exists
- consistent with hook.onStop which inlines stderr calls
- r3 review pruned separate `emitSubBucketStderr` as YAGNI

**verdict:** correct to inline. not a duplicate — different output channel.

---

## no duplicates found

both new functions either:
- compose extant mechanisms with new logic (`extractPromptFromStdin`)
- follow extant patterns for the same context (`emitOnTalkReminder`)

no extant functionality is duplicated.

---

## reflection

the blueprint reuses all applicable extant mechanisms:
- `readStdin` for stdin access
- `OWL_WISDOM` for owl header
- `setAsk` for ask accumulation
- `getScopeDir` for scope directory

the new functions add only what doesn't exist:
- JSON parse for Claude Code format
- stderr output for hook reminder

this is consistent with the codebase patterns. no duplicates.

