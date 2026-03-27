# self-review r2: has-pruned-yagni

## step back and breathe

review for extras that were not prescribed.

---

## component-by-component YAGNI review

### component 1: shell redirect for apply mode

**was this explicitly requested?**: yes. vision § summary says "shell redirect writes directly to file"

**is this minimum viable?**: yes. no simpler way to bypass node buffer.

**verdict**: not YAGNI. core requirement.

### component 2: portable hash command (sha256sum || shasum)

**was this explicitly requested?**: vision says "sha256sum" but not the portable fallback.

**did I add abstraction "for future flexibility"?**: no. the fallback is for current cross-platform support.

**is this minimum viable?**: yes. without fallback, macOS users can't use the feature.

**verdict**: not YAGNI. necessary for cross-platform support.

### component 3: fs.statSync for size

**was this explicitly requested?**: yes. vision § summary shows `const size = fs.statSync(path).size`

**is this minimum viable?**: yes. the alternative (Buffer.byteLength) requires content in memory.

**verdict**: not YAGNI. core requirement.

### component 4: maxBuffer for plan mode

**was this explicitly requested?**: no. vision focuses on apply mode.

**why did I add it?**: test research revealed plan mode must not write files.

**is this minimum viable?**: let me think...

alternative: plan mode could call apply mode under the hood, then delete files. but that's more complex.

alternative 2: plan mode could error for large diffs. but that degrades extant behavior.

**did I optimize before needed?**: the 50MB limit is somewhat arbitrary. I could use a higher limit (100MB) or lower (10MB).

**verdict**: necessary for backwards compatibility. the limit value (50MB) is reasonable but could be questioned.

### component 5: try/catch error for plan mode

**was this explicitly requested?**: no. I added it in r1 review.

**why did I add it?**: to provide a helpful error instead of cryptic "maxBuffer exceeded".

**is this minimum viable?**: questionable. the error would still occur without the try/catch, just less helpful.

**did I add features "while we're here"?**: yes. this is a quality-of-life improvement, not a requirement.

**verdict**: **YAGNI candidate**. could remove to keep scope minimal.

---

## YAGNI candidate identified

**component**: try/catch error wrap for plan mode

**why it might be YAGNI**:
- not requested
- the fix would work without it
- adds complexity

**why it might be necessary**:
- improves user experience
- guides users to use apply mode for large diffs
- low cost (few lines of code)

**decision**: this is borderline. I'll keep it because:
1. it's low cost (4 lines)
2. it provides actionable guidance
3. it doesn't add maintenance burden

if the wisher disagrees, it can be removed easily.

---

## summary

| component | status | reason |
|-----------|--------|--------|
| shell redirect | required | core fix |
| portable hash | required | cross-platform |
| fs.statSync | required | core fix |
| maxBuffer plan | required | backwards compat |
| try/catch error | kept | low cost, high value |

no YAGNI deletions made. one borderline component kept with justification.
