# self-review: has-questioned-questions

## triage of open questions

### question 1: auto-unlock behavior

**from**: line 154

**status**: [answered] — settled by wisher

**resolution**: no auto-unlock. fail-fast with instructions to unlock.

**why it holds**: auto-unlock would trigger unexpected passphrase prompts mid-command. fail-fast with instructions keeps behavior predictable. agents can remember to unlock first. the simplicity of "fail with clear instructions" beats the complexity of "try to auto-fix".

---

### question 2: keyrack vs envvar fallback

**from**: line 155

**status**: [answered] — settled by wisher

**resolution**: keyrack handles envvar passthrough internally. we only call keyrack.

**why it holds**: keyrack is a complete credential solution that already handles all sources (encrypted vault, envvar fallback). we don't need to duplicate this logic. one call to keyrack, one source of truth. simpler code, fewer edge cases.

---

### question 3: error message format

**from**: line 156: "should the error message reference `rhx roles init --role reviewer` or just keyrack commands?"

**triage**: can this be answered via logic?

**analysis**:
- `rhx roles init --role reviewer` is about discovery (what keys do i need?)
- `rhx keyrack unlock` is about access (how do i get the key?)
- error at review time means user already knows they need XAI_API_KEY

if keyrack is locked: user needs to unlock
if key is absent: user needs to set the key

the error should focus on the immediate action, not full init flow.

**status**: [answered] — via logic

**resolution**: error messages should reference keyrack commands directly:
- locked: "run: rhx keyrack unlock --owner ehmpath ..."
- absent: "run: rhx keyrack set --owner ehmpath --key XAI_API_KEY"

`rhx roles init` is for first-time discovery, not runtime errors.

**why it holds**: users who hit an error at review time already know they need the key — they just need to provide it. the immediate action is "unlock keyrack" or "set key", not "reinitialize role". error messages should be actionable, not educational.

---

## triage of research items

### research 1: keyrack unlock command

**from**: line 160

**status**: [answered] — research done

**resolution**: requires `--prikey` flag for ssh key path.

**why it holds**: the keyrack unlock command requires explicit ssh key specification for security. this is documented behavior, not an assumption. the vision correctly includes `--prikey` in examples.

---

### research 2: genContextBrainSupplier

**from**: line 161

**status**: [answered] — research done

**resolution**: creates `{ 'brain.supplier.xai': { creds: async () => ({ XAI_API_KEY }) } }`.

**why it holds**: this is the documented API from rhachet-brains-xai. the supplier pattern enables lazy credential fetch without modif the brain library. the vision correctly references this pattern.

---

### research 3: reviewer role manifest location

**from**: line 162

**status**: [answered] — research done

**resolution**: will create at `src/domain.roles/reviewer/keyrack.yml`.

**why it holds**: this follows the pattern from the mechanic role in rhachet-roles-ehmpathy. the keyrack.yml file is colocated with the role definition, which is the standard convention.

---

## additional items found

### issue 1: "8 hours" claim is unverified

**from**: line 176 says "session lasts 8 hours"

**problem**: i made this up. unverified claim in vision document.

**status**: [research] — needs verification

**action**: verify keyrack session duration in blueprint phase. update vision to say "session" not "8 hours".

---

### issue 2: research items are marked but not enumerated

**observation**: all research items are marked [x] but they're in a "research needed" section.

**status**: [answered] — cosmetic issue

**action**: section title is accurate ("research needed" shows what WAS needed). no change required.

---

## summary

| question | status | triage |
|----------|--------|--------|
| auto-unlock | [answered] | wisher settled |
| envvar fallback | [answered] | wisher settled |
| error message format | [answered] | logic |
| keyrack unlock | [answered] | research done |
| genContextBrainSupplier | [answered] | research done |
| role manifest location | [answered] | research done |
| "8 hours" claim | [research] | verify in blueprint |

all questions triaged. one item deferred to research phase (session duration).

---

## round 3: deeper reflection

### verification: are questions enumerated in vision?

**check**: the guide says "ensure they're enumerated within the vision under 'open questions & assumptions'"

**review of vision lines 143-162**:
- assumptions: 4 items enumerated ✓
- questions to validate with wisher: 3 items, 2 struck through as settled ✓
- research needed: 3 items, all marked [x] as done ✓

**verdict**: questions are properly enumerated in the vision.

---

### question surfaced: what happens if keyrack session expires mid-review?

**scenario**: user unlocks keyrack, starts a long review, session expires partway through.

**analysis**:
- review is single command — runs to completion or fails
- keyrack fetch happens once at start, not mid-stream
- if session expires BEFORE review starts: fail-fast
- if session expires DURING review: credentials already fetched, no issue

**status**: [answered] — via logic

**verdict**: not a concern. credential fetch is atomic at start.

---

### question surfaced: should vision document the keyrack API we'll use?

**analysis**:
- vision is about WHAT and WHY
- specific API (`getKeyrackKeyGrant`) is HOW
- HOW belongs in blueprint, not vision

**status**: [answered] — via scope decision

**verdict**: vision correctly omits implementation details. blueprint will specify API.

---

### action: fix "8 hours" in vision

**issue**: line 176 says "session lasts 8 hours" — unverified claim.

**decision**: fix now (before stone passes) or defer to research?

**analysis**:
- the claim is cosmetic, not core to vision
- but inaccurate claims erode trust
- simple fix: change "8 hours" to "the session"

**action**: will update vision to remove specific duration claim.

---

## round 3 summary

round 3 surfaced 2 additional questions (both answered via logic):
- session expiry mid-review: not a concern
- API in vision: correctly scoped out

action item: update vision line 176 to remove "8 hours" claim.

**fix applied**: changed "session lasts 8 hours" to "the keyrack session persists" in vision.

---

## fix documentation

### fix 1: removed unverified "8 hours" duration claim

**before**: line 176 said "session lasts 8 hours"

**after**: line 176 says "the keyrack session persists"

**why**: the specific duration was unverified. the key point is that the session persists (users don't need to unlock every command), not the exact duration.

**lesson**: avoid specific claims without verification. general statements ("persists") are safer than specific ones ("8 hours").

---

no blockers. all issues addressed. vision updated. ready to proceed.

