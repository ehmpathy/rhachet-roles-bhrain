# self-review r4: has-pruned-yagni

## step back and breathe

tea. patience. question each component again.

---

## components left after r3

| component | status |
|-----------|--------|
| shell redirect | kept |
| portable hash | kept |
| fs.statSync | kept |
| maxBuffer plan | kept |

---

## question 1: is shell redirect minimum viable?

**vision says**: "shell redirect writes directly to file"

**alternative**: use `spawn` with streams.

**is shell redirect minimum viable?**: yes. `spawn` would require more code and async refactor.

**verdict**: not YAGNI. minimum viable.

---

## question 2: is portable hash minimum viable?

**vision says**: "sha256sum handles hash"

**reality**: macos doesn't have sha256sum

**alternative**: require users to install sha256sum on macos.

**is portable hash minimum viable?**: the fallback is 10 extra characters: `|| shasum -a 256`. without it, macos users can't use the feature. that's worse than 10 characters.

**verdict**: not YAGNI. necessary for cross-platform.

---

## question 3: is fs.statSync minimum viable?

**vision says**: shows `fs.statSync(path).size`

**alternative**: use `wc -c file` via shell.

**is fs.statSync minimum viable?**: both approaches work. `fs.statSync` is already imported. `wc -c` would add another shell command. `fs.statSync` is simpler.

**verdict**: not YAGNI. simpler than alternative.

---

## question 4: is maxBuffer for plan mode minimum viable?

**vision says**: focuses on apply mode fix.

**reality**: plan mode exists and tests verify it doesn't write files.

**alternative 1**: remove plan mode from API. that's a break change. not acceptable.

**alternative 2**: plan mode errors for any diff. degrades extant behavior. not acceptable.

**alternative 3**: plan mode uses shell too, writes to temp, deletes. more complex than current.

**is maxBuffer minimum viable?**: yes. it's the simplest way to preserve plan mode behavior.

**verdict**: not YAGNI. necessary for backwards compatibility.

---

## question 5: did I optimize before needed?

**50MB limit**: is this premature optimization?

the old limit was 1MB (node default). I raised it to 50MB.

**why 50MB?**: arbitrary. could be 10MB, could be 100MB.

**is this optimization?**: no. it's a configuration choice. the feature works with any reasonable limit.

**verdict**: not YAGNI. configuration, not optimization.

---

## final check: re-read blueprint for any extras

let me verify the blueprint is minimal.

```
filediff tree:
- [~] setSavepoint.ts — one file, correct

codepath tree:
- shell redirect for apply — core fix
- maxBuffer for plan — backwards compat
- portable hash — cross-platform
- fs.statSync — size from file
- no extras found
```

---

## conclusion

r3 removed one YAGNI (try/catch). r4 verified all components left are necessary.

the blueprint is minimal.

| component | minimum viable? | verdict |
|-----------|-----------------|---------|
| shell redirect | yes | required |
| portable hash | yes | required |
| fs.statSync | yes | required |
| maxBuffer plan | yes | required |

no further YAGNI found. blueprint is ready.
