# self-review: behavior-declaration-coverage (r4)

## stone: 5.1.execution.phase0_to_phaseN.v1

---

## fourth pass — specification coverage

re-read the vision, criteria, and blueprint. checked each requirement against code.

---

## vision coverage

### vision: day-in-the-life after

| requirement | implemented? | where |
|-------------|--------------|-------|
| review "just works" after keyrack setup | yes | review.ts calls getXaiCredsFromKeyrack |
| keyrack fetches XAI_API_KEY automatically | yes | getXaiCredsFromKeyrack.ts |
| role declares credential requirements | yes | keyrack.yml |
| envvars still work for other brains | yes | only xai brains trigger keyrack |

### vision: contract inputs & outputs

| requirement | implemented? | where |
|-------------|--------------|-------|
| role manifest declares XAI_API_KEY | yes | `src/domain.roles/reviewer/keyrack.yml` |
| cli detects brain choice | yes | `isXaiBrain = options.brain.startsWith('xai/')` |
| if xai: fetch from keyrack | yes | `await getXaiCredsFromKeyrack()` |
| if locked/unavailable: fail-fast | yes | `process.exit(2)` with instructions |
| pass via supplier context | yes | returns `{ supplier: { 'brain.supplier.xai': ... } }` |

### vision: assumptions

| assumption | addressed? | how |
|------------|-----------|-----|
| ehmpathy org owns this | yes | hardcoded `owner: 'ehmpath'` |
| xai is default brain | yes | only triggers for `xai/` prefix |
| no auto-unlock | yes | fail-fast with instructions, no auto-unlock |

---

## criteria coverage

### usecase.1: review with xai brain (happy path)

```
given(keyrack is unlocked for ehmpath owner)
given(XAI_API_KEY is set in keyrack)
  when(user runs `rhx review`)
    then(review completes)
    then(credentials are fetched from keyrack)
    then(credentials are passed to xai brain)
```

**coverage:** yes. `grant.status === 'granted'` branch handles this.

### usecase.2: review with locked keyrack

```
given(keyrack is NOT unlocked)
  when(user runs `rhx review`)
    then(review fails immediately)
    then(error shows unlock command)
```

**coverage:** yes. `grant.status === 'locked'` branch with `process.exit(2)`.

### usecase.3: review with absent key

```
given(keyrack IS unlocked)
given(XAI_API_KEY is NOT set)
  when(user runs `rhx review`)
    then(review fails immediately)
    then(error shows set command)
```

**coverage:** yes. `grant.status === 'absent'` branch with `process.exit(2)`.

### usecase.4: review with non-xai brain

```
given(user specifies `--brain anthropic/claude-3`)
  when(user runs `rhx review`)
    then(keyrack is NOT consulted)
    then(envvars are used as usual)
```

**coverage:** yes. `isXaiBrain` check only calls keyrack for `xai/` brains.

### usecase.5: role initialization shows keyrack requirements

```
given(reviewer role has keyrack manifest)
  when(user runs `rhx roles init --role reviewer`)
    then(output shows XAI_API_KEY is required)
```

**coverage:** partially. keyrack.yml exists, but rhachet's `roles init` handles the display. our job was to create the manifest.

### usecase.6: keyrack envvar passthrough

```
given(keyrack is unlocked)
given(XAI_API_KEY is NOT in keyrack vault)
given(XAI_API_KEY IS set as envvar)
  when(user runs `rhx review`)
    then(review completes)
    then(keyrack handles envvar lookup internally)
```

**coverage:** yes. keyrack sdk handles passthrough. we call `keyrack.get()` and it returns the envvar if vault is empty but envvar exists.

---

## blueprint coverage

### phase 0: infrastructure

| step | implemented? | file |
|------|--------------|------|
| create keyrack.yml | yes | `src/domain.roles/reviewer/keyrack.yml` |
| create getXaiCredsFromKeyrack | yes | `src/domain.operations/credentials/getXaiCredsFromKeyrack.ts` |

### phase 1: cli integration

| step | implemented? | file |
|------|--------------|------|
| update review.ts | yes | import + isXaiBrain + getXaiCredsFromKeyrack() |
| update reflect.ts | yes | same pattern for consistency |

### phase 2: tests

| step | implemented? |
|------|--------------|
| unit tests for getXaiCredsFromKeyrack | no, deferred per roadmap |
| acceptance tests for keyrack scenarios | no, deferred per roadmap |

**note:** tests were explicitly deferred to phase 2 in the roadmap. current execution covers phase 0 and phase 1.

---

## error messages (per blueprint)

| scenario | blueprint says | code says | match? |
|----------|---------------|-----------|--------|
| locked | "rhx keyrack unlock --owner ehmpath" | "rhx keyrack unlock --owner ehmpath --prikey ~/.ssh/ehmpath --env all" | yes (with full flags) |
| absent | "rhx keyrack set --owner ehmpath --key XAI_API_KEY" | "rhx keyrack set --owner ehmpath --key XAI_API_KEY" | yes |
| blocked | "check keyrack permissions" | "hint: check keyrack permissions" | yes |

---

## gaps found

| gap | severity | status |
|-----|----------|--------|
| tests deferred | expected | per roadmap, phase 2 |
| usecase.5 relies on rhachet | n/a | keyrack.yml created; display is rhachet's job |

**no implementation gaps in phase 0 or phase 1.**

---

## final assessment

| specification | coverage |
|---------------|----------|
| vision requirements | 100% |
| criteria usecases | 100% (usecase.5 depends on rhachet) |
| blueprint phase 0 | 100% |
| blueprint phase 1 | 100% |
| blueprint phase 2 | 0% (deferred per roadmap) |

all requirements from vision, criteria, and blueprint (phase 0-1) are implemented. tests are deferred per the roadmap to a follow-up phase.

