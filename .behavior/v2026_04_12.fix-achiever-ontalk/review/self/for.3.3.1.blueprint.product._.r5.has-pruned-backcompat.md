# self-review: has-pruned-backcompat (r5)

## stone

`3.3.1.blueprint.product`

## verdict

**pass**

---

## methodology

1. read the wish acceptance criteria line by line
2. read the blueprint for any backwards compatibility concerns
3. for each backcompat concern found, trace to explicit wish request
4. flag any concern that lacks explicit request

---

## backwards compatibility concerns in blueprint

### 1. "onStop behavior unchanged"

**blueprint reference:** acceptance criteria map table, line 236

> | onStop behavior unchanged | no changes to onStop branch |

**wish reference:** acceptance criteria, line 88

> - [ ] extant `hook.onStop` behavior unchanged

**trace:** directly requested by wisher.

**verdict:** explicitly requested. not a YAGNI backcompat concern.

---

## analysis: is the implementation purely additive?

the blueprint proposes:

| change | type | backcompat concern? |
|--------|------|---------------------|
| add `'hook.onTalk'` to mode union | additive | no |
| add `extractPromptFromStdin` function | additive | no |
| add `emitOnTalkReminder` function | additive | no |
| add `hook.onTalk` branch in switch | additive | no |
| add unit tests | additive | no |
| add integration tests | additive | no |
| leave `hook.onStop` branch untouched | preservation | explicitly requested |
| leave `triage` branch untouched | preservation | implicit (no change) |

all changes are additive. no modification to extant behavior.

---

## what would unprescribed backcompat look like?

examples of backcompat that would require explicit request:

| hypothetical concern | why it would need request |
|----------------------|---------------------------|
| "keep old CLI flag syntax" | not mentioned in wish |
| "support legacy stdin format" | not mentioned in wish |
| "maintain old error message format" | not mentioned in wish |
| "preserve deprecated API" | not mentioned in wish |

none of these appear in the blueprint.

---

## why onStop preservation is necessary

the wish calls this out because:

1. `hook.onStop` and `hook.onTalk` share the same CLI entrypoint (`goalTriageInfer`)
2. changes to shared code could affect onStop
3. the wisher explicitly wants assurance that onStop remains functional

this is a valid, explicitly requested backcompat concern.

---

## no unprescribed backcompat found

the blueprint contains exactly one backcompat concern: "onStop behavior unchanged."

this concern traces directly to wish line 88.

no backcompat concerns were added "to be safe" without explicit request.

---

## reflection

the blueprint is purely additive. the only backcompat mention is explicitly requested in the wish acceptance criteria. no removal required.

