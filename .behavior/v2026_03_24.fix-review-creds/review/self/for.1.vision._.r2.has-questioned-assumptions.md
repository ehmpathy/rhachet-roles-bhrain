# self-review: has-questioned-assumptions

## assumptions identified and questioned

### assumption 1: ssh key path is `~/.ssh/ehmpath`

**where assumed**: line 30, line 174

**evidence**: none — i made this up as a plausible example.

**what if false**: users with different ssh key locations would copy-paste and fail.

**wisher said**: the wish mentions `--prikey` flag but doesn't specify path.

**verdict**: the path is an example, not a requirement. error messages should say "your ehmpath ssh key" not a specific path.

**fix needed**: in implementation, error messages should guide to correct command structure without hard-coded path.

---

### assumption 2: brain detection via slug prefix `xai/`

**where assumed**: implicit in "if brain is xai-based" (line 73)

**evidence**: DEFAULT_BRAIN is `xai/grok/code-fast-1` — slug starts with `xai/`.

**what if false**: if xai brains don't all start with `xai/`, we'd miss some or match wrong ones.

**verification needed**: check how rhachet-brains identifies xai brains. is slug prefix reliable?

**verdict**: reasonable assumption. xai brains are namespaced under `xai/` by convention. implementation should use `brain.choice.startsWith('xai/')` or similar.

---

### assumption 3: keyrack.yml schema is `org:` + `env.all:`

**where assumed**: line 63-68

**evidence**: based on research of mechanic role, but I inferred the schema.

**what if false**: wrong schema would cause role init to fail or ignore the keyrack.

**verification needed**: check actual keyrack.yml files in rhachet-roles-ehmpathy for exact format.

**verdict**: needs verification in blueprint phase. schema should match actual rhachet infrastructure.

---

### assumption 4: `rhx roles init --role reviewer` shows keyrack requirements

**where assumed**: line 28-31, line 55

**evidence**: the wish says "add a keyrack to the reviewer role, so that when folks init their keyrack with this role, they extend this roles keyrack."

**what if false**: if `rhx roles init` doesn't read keyrack.yml, users won't discover requirements via init.

**verification needed**: check how rhachet roles init processes keyrack declarations.

**verdict**: this is stated in the wish, so it's a feature we expect. implementation must ensure this works.

---

### assumption 5: keyrack session lasts 8 hours

**where assumed**: line 176

**evidence**: none — i stated this without verification.

**what if false**: if session is shorter (or doesn't exist), the "unlock once" promise is inaccurate.

**verification needed**: check rhachet keyrack session duration.

**verdict**: the exact duration doesn't matter for the vision. the point is "unlock once per session, not every command." remove specific hour claim.

**fix**: updated vision language should say "session" not "8 hours".

---

### assumption 6: supplier context key is `'brain.supplier.xai'`

**where assumed**: line 77, line 115

**evidence**: research showed `genContextBrainSupplier` creates this key pattern.

**what if false**: wrong key means credentials won't flow to the brain library.

**verdict**: based on research. implementation should verify exact key from rhachet-brains-xai source.

---

### assumption 7: `getKeyrackKeyGrant` is the correct API

**where assumed**: implicit — not stated in vision but assumed for implementation.

**evidence**: research of rhachet keyrack documentation.

**what if false**: wrong API would cause runtime errors.

**verdict**: needs verification in blueprint phase. the vision doesn't commit to a specific function — implementation will verify.

---

### assumption 8: envvar passthrough is automatic in keyrack

**where assumed**: line 140, based on wisher clarification

**evidence**: wisher said "keyrack already passes through envvar internally."

**what if false**: if keyrack doesn't actually pass through envvars, users who set XAI_API_KEY as envvar would see failures.

**verdict**: this is from wisher, so we trust it. implementation should verify keyrack behavior.

---

## summary

| assumption | source | verdict |
|------------|--------|---------|
| ssh key path example | made up | ok as example, don't hard-code in errors |
| brain detection via slug prefix | inferred from DEFAULT_BRAIN | reasonable, verify in implementation |
| keyrack.yml schema | inferred from research | verify in blueprint |
| roles init shows keyrack | wish explicitly states | implement to match |
| session duration | made up | remove specific claim |
| supplier context key | research | verify in implementation |
| getKeyrackKeyGrant API | research | verify in implementation |
| envvar passthrough | wisher clarification | trust, verify in implementation |

**no blockers found**. all assumptions are either:
1. from the wish (trust source)
2. reasonable inferences (verify in implementation)
3. examples that should be generalized (fix in errors/docs)

---

## round 2: deeper reflection

### assumption 9: keyrack call belongs in review cli, not stepReview

**where assumed**: line 72-77 says "review cli behavior: ... call `rhx keyrack get`"

**what if false**: if keyrack call belongs in stepReview (the domain operation), we'd place it in the wrong layer.

**analysis**: the cli is the right place because:
- keyrack is ehmpathy-specific (hardcoded `--owner ehmpath`)
- stepReview should be brain-agnostic
- supplier context is passed INTO stepReview, not created by it
- other consumers of stepReview (programmatic use) might not want keyrack

**verdict**: correct layer. cli handles org-specific credential fetch, passes to domain operation.

---

### assumption 10: "automatically" means no user interaction per-command

**where assumed**: line 56 says "credentials fetched automatically"

**what if false**: users might interpret "automatic" as "zero interaction ever"

**reality**: keyrack requires session unlock (once per session). after that, credentials ARE automatic.

**verdict**: the vision is accurate. "automatic" refers to per-command behavior after session unlock. the timeline diagram (lines 80-91) makes this clear: one-time unlock, then automatic.

---

### assumption 11: users will feel relieved, not frustrated

**where assumed**: "aha moment" (line 45) assumes positive user reaction

**what if false**: users might feel frustrated by extra unlock step compared to simple `export VAR=...`

**analysis**: the tradeoff is:
- before: `export` each session (or add to .bashrc, which exposes in all shells)
- after: `rhx keyrack unlock` each session

both require one action per session. the difference:
- export: key visible in history, environment
- keyrack: key encrypted, not visible

users who care about security will appreciate. users who don't may feel friction.

**verdict**: the "aha" is for security-conscious users. document that envvar fallback exists (via keyrack passthrough) for those who don't want keyrack.

---

### assumption 12: the vision's "before" scenario is accurate

**where assumed**: lines 5-16 describe current behavior

**what if false**: if current review skill doesn't error with "XAI_API_KEY not found" when absent, the "before" is inaccurate.

**verification needed**: check actual error message when XAI_API_KEY is absent.

**verdict**: the "before" scenario is illustrative. exact error message will vary, but the pattern (error, scramble, expose in history) is accurate.

---

## round 2 summary

additional assumptions surfaced in round 2:
- keyrack in cli vs stepReview: correct layer
- "automatic" definition: accurate with context
- user reaction: depends on security consciousness
- "before" scenario: illustrative, not literal

no new blockers found.

