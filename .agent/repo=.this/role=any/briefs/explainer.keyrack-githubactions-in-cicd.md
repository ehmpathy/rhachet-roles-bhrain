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
| cred source     | vault, via `keyrack unlock`          | env var, via `keyrack get`               |
| test access     | daemon grant                         | env grant (never daemon)                 |

the key insight: **`keyrack get` grants uniformly (daemon → env → locked), but
`keyrack unlock` is vault-only and hard-requires a host manifest.** in cicd the firewall
supplied the cred via env, so `get` finds it — but `unlock` would still crash on the
absent host manifest.

so app code must **ask before it unlocks**:

1. `keyrack get --key … --owner … --env …` — is the cred already grantable?
   - yes → done. stay silent, do NOT unlock. (the CI firewall path.)
   - no → `keyrack unlock` on the user's behalf. (the local vault path.)

this get-then-unlock shape means the caller **never reads `process.env` and never
branches on `CI`** — keyrack owns the source decision. and critically, we **do not load
env-supplied creds into the daemon**: an env var is scoped to one terminal / one CI job,
and a copy into the machine-wide daemon would pollute the global session for every other
terminal. the daemon is for vault-sourced creds only.

## .what breaks it

| symptom in cicd                          | root cause                                                    |
| ---------------------------------------- | ------------------------------------------------------------ |
| `credential '…' is locked / absent`      | secret not set in repo, or not declared in keyrack.yml env=test |
| `host manifest not found`                | code called `keyrack unlock` in cicd without a `get` probe first — unlock is vault-only and cicd has no host manifest |
| tests pass locally, fail only in cicd    | key declared for the wrong env, or firewall `--env` mismatch |

checklist when a cred fails in cicd:
1. secret present? `gh api repos/<org>/<repo>/actions/secrets`
2. key declared in `keyrack.yml` for the firewall's env (`--env test`)?
3. firewall step present in `.github/workflows/.test.yml` before the test steps?

## .the invariant

- never read `process.env.<SECRET>` in app code — ask keyrack
- never branch on `process.env.CI` for credential logic — keyrack abstracts the source
- `get` before `unlock`: probe first, unlock only when the cred is not already granted
- never load env-supplied creds into the daemon — env is per-terminal, the daemon is global
- keep the firewall step ahead of every step that needs creds

## .see also

- `.github/workflows/.test.yml` — the firewall step (from declapract-typescript-ehmpathy)
- `keyrack.yml` (+ role sub-manifests) — which keys each env declares
- `howto.keyrack.[lesson]` (mechanic role) — local unlock usage
