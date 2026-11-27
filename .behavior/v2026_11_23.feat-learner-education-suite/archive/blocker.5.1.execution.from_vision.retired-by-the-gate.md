# blocked: 5.1.execution.from_vision — the integration suites need test keys

## .the ask

five keys stay absent after the driver's own unlock. a human sets each one, once:

```sh
rhx keyrack set --owner ehmpath --key OPENROUTER_API_KEY --env test --vault <vault>
rhx keyrack set --owner ehmpath --key OPENAI_API_KEY     --env test --vault <vault>
rhx keyrack set --owner ehmpath --key ANTHROPIC_API_KEY  --env test --vault <vault>
rhx keyrack set --owner ehmpath --key TAVILY_API_KEY     --env test --vault <vault>
rhx keyrack set --owner ehmpath --key XAI_API_KEY        --env test --vault <vault>
```

(`rhx keyrack fill --owner ehmpath --env test` sets them all in one pass, if preferred.)

## .the evidence, from this grove, 2026-11-25

`rhx keyrack status --owner ehmpath`, before and after the unlock (identical both times):

```
🔐 keyrack status
   ├─ owner: ehmpath
   ├─ recipients:
   │  └─ default (age)
   ├─ daemon: active ✨
   ├─ ehmpathy.prep.OPENROUTER_API_KEY   (prep · expires in: 361m)
   ├─ ahbode.test.AWS_PROFILE            (test · expires in: 452m)
   ├─ ehmpathy.test.AWS_PROFILE          (test · expires in: 511m)
   ├─ ahbode.prep.OPENROUTER_API_KEY     (prep · expires in: 368m)
   ├─ @all.camp.GITHUB_TOKEN             (camp · expires in: 435m)
   ├─ ahbode.camp.AWS_PROFILE            (camp · expires in: 435m)
   └─ ahbode.prod.AWS_PROFILE            (prod · expires in: 449m)
```

each key's leaf folds onto one line here; the env and expiry are as printed. no
`ehmpathy.test.*_API_KEY` is held.

`rhx keyrack unlock --owner ehmpath --env test`:

```
🔓 keyrack unlock
   ├─ ehmpathy.test.OPENROUTER_API_KEY   status: absent 🫧
   ├─ ehmpathy.test.OPENAI_API_KEY       status: absent 🫧
   ├─ ehmpathy.test.ANTHROPIC_API_KEY    status: absent 🫧
   ├─ ehmpathy.test.TAVILY_API_KEY       status: absent 🫧
   └─ ehmpathy.test.XAI_API_KEY          status: absent 🫧
```

the suite run that followed (`.log/role=mechanic/skill=git.repo.test/what=integration/[timestamp].stderr.log`)
refused on the same five, `absent 🫧`. the keys may read unlocked under another owner on this
box (the human's own keyrack); under `--owner ehmpath`, the owner the driver must use, they are absent.

then the driver runs, and re-arrives:

```sh
rhx git.repo.test --what integration --scope path://src/domain.operations/education --mode apply
rhx git.repo.test --what integration --scope path://src/contract/cli/education.faces --mode apply --resnap
rhx git.repo.test --what integration --scope path://src/domain.operations/route/bind --mode apply
```

## .the points that halt

| lane | point | answer |
|---|---|---|
| behavior-intent-coverage | blocker.1 — the journey and role suites are written, never run | agreed; conceded urgent; the run needs the keys |
| behavior-intent-coverage | blocker.2 — a credential gap is a blocker, not a deferral | agreed; hence this halt, not a pass |
| behavior-intent-coverage | blocker.4 — orchestrators lack executed integration | agreed; the journey covers them once it runs |
| ergo-friction-hazards | blocker.3 — integration written, not run | agreed; same run |

the face snapshot points (behavior-intent-coverage blocker.3, ergo-friction-hazards blocker.1) are
repaired in code, and their snapshots land on the same run.

## .why a `.taken` cannot close them

each names an absence — a run that has not happened — not an argument. the run refuses in strict
mode:

```
✋ some keys were not granted, yet are strictly required
   ehmpathy.test.OPENROUTER_API_KEY · OPENAI_API_KEY · ANTHROPIC_API_KEY · TAVILY_API_KEY · XAI_API_KEY — absent
```

the driver holds no lever to set a key, and the human's order forbids a relaxed (lenient) mode.

## .levers spent

- ran `rhx keyrack unlock --owner ehmpath --env test` (the driver's lever); all five came back absent, not locked
- re-ran the integration suite after the unlock; refused as above
- closed every other point: 26 blockers answered, 22 repaired in code, the rest the four above
- wrote the face snapshot test and 23 new unit tests; types, lint, 57 + 170 units green
- second opinion: not sought — the wall is a credential, the foreman-only carve-out of
  `rule.always.get-a-second-opinion-before-foreman`

## .also owed before the first commit

- F11 — the upgrade drift in `package.json` (`rhachet-artifact-git` moved to `devDependencies`
  while runtime code imports it), held for the human's read
