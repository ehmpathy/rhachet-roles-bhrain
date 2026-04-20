# self-review: has-consistent-mechanisms (r8)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I conducted a deeper search for extant mechanisms:

1. grep for JSON.parse in src/ (found 28+ usages)
2. grep for stdin-related patterns (found goal.ts:474-491 readStdin, goal.ts:1096-1112 goalGuard)
3. grep for extractPrompt/parsePrompt/getPrompt patterns (found 0)
4. read goal.ts lines 474-491 (readStdin) and 1095-1134 (goalGuard)

---

## extant stdin patterns in codebase

### pattern A: readStdin (synchronous, line 474-491)

```ts
const readStdin = (): string => {
  if (process.stdin.isTTY) return '';
  try {
    return execSync('cat', { ... timeout: 100 });
  } catch (error) {
    if (execError.killed) return '';
    throw error;
  }
};
```

**used by:** yaml parse for goal input
**characteristic:** synchronous, returns raw string

### pattern B: goalGuard (async iterator, line 1096-1112)

```ts
const stdinChunks: Buffer[] = [];
for await (const chunk of process.stdin) {
  stdinChunks.push(chunk);
}
const stdinContent = Buffer.concat(stdinChunks).toString('utf-8').trim();
```

**used by:** PreToolUse hook for tool block
**characteristic:** asynchronous, buffers all chunks

---

## blueprint new mechanism: extractPromptFromStdin

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

### does it duplicate extant functionality?

**search 1:** grep for `extractPrompt|parsePrompt|getPrompt.*stdin`
**result:** 0 files found

**search 2:** grep for JSON parse of stdin with `.prompt` field
**result:** 0 matches (found `.prompt` in test expectations and unrelated contexts)

### does it reuse extant mechanisms?

**yes.** it calls `readStdin()` (line 474-491) for stdin access.

### why not use goalGuard's async pattern?

- goalGuard uses async iterator for different use case (PreToolUse)
- blueprint needs synchronous pattern consistent with YAML goal input
- readStdin has timeout protection (100ms)
- hook.onTalk is fire-and-exit, sync is appropriate

---

## blueprint new mechanism: emitOnTalkReminder

### does it duplicate extant functionality?

**search 1:** grep for `emitSubBucket`
**result:** found at goal.ts:46-54, uses console.log (stdout)

**search 2:** look for stderr sub.bucket pattern
**result:** no extant function. inline console.error is the pattern.

### extant stderr output patterns

**goalGuard (lines 1129-1134):**
```ts
console.error(OWL_WISDOM_GUARD);
console.error('');
console.error('🔮 goal.guard');
console.error('   ├─ ✋ blocked: direct access...');
```

**hook.onStop (lines 953-1001):**
```ts
console.error('🦉 to forget an ask is to break a promise. remember.');
console.error('');
console.error('🔮 goal.triage.infer --when hook.onStop');
// ... inline calls
```

**blueprint emitOnTalkReminder:**
```ts
console.error(OWL_WISDOM);
console.error('');
console.error('🔮 goal.triage.infer --from peer --when hook.onTalk');
// ... inline calls
```

### verdict

the blueprint follows the established stderr pattern:
1. owl wisdom constant
2. blank line
3. treestruct command header
4. inline tree branches

no stderr sub.bucket function exists to reuse. inline is the codebase norm.

---

## research disposition compliance

| research disposition | blueprint usage | compliant? |
|---------------------|-----------------|------------|
| readStdin [REUSE] | called by extractPromptFromStdin | yes |
| setAsk [REUSE] | called in hook.onTalk branch | yes |
| OWL_WISDOM [REUSE] | referenced in emitOnTalkReminder | yes |
| getScopeDir [REUSE] | called in hook.onTalk branch | yes |
| emitSubBucket [REUSE] | NOT reused (stdout vs stderr) | justified |

---

## line-by-line verification

### extractPromptFromStdin

| line | mechanism | status |
|------|-----------|--------|
| `const raw = readStdin()` | reuses extant | consistent |
| `JSON.parse(raw)` | standard library | acceptable |
| `json.prompt` | new field access | no extant alternative |
| `return null` | graceful error | consistent with readStdin |

### emitOnTalkReminder

| line | mechanism | status |
|------|-----------|--------|
| `console.error(OWL_WISDOM)` | reuses constant | consistent |
| `console.error('')` | blank line | consistent with goalGuard |
| `console.error('🔮 ...')` | treestruct header | consistent with hook.onStop |
| `for (const line of content.split('\n'))` | inline loop | consistent with emitSubBucket pattern |

---

## no duplicates confirmed

**extractPromptFromStdin:**
- grep found 0 extant prompt extraction functions
- composes readStdin (extant) + JSON parse (standard) + field extract (new)

**emitOnTalkReminder:**
- grep found 0 stderr sub.bucket functions
- follows same inline pattern as goalGuard and hook.onStop

---

## reflection

I conducted exhaustive searches for extant mechanisms:
- JSON.parse usages (28+, none for stdin prompt extraction)
- stdin patterns (2 found, blueprint reuses appropriate one)
- prompt extraction (0 found)
- stderr treestruct (inline is the pattern)

the blueprint reuses all applicable extant mechanisms and only adds what doesn't exist. no duplicates.

**why this holds:**

1. `extractPromptFromStdin` composes extant `readStdin` with standard JSON.parse. no extant function parses Claude Code's UserPromptSubmit stdin format because this is the first feature to need it.

2. `emitOnTalkReminder` follows the established inline console.error pattern used by goalGuard and hook.onStop. no stderr sub.bucket function exists because the codebase uses stdout for normal output and inline stderr for hooks.

3. all research [REUSE] dispositions are honored: readStdin, setAsk, OWL_WISDOM, getScopeDir.

4. emitSubBucket [REUSE] is correctly not reused because it outputs to stdout, not stderr.

