# rules structure

## .what

rules follow a strict file name convention and directory organization that encodes semantics into the file system.

## file name convention

rule files follow the pattern:

```
rule.$directive.$topic.md
```

- **rule** = literal prefix identifying the file as a rule
- **$directive** = severity and action: `forbid`, `avoid`, `prefer`, `require`, `always`
- **$topic** = snake_case description of what the rule addresses

### examples

```
rule.forbid.positional_args.md
rule.avoid.gerunds.md
rule.prefer.early_returns.md
rule.require.tests.md
rule.always.drive-autonomously.md
```

## directive taxonomy

directives indicate what action to take and at what severity:

| directive | action           | severity | description             |
|-----------|------------------|----------|-------------------------|
| `forbid`  | must not do      | blocker  | violation blocks merge  |
| `require` | must do          | blocker  | absence blocks merge    |
| `always`  | must do, each time the moment comes | blocker | omission blocks merge |
| `avoid`   | discouraged      | nitpick  | flag but don't block    |
| `prefer`  | encouraged       | nitpick  | suggest but don't block |

### severity map

| severity  | directives                 | review impact                |
|-----------|----------------------------|------------------------------|
| blocker   | forbid, require, always    | must be settled before merge |
| nitpick   | avoid, prefer              | optional to settle           |

## 🔴 `always` vs `require` — the subject differs, the severity does not

both grade at **blocker**. reaching for `always` never softens a rule, and it never hardens one.
what changes is **what the reviewer reads to check it**:

| directive | the claim | the check |
|-----------|-----------|-----------|
| `require` / `forbid` | the artifact must **be** X | read the artifact. is the state there? |
| `always` | you must **do** X, each time the moment comes | read the trail. was the act performed at the moment? |

### the test — is the topic a NOUN PHRASE or a VERB PHRASE?

it is that mechanical, and it holds across every rule in this repo:

```
rule.require.$state       # a noun phrase or a clause — "timeless lessons", "catalog is an index"
rule.always.$act          # a verb phrase in the imperative — "catch dreams", "reuse pavement"
```

- reads as *"the artifact must **be** …"* → **`require`** / **`forbid`**
- reads as *"you must **do** … every time"* → **`always`**

### why the distinction earns a directive rather than a synonym

⚠️ **an `always` rule is often unfalsifiable from the diff alone**, and that is the whole reason it
is a separate word. *"did you check the pavement before you improvised?"* leaves no trace in a
file. so `always` rules routinely grade **when** something was written rather than **whether** —
several state outright that a record swept together at the end is a violation even though the
record is present.

⇒ a reviewer who treats an `always` rule as a state check will pass work that violated it. the
directive is the signal to read the trail instead.

## ⚠️ the known gaps in this taxonomy

stated rather than papered over, so the next author does not re-derive them:

| gap | what it means |
|---|---|
| **no conduct directive at nitpick severity** | an act you should usually perform, at nitpick, has no slot. it is currently filed under `prefer`, which reads as a state claim |
| **`forbid` spans both subjects** | it covers a forbidden *state* (`forbid.brackets-in-filenames`) and a forbidden *act* (`forbid.websearch-and-webfetch`). whether a conduct-negative twin of `always` is owed is unsettled |
| **`avoid` has zero instances here** | declared, unused. it may be dead, or it may be the nitpick slot nobody reached for |

## .note

`always` is this repo's **most-used** directive — 22 of its 47 rules — and it went undeclared
until 2026-08-31. a prefix in that much use with no declared severity is one a reviewer has to
guess at, which is the defect this section closes.

⚠️ **five extant `rule.require.*` files are verb-phrase conduct rules** and are candidates for a
rename to `always` by the test above. they are left in place until disturbed — a sweep is
forbidden, and a partial rename is worse than a consistent extant set
(`rule.forbid.domain-term-synonyms`'s own no-mass-rewrite clause).

## practices directory structure

rules are organized into practice directories by domain concern. the specific practice domains vary by project and role - there is no prescribed set.

typical patterns include:
- group by artifact type (e.g., code, docs, config)
- group by quality dimension (e.g., readability, reliability)
- group by lifecycle stage (e.g., design, test, deploy)

nested subdirectories further refine the domain:

```
practices/
└── $domain/
    └── $subdomain/
        ├── rule.$directive.$topic.md
        └── rule.$directive.$topic.[demo].$qualifier.md
```

## .note

the directory structure groups related rules, making it easier to:
- discover rules relevant to a domain
- maintain consistent naming within a practice
- navigate rules by concern rather than alphabetically
