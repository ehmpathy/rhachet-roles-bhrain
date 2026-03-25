# self-review: has-questioned-requirements

## found issues (fixed)

### issue 1: auto-unlock was assumed

the original vision proposed "try `rhx keyrack unlock --owner ehmpath`" if keyrack is locked.

**problem**: auto-unlock adds complexity and could cause unexpected passphrase prompts mid-command. the wish said "try and unlock" but this creates magic behavior.

**fix**: wisher clarified — no auto-unlock. if locked, fail-fast with instructions: "run: rhx keyrack unlock --owner ehmpath". updated the vision document to remove auto-unlock attempt.

**lesson**: when the wish says "try and X", question whether that means auto-X or fail-with-instructions-to-X.

---

### issue 2: keyrack vs envvar precedence was assumed

the original vision said "keyrack wins (explicit > implicit)" when both keyrack and envvar have XAI_API_KEY.

**problem**: i made this up — the wish didn't specify precedence.

**fix**: wisher clarified — keyrack handles envvar passthrough internally. we never check envvar directly. the "precedence" question is moot. updated the vision to remove the keyrack-vs-envvar edgecase.

**lesson**: keyrack is a complete solution for credential retrieval. we call keyrack once and trust it to handle all sources (vault, envvar, etc).

---

### issue 3: stale assumption about auto-unlock

during fresh-eyes review, found line 150 of vision still said "unlock can be automated: an attempt to `rhx keyrack unlock` in the cli is acceptable".

**problem**: this contradicts our decision that we do NOT auto-unlock.

**fix**: updated assumption 4 to "no auto-unlock: cli does NOT try to unlock; just fail-fast with instructions".

**lesson**: when you answer an open question, search for all places that assumption appeared and update them.

---

## requirements questioned

### 1. pull XAI_API_KEY from keyrack rather than envvars

| question | answer |
|----------|--------|
| who said this? | the wish, explicitly |
| why? | xai is the default brain; envvars are insecure (shell history, visible to other processes) |
| what if we didn't? | users continue with envvars — security concern persists |
| is scope right? | yes, focused on the default brain only |
| simpler way? | no — keyrack is the org's standard for secure credential storage |

**verdict**: holds.

**why it holds**: envvars expose credentials in three ways: (1) shell history captures `export XAI_API_KEY=...`, (2) the key persists in the process environment visible to `ps e` and child processes, (3) users must remember to set it each session. keyrack solves all three: (1) no plaintext in history, (2) credential fetched just-in-time and not stored in environment, (3) one-time setup per machine. the security improvement is concrete and measurable.

---

### 2. pass credentials via rhachet-brains-xai context

| question | answer |
|----------|--------|
| who said this? | the wish mentions "upgraded rhachet-brains-xai context" |
| why? | research confirms: rhachet-brains-xai supports `context['brain.supplier.xai']` with `creds` function |
| what if we didn't? | we'd need to modify rhachet-brains-xai or use envvar fallback (defeats purpose) |
| is scope right? | yes, this is the supported integration point |
| simpler way? | no — this is the designed API |

**verdict**: holds.

**why it holds**: rhachet-brains-xai already supports `context['brain.supplier.xai']` with an async `creds()` function. this is not a workaround — it's the designed API. the supplier pattern enables just-in-time credential fetch without modification to the brain library. the research confirmed this: `getSdkXaiCreds.js` checks for the supplier first, then falls back to envvar. we're use the path the library authors intended.

---

### 3. fail-fast if keyrack can't find creds

| question | answer |
|----------|--------|
| who said this? | the wish: "failfast if the `rhx keyrack` cant find those creds" |
| why? | actionable errors > silent failures |
| what if we didn't? | users would get cryptic errors from the xai api instead |
| is scope right? | yes |
| simpler way? | no — fail-fast with instructions is the pit-of-success pattern |

**verdict**: holds.

**why it holds**: without fail-fast, users would see an opaque error from the xai api: "401 unauthorized" or "invalid api key". they'd have to debug whether the key is wrong, expired, or absent. fail-fast with "run: rhx keyrack unlock --owner ehmpath" gives them the exact command to run. this is the pit-of-success pattern: the error message contains the solution.

---

### 4. xai-only for now

| question | answer |
|----------|--------|
| who said this? | the wish: "only add this support for XAI_API_KEY for now" |
| why? | xai is the default brain; other brains are opt-in |
| what if we didn't? | scope creep — would need to support anthropic, openai keyrack too |
| is scope right? | yes, this is intentional scope control |
| simpler way? | this IS the simplification |

**verdict**: holds.

