# self-review r4: has-contract-output-variants-snapped

fourth pass: hostile reviewer perspective.

---

## hostile claim: "you need CLI snapshots, not function snapshots"

**response:** the tea pause appears in hook mode output. the tests simulate hook mode:

```typescript
const result = await stepRouteDrive({
  mode: 'hook',
  count: 6,
  // ...
});
expect(result.emit?.stdout).toMatchSnapshot();
```

the snapshot captures the stdout that a driver would see.

---

## hostile claim: "you need separate snapshots for each stone name"

**response:** the stone name is a variable substitution. the snapshot uses "1.vision" as example. the format is consistent regardless of stone name.

to test every possible stone name would be:
- redundant (same format)
- impractical (infinite combinations)

---

## hostile claim: "you need --help snapshot"

**response:** this feature modifies `formatRouteDrive`, not a CLI command. there is no `--help` option for tea pause.

---

## conclusion

| hostile claim | response |
|---------------|----------|
| need CLI snapshots | stdout is captured |
| need per-stone snapshots | redundant |
| need --help snapshot | n/a for format function |

snapshot coverage is complete.

