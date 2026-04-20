# review: has-ergonomics-validated (r8)

## the question

does the implemented input/output match the ergonomics planned in the vision?

## vision output (lines 76-91)

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

## actual output (from snapshot)

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

## comparison

| element | vision | actual | match? |
|---------|--------|--------|--------|
| owl header | `🦉 to forget an ask...` | `🦉 to forget an ask...` | yes |
| command line | `🔮 goal.triage.infer --from peer --when hook.onTalk` | same | yes |
| from field | `peer:human` | `peer:human` | yes |
| ask sub.bucket | treestruct with content | treestruct with content | yes |
| consider section | 3-line treestruct | 3-line treestruct | yes |
| whitespace | blank lines in sub.bucket | blank lines in sub.bucket | yes |

## input ergonomics

| input | vision | actual | match? |
|-------|--------|--------|--------|
| stdin format | JSON with `prompt` field | JSON with `prompt` field | yes |
| mode flag | `--when hook.onTalk` | `--when hook.onTalk` | yes |
| from flag | `--from peer` | `--from peer` | yes |

## why it holds

1. output format is an exact match to vision specification
2. treestruct elements preserved: owl header, command line, sub.bucket for ask, consider section
3. multiline content displays correctly (verified in case8 snapshot)
4. input contract matches: JSON stdin with `prompt` field
5. no deviation from planned ergonomics