**why it holds**: xai/grok/code-fast-1 is the default brain (line 17 of review.ts: `const DEFAULT_BRAIN = 'xai/grok/code-fast-1'`). users who don't specify `--brain` get xai. those who opt into anthropic or openai are power users who already know to set envvars. keyrack support for other brains can come later if demand exists. this is intentional scope control, not laziness.

---

### 5. try auto-unlock the keyrack

| question | answer |
|----------|--------|
| who said this? | the wish: "try and unlock the `--ehmpath` keyrack if its not already unlocked" |
| why? | reduce friction |
| what if we didn't? | users would need to run `rhx keyrack unlock` manually before review |
| is scope right? | maybe too much magic? |
| simpler way? | just fail with instructions: "run: rhx keyrack unlock --owner ehmpath" |

**found issue**: the vision proposes auto-unlock attempt. this adds complexity and could cause unexpected passphrase prompts mid-command.

**update from wisher**: wisher clarified: if locked, just failfast and tell the caller to unlock their ehmpath keyrack. no auto-unlock attempt.

**fix**: updated understanding. the review cli should NOT try to auto-unlock. if keyrack is locked, fail-fast with actionable instructions.

**verdict**: issue settled. no auto-unlock — just fail-fast with instructions.

---

### 6. add keyrack to reviewer role manifest

| question | answer |
|----------|--------|
| who said this? | the wish: "add a keyrack to the reviewer role" |
| why? | discoverability — `rhx roles init` shows required credentials |
| what if we didn't? | users discover requirements only at runtime error |
| is scope right? | yes |
| simpler way? | no — this is the standard pattern (see mechanic role) |

**verdict**: holds.

**why it holds**: the mechanic role already declares its keyrack in `getMechanicRole.js` with `keyrack: { uri: '${__dirname}/keyrack.yml' }`. the keyrack.yml file lists required credentials by environment. when users run `rhx roles init --role reviewer`, they see what credentials are needed. this is discoverability by design — users know what's required before they hit a runtime error.

---

### 7. envvars still work for other brains

| question | answer |
|----------|--------|
| who said this? | the wish: "envvars will still work for any other creds required" |
| why? | backwards compatibility for non-xai brains |
| what if we didn't? | break change for anyone who uses anthropic/openai |
| is scope right? | yes |
| simpler way? | this IS the non-break approach |

**verdict**: holds.

**why it holds**: for xai, keyrack handles everything — including envvar passthrough internally. we never check envvar directly for xai. for other brains (anthropic, openai), their brain libraries still check envvars. we're not modifiy those codepaths. users who `--brain anthropic/claude-3` still set ANTHROPIC_API_KEY as envvar. this is intentional scope control — xai is the focus.

**update from wisher**: keyrack already passes through envvar internally. we should never think about XAI_API_KEY as an envvar — keyrack will do it for us. simplified mental model.

---

## vision-specific questions

### precedence: keyrack vs envvar

the vision says "keyrack wins (explicit > implicit)" when both are present.

| question | answer |
|----------|--------|
| who said this? | i did, not the wish |
| why? | keyrack is explicit setup; envvar might be stale |
| what if keyrack wins? | user might have envvar for a reason (override) |
| what if envvar wins? | defeats purpose of keyrack migration |

**settled by wisher clarification**: keyrack already passes through envvar internally. we never think about envvar directly for XAI_API_KEY. we only call keyrack, and keyrack handles the rest (including its own envvar fallback logic). the "precedence" question is moot — keyrack owns it.

**fix**: remove "keyrack vs envvar" from the vision's edgecases table. we only call keyrack.

---

### `--owner ehmpath` hardcoded

the vision proposes hardcoded owner.

| question | answer |
|----------|--------|
| who said this? | the wish: "this repo is from ehmpathy, so we feel comfortable with creds from the `--ehmpath` owner" |
| why? | this repo is owned by ehmpathy; contributors are expected to have ehmpath keyrack |
| what if forked? | forkers would need to update keyrack.yml or use envvars |

**verdict**: holds. the wish explicitly accepts this limitation.

---

## summary

| requirement | verdict |
|-------------|---------|
| keyrack for XAI_API_KEY | holds |
| supplier context pattern | holds |
| fail-fast | holds |
| xai-only scope | holds |
| auto-unlock attempt | **settled**: no auto-unlock, just fail-fast |
| role keyrack manifest | holds |
| envvars for other brains | holds (keyrack handles envvar passthrough internally) |
| keyrack > envvar precedence | **settled**: moot — keyrack owns all of it |
| hardcoded ehmpath owner | holds (wish accepts limitation) |

no blockers found. issues settled by wisher feedback:
1. auto-unlock: no auto-unlock, just fail-fast with instructions
2. precedence: keyrack handles envvar passthrough internally — we only call keyrack
