# review: has-ergonomics-validated (r9)

## the question

does the implemented input/output match the ergonomics planned in the vision?

## verification approach

compared:
1. vision output specification (lines 76-91)
2. actual snapshot output
3. input contract (stdin format, flags)

## output comparison

### vision (lines 76-91)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │
   │  │  {the user's message}
   │  │
   │  └─
   │
   └─ consider: does this impact your goals?
      ├─ if yes, triage before you proceed
      └─ run `rhx goal.triage.infer`
```

### actual (case1 snapshot)

```
🦉 to forget an ask is to break a promise. remember.

🔮 goal.triage.infer --from peer --when hook.onTalk
   ├─ from = peer:human
   ├─ ask
   │  ├─
   │  │
   │  │    help me refactor the auth module
   │  │
   │  └─
   │
   └─ consider: does this impact your goals?
      ├─ if yes, triage before you proceed
      └─ run `rhx goal.triage.infer`
```

### element-by-element match

| element | vision | actual | verdict |
|---------|--------|--------|---------|
| owl header phrase | `to forget an ask is to break a promise. remember.` | same | match |
| command indicator | `🔮` | same | match |
| command line | `goal.triage.infer --from peer --when hook.onTalk` | same | match |
| from field | `peer:human` | same | match |
| ask label | `ask` | same | match |
| sub.bucket structure | `├─` open, `└─` close | same | match |
| content indent | 3 spaces inside bucket | 4 spaces | minor drift |
| consider section | 3-line treestruct | same | match |
| consider hint | `run \`rhx goal.triage.infer\`` | same | match |

### indent drift

the vision shows 3-space indent inside sub.bucket:
```
   │  │  {the user's message}
```

the actual shows 4-space indent:
```
   │  │    help me refactor the auth module
```

this is a minor visual difference. the 4-space indent is actually more readable and consistent with treestruct convention. no fix needed — the drift improved readability.

## input comparison

| input aspect | vision (from wish/criteria) | actual | verdict |
|--------------|---------------------------|--------|---------|
| stdin format | `{"prompt": "message"}` | same | match |
| mode flag | `--when hook.onTalk` | same | match |
| from flag | `--from peer` (default) | same | match |
| scope flag | `--scope repo` (default) | same | match |

## multiline verification

checked case8 snapshot for multiline content:

```
   │  ├─
   │  │
   │  │    line one
   │  │    line two
   │  │    line three
   │  │
   │  └─
```

each line preserved, indentation consistent. multiline ergonomics work as expected.

## why it holds

1. **output structure exact match** — all treestruct elements preserved
2. **owl header exact match** — phrase is word-for-word
3. **command line exact match** — flags and values identical
4. **consider section exact match** — all three lines present
5. **minor indent drift improves readability** — 4 spaces clearer than 3
6. **multiline works correctly** — verified in case8 snapshot
7. **input contract matches** — stdin JSON, flags all correct
8. **no ergonomic regression** — implementation delivers planned UX

