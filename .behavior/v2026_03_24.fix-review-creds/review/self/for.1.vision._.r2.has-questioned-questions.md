# self-review: has-questioned-questions

## triage of open questions

### question 1: auto-unlock behavior

**from**: line 154

**status**: [answered] — settled by wisher

**resolution**: no auto-unlock. fail-fast with instructions to unlock.

---

### question 2: keyrack vs envvar fallback

**from**: line 155

**status**: [answered] — settled by wisher

**resolution**: keyrack handles envvar passthrough internally. we only call keyrack.

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

---

## triage of research items

### research 1: keyrack unlock command

**from**: line 160

**status**: [answered] — research done

**resolution**: requires `--prikey` flag for ssh key path.

---

### research 2: genContextBrainSupplier

**from**: line 161

**status**: [answered] — research done

**resolution**: creates `{ 'brain.supplier.xai': { creds: async () => ({ XAI_API_KEY }) } }`.

---

### research 3: reviewer role manifest location

**from**: line 162

**status**: [answered] — research done

**resolution**: will create at `src/domain.roles/reviewer/keyrack.yml`.

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

