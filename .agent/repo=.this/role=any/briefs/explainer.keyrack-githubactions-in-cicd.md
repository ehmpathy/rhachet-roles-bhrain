# explainer.keyrack-githubactions-in-cicd

## .what

how keyrack and github actions work together to give tests their credentials in cicd.

integration + acceptance tests need real api creds (no mocks). those creds live as
github actions secrets. keyrack is the bridge that carries them from github actions
into the live test process.

## .why

- tests must hit real services (FIREWORKS, ANTHROPIC, OPENAI, TAVILY, XAI) — mocks lie
- secrets must never be hardcoded or read from `process.env` by app code
- keyrack owns credential grant; app code just asks keyrack for creds

## .the chain

```
github actions secrets
   │  (stored in repo settings → actions → secrets)
   ▼
SECRETS_JSON = toJSON(secrets)          # .test.yml passes all secrets as one json blob
   │
   ▼
rhx keyrack firewall --env test \
  --from 'json(env://SECRETS_JSON)' \   # read the blob from env
  --into github.actions                 # emit to $GITHUB_ENV, masked
   │
   │  the firewall:
   │   • filters to keys declared in keyrack.yml for env=test
   │   • translates mechanisms (github app → short-lived ghs_* token)
   │   • blocks dangerous patterns (ghp_*, AKIA*, …)
   │   • masks + writes each grant to $GITHUB_ENV
   ▼
env vars available to every later step   # e.g. FIREWORKS_API_KEY=…
   │
   ▼
keyrack hoists those env vars into the daemon
   │  (keys supplied via env need no host manifest — see below)
   ▼
tests / review / reflect access creds via keyrack
```

> in short: **secrets → env vars → keyrack daemon → test access.**
> the keys come from github actions secrets, get interpreted as env vars,
> and keyrack hoists them into the daemon for subsequent test access.

## .local vs cicd

keyrack grants the same creds in both places — only the *source* differs:

| step            | local (dev machine)                  | cicd (github actions)                    |
| --------------- | ------------------------------------ | ---------------------------------------- |
| credential home | vault (os.secure / 1password / …)    | github actions secrets                   |
| into env        | (n/a — vault read on unlock)         | keyrack firewall → `$GITHUB_ENV`         |
| host manifest   | present (`rhx keyrack init` was run) | absent                                   |
| into daemon     | `keyrack unlock` reads vault         | keyrack hoists env-supplied keys         |
| test access     | daemon grant                         | daemon grant (env-supplied)              |

the key insight: **`keyrack unlock` only demands a host manifest when the key was NOT
already supplied via env var.** in cicd the firewall supplies the keys via env, so the
daemon can hoist them without a host manifest — which cicd does not have.

app code therefore calls `keyrack unlock` (or `get`) **unconditionally**, with no
`process.env.CI` branch. keyrack decides the source; the caller stays dumb.

## .what breaks it

| symptom in cicd                          | root cause                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| `credential '…' is locked / absent`      | secret not set in repo, or not declared in keyrack.yml env=test |
| `host manifest not found`                | firewall step absent, so key never reached env for the daemon to hoist |
| tests pass locally, fail only in cicd    | key declared for the wrong env, or firewall `--env` mismatch |

checklist when a cred fails in cicd:
1. secret present? `gh api repos/<org>/<repo>/actions/secrets`
2. key declared in `keyrack.yml` for the firewall's env (`--env test`)?
3. firewall step present in `.github/workflows/.test.yml` before the test steps?

## .the invariant

- never read `process.env.<SECRET>` in app code — ask keyrack
- never branch on `process.env.CI` for credential logic — keyrack abstracts the source
- keep the firewall step ahead of every step that needs creds

## .see also

- `.github/workflows/.test.yml` — the firewall step (from declapract-typescript-ehmpathy)
- `keyrack.yml` (+ role sub-manifests) — which keys each env declares
- `howto.keyrack.[lesson]` (mechanic role) — local unlock usage
