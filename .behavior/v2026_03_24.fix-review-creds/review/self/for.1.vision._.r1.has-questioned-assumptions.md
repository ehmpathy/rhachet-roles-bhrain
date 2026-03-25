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

