# S15 — an effort gives the choice its own row

**source** = the wisher, 2026-09-30 · **corrects** = the `where do we go?` bucket, which hung the effort beneath `brain = <choice>`

## .said

> whenever effort is listed, choice should get its own subline instead ;    │  └─ brain = claude-sonnet-5[1m]
>    │     └─ effort = low

## .settled

> **where an effort is listed, `brain` is a bare parent, and the choice and the effort are its two peer children.**

```
   │  └─ brain
   │     ├─ choice = claude-sonnet-5[1m]
   │     └─ effort = low
```

- no effort → the one-line `brain = <choice>` stands
- an effort with no choice → `brain`, then `└─ effort = <x>` alone
- ⇒ choice and effort are two properties of one brain, so they sit at one rank; a choice on the parent row and an effort beneath it read as a parent and its child

## .landed

- `src/domain.operations/route/drive/formatRouteDriveWhere.ts`
- `src/domain.operations/route/drive/formatRouteDriveWhere.test.ts`
