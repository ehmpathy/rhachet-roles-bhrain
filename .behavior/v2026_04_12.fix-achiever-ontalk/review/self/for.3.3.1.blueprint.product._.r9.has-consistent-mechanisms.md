# self-review: has-consistent-mechanisms (r9)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

I re-read the blueprint and verified each new mechanism against the codebase:

1. listed all new mechanisms in blueprint
2. for each: searched codebase for related patterns
3. for each: verified no duplication exists
4. for each: verified reuse of extant components where applicable

---

## new mechanisms in blueprint

### 1. extractPromptFromStdin (blueprint lines 82-102)

**what it does:**
- reads stdin via `readStdin()`
- parses JSON
- extracts `.prompt` field
- returns string or null

**search for duplicates:**

| search query | results | conclusion |
|--------------|---------|------------|
| `extractPrompt` | 0 files | no extant |
| `parsePrompt` | 0 files | no extant |
| `stdin.*prompt` | 0 files | no extant |
| `JSON.parse.*stdin` | 0 matches | no extant pattern |

**reuse of extant components:**

| component | source | status |
|-----------|--------|--------|
| `readStdin()` | goal.ts:474-491 | reused |
| `JSON.parse` | standard library | appropriate |

**verdict:** no duplicate. correctly reuses extant `readStdin()`.

---

### 2. emitOnTalkReminder (blueprint lines 104-129)

**what it does:**
- emits owl wisdom header
- emits treestruct output to stderr
- shows sub.bucket with message content
- shows consider prompt and triage command

**search for duplicates:**

| search query | results | conclusion |
|--------------|---------|------------|
| `emitOnTalk` | 0 files | no extant |
| `emitReminder` | 0 files | no extant |
| `sub.bucket.*stderr` | 0 matches | no extant pattern |

**extant related patterns:**

| pattern | source | difference |
|---------|--------|------------|
| `emitSubBucket` | goal.ts:46-54 | stdout, not stderr |
| hook.onStop output | goal.ts:953-1001 | inline console.error |
| goalGuard output | goal.ts:1129-1134 | inline console.error |

**why not reuse emitSubBucket?**

`emitSubBucket` uses `console.log` (stdout). hooks must output to stderr per vision line 399. the blueprint correctly uses `console.error`.

no stderr sub.bucket function exists. inline is the codebase pattern for stderr treestruct.

**reuse of extant components:**

| component | source | status |
|-----------|--------|--------|
| `OWL_WISDOM` | goal.ts constant | reused |
| treestruct format | goal.ts:953-1001 | pattern followed |

**verdict:** no duplicate. follows extant stderr pattern.

---

## mode type union (blueprint line 36)

**what it does:**
- extends union from `'triage' | 'hook.onStop'` to `'triage' | 'hook.onStop' | 'hook.onTalk'`

**is this a new mechanism?** no. this is a type union extension, not a new mechanism.

**verdict:** not applicable to this review.

---

## hook.onTalk branch (blueprint lines 48-54)

**what it does:**
- calls extractPromptFromStdin
- calls setAsk
- calls emitOnTalkReminder
- returns (exit 0)

**is this a new mechanism?** yes. a new branch in the orchestrator.

**search for duplicates:**

| search query | results | conclusion |
|--------------|---------|------------|
| `hook.onTalk` | 1 file (shell hook) | shell calls CLI, no TS impl |

**reuse of extant components:**

| component | source | status |
|-----------|--------|--------|
| `setAsk` | domain.operations/goal/setAsk.ts | reused |
| `getScopeDir()` | goal.ts | reused |

**verdict:** no duplicate. correctly reuses extant operations.

---

## summary table

| mechanism | duplicates extant? | reuses extant? | verdict |
|-----------|-------------------|----------------|---------|
| extractPromptFromStdin | no | yes (readStdin) | pass |
| emitOnTalkReminder | no | yes (OWL_WISDOM, pattern) | pass |
| hook.onTalk branch | no | yes (setAsk, getScopeDir) | pass |

---

## research disposition trace

the research stone marked these components with dispositions:

| component | disposition | blueprint usage | consistent? |
|-----------|-------------|-----------------|-------------|
| readStdin | REUSE | called in extractPromptFromStdin | yes |
| setAsk | REUSE | called in hook.onTalk branch | yes |
| OWL_WISDOM | REUSE | referenced in emitOnTalkReminder | yes |
| getScopeDir | REUSE | called in hook.onTalk branch | yes |
| emitSubBucket | REUSE (considered) | NOT reused (stdout vs stderr) | justified |

---

## reflection

I verified each new mechanism against the codebase:

**extractPromptFromStdin:**
- 0 extant prompt extraction functions found
- correctly reuses `readStdin()` for stdin access
- JSON.parse is standard library, no wrapper needed

**emitOnTalkReminder:**
- 0 extant stderr sub.bucket functions found
- follows same inline pattern as hook.onStop and goalGuard
- correctly uses console.error for hook output

**hook.onTalk branch:**
- shell hook exists but calls CLI, no TS implementation
- correctly reuses setAsk and getScopeDir

no duplicates found. all extant components are reused where applicable.

