# self-review: has-pruned-backcompat

## question: was backwards compat added without explicit request?

### analysis

**backwards compat decisions in implementation:**

1. `--yield` defaults to `keep`
2. `setStoneAsRewound` works without yield parameter
3. `stepRouteStoneSet` works without yield parameter

### items reviewed

#### 1. default to `keep` (preserve yields)
- **decision**: when no yield flag is provided, behavior defaults to `keep`
- **explicit request**: yes, the wish says "soft should just do the current rewind, where it keeps the yields"
- **verdict**: explicitly requested, not unasked backcompat

#### 2. optional yield parameter in setStoneAsRewound
- **decision**: `yield?: 'keep' | 'drop'` is optional
- **why**: callers that don't care about yield mode get default behavior
- **explicit request**: implied by "soft = current behavior"
- **verdict**: maintains API stability, not unasked backcompat

#### 3. optional yield parameter in stepRouteStoneSet
- **decision**: `yield?: 'keep' | 'drop'` is optional
- **why**: same as above, preserves extant call sites
- **explicit request**: implied by backward-compatible default
- **verdict**: maintains API stability, not unasked backcompat

### conclusion

no unasked backwards compatibility. all backcompat decisions flow from the explicit requirement that "soft should do the current rewind" - the default must therefore preserve extant behavior. this was part of the wish, not assumed.
