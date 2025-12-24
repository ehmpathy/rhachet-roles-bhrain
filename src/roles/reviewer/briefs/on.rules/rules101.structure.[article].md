# rules structure

## .what

rules follow a strict file name convention and directory organization that encodes semantics into the file system.

## file name convention

rule files follow the pattern:

```
rule.$directive.$topic.md
```

- **rule** = literal prefix identifying the file as a rule
- **$directive** = severity and action: `forbid`, `avoid`, `prefer`, `require`
- **$topic** = snake_case description of what the rule addresses

### examples

```
rule.forbid.positional_args.md
rule.avoid.gerunds.md
rule.prefer.early_returns.md
rule.require.tests.md
```

## directive taxonomy

directives indicate what action to take and at what severity:

| directive | action           | severity | description             |
|-----------|------------------|----------|-------------------------|
| `forbid`  | must not do      | blocker  | violation blocks merge  |
| `require` | must do          | blocker  | absence blocks merge    |
| `avoid`   | discouraged      | nitpick  | flag but don't block    |
| `prefer`  | encouraged       | nitpick  | suggest but don't block |

### severity map

| severity  | directives         | review impact                |
|-----------|--------------------|-----------------------------|
| blocker   | forbid, require    | must resolve before merge   |
| nitpick   | avoid, prefer      | optional to resolve         |

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
