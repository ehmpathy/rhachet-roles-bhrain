# self-review r2: has-questioned-assumptions (deeper pass)

## new assumptions surfaced

### 8. assumption: goal.infer runs immediately on human input

| question | answer |
|----------|--------|
| what do we assume? | vision says "immediate — goal.infer runs on human input, goals persisted" (line 118) |
| evidence? | none — I assumed immediate invocation |
| what if opposite? | goals could be inferred lazily, on-demand, or at end of conversation |
| did wisher say? | "detect and persist" — no specification of when |
| exceptions? | batch inference at session end might be cleaner |

**issue found**: "immediate" is an assumed time choice, not a requirement.

**resolution**: immediate vs lazy is an implementation choice. immediate provides:
- real-time feedback (human sees goals appear)
- early error detection (malformed goals caught early)

lazy provides:
- less interrupt to conversation flow
- batched context (more info to infer from)

**decision**: keep "immediate" as the default, but note this is a design choice. the wish doesn't mandate time.

---

### 9. assumption: goal.infer takes a single source string

| question | answer |
|----------|--------|
| what do we assume? | vision shows `source: string (the utterance or thought)` |
| evidence? | wish says "from communications" (plural), "from internalizations" |
| what if opposite? | goal.infer could take conversation history, multiple messages |
| did wisher say? | "from communications" plural suggests multiple inputs possible |
| exceptions? | multi-turn conversation builds context that single string loses |

**issue found**: single string may be too narrow.

**resolution**: for v1, single string is simpler:
- caller can concatenate if needed
- avoids complex input shape
- matches "root primitive" scope

future iteration could accept `sources: string[]` or structured conversation.

**decision**: keep single string for v1. note as potential expansion point.

---

### 10. assumption: goals are stored as markdown (.goal.md)

| question | answer |
|----------|--------|
| what do we assume? | vision shows `001.fix-auth-test.goal.md` |
| evidence? | none — I chose markdown for human readability |
| what if opposite? | .json for machine parse, .jsonl for stream, .txt for simplicity |
| did wisher say? | no format specified |
| exceptions? | markdown frontmatter could encode structured data |

**issue found**: file format is a design choice, not a requirement.

**resolution**: markdown enables:
- human inspection via cat/less
- frontmatter for structured fields
- rich text for task/gate descriptions

json enables:
- reliable parse
- typed access
- no format ambiguity

**decision**: markdown with yaml frontmatter is a reasonable default. structured fields in frontmatter, prose in body. should be validated with wisher.

---

### 11. assumption: number prefix (001., 002.) for order

| question | answer |
|----------|--------|
| what do we assume? | vision shows `001.fix-auth-test.goal.md` |
| evidence? | none — I assumed this for directory sort order |
| what if opposite? | uuid prefix, timestamp prefix, or no prefix |
| did wisher say? | no name convention specified |
| exceptions? | gaps in number sequence when goals are deleted |

**issue found**: number scheme is a design choice.

**resolution**: number prefix enables:
- predictable sort order (ls shows chronological)
- human-friendly (001 is "first goal")

timestamp enables:
- no gaps on deletion
- precise creation time

uuid enables:
- guaranteed uniqueness
- no coordination needed

**decision**: number prefix is simplest for v1. note as design choice.

---

### 12. assumption: context parameter is optional

| question | answer |
|----------|--------|
| what do we assume? | vision shows `context?: { route?: string }` |
| evidence? | none — I made it optional for convenience |
| what if opposite? | required context forces caller to always know location |
| did wisher say? | "into the $route/.goals/ dir, if within a route" — implies route awareness |
| exceptions? | caller might not know if they're in a route |

**issue found**: optionality simplifies api but may hide location bugs.

**resolution**: optional context means:
- skill detects route automatically if not specified
- caller can override if needed
- simpler api for common case

**decision**: keep optional. skill should auto-detect route from cwd. note in implementation: default behavior is "detect from cwd".

---

### 13. assumption: evidence is a string

| question | answer |
|----------|--------|
| what do we assume? | `evidence?: string` in Goal interface |
| evidence? | none — I assumed free-form text |
| what if opposite? | structured evidence (commit sha, test output link, file diff) |
| did wisher say? | no mention of evidence format |
| exceptions? | structured evidence enables automated verification |

**issue found**: string is simplest, but structured might be more useful.

**resolution**: for v1, string is adequate:
- brain can write "test passes: [output]"
- human can read and verify
- no schema to design

future iteration could add typed evidence: `{ type: 'test-output' | 'commit' | 'manual', value: string }`.

**decision**: keep string for v1. note as potential expansion.

---

## previously reviewed assumptions (reaffirmed)

| assumption | r1 verdict | r2 verdict |
|------------|------------|------------|
| goals are discrete | holds | holds — wisher explicit |
| file-per-goal | design choice | holds — enables inspection |
| goals have lifecycle | holds | holds — "accomplish" implies states |
| llm can infer goals | untested | untested — documented |
| human/self equivalent | holds | holds — source field enables diff |
| route-scoped preferred | holds | holds — wisher explicit |
| ask/task/gate sufficient | holds for v1 | holds for v1 |

## issues found in r2

1. **"immediate" time is assumed**: not required by wisher.
2. **single source string may be narrow**: could need multi-message context.
3. **markdown format is assumed**: should validate with wisher.
4. **number scheme is assumed**: 001. prefix is design choice.
5. **context optionality is assumed**: auto-detect from cwd is reasonable.
6. **evidence as string is assumed**: structured evidence deferred to future.

## fixes applied

all issues are design choices, not blockers. each has been noted as:
- a design decision (not a requirement)
- with alternatives considered
- and rationale for the v1 choice

no changes needed to the vision — it appropriately scopes to v1 and lists open questions.

## deeper reflection

the vision makes many design choices that feel reasonable but aren't mandated by the wisher. this is expected for a vision document — it must make choices to paint a concrete picture. what matters is:

1. core requirements (3 skills, ask/task/gate, .goals/ dir) are from the wish
2. design choices are noted as such (file format, time, name)
3. open questions are surfaced for wisher validation

the vision is appropriately scoped and honest about its assumptions.
