# rules citations

## .what

citations trace rules back to their origin feedback, providing provenance and context for why each rule exists.

## citation format

citations appear in the `## .citations` section of the `# deets` block:

```md
## .citations

> exact quote from the feedback that led to this rule

source: https://github.com/org/repo/blob/commit/path/to/feedback.md
```

## github url format

citation urls must be permanent github links that include:

- organization/owner
- repository name
- commit hash or branch
- full file path

### url pattern

```
https://github.com/{org}/{repo}/blob/{ref}/{path}
```

### examples

```md
source: https://github.com/ehmpathy/declastruct-aws/blob/main/.behavior/v2025_12_05.aws-account-provision/5.1.execution.phase0_to_phaseN.v1.i1.md.%5Bfeedback%5D.v1.%5Bgiven%5D.by_human.md

source: https://github.com/acme/project/blob/abc123/.behavior/v2025_01_01.feature/execution.md.[feedback].v2.[given].by_human.md
```

## quote inclusion

quotes capture the specific feedback that inspired the rule:

### single quote

```md
## .citations

> never hide errors in try/catch blocks without explicit handling

source: https://github.com/...
```

### multiple quotes

when a rule consolidates multiple feedback instances:

```md
## .citations

> always use named arguments for readability

source: https://github.com/org/repo1/blob/.../feedback.v1.md

---

> positional args are a maintenance nightmare

source: https://github.com/org/repo2/blob/.../feedback.v3.md
```

## provenance track

citations enable:

- **audit trail** - trace any rule back to real experience
- **context recovery** - understand the situation that prompted the rule
- **credibility** - rules grounded in actual feedback, not theory
- **evolution** - track how rules emerged and refined over time

## .note

- always use the full github url, not relative paths
- prefer permalinks with commit hashes for immutable references
- when feedback files are renamed or moved, update citations
- if origin feedback is deleted, preserve the quote with a note about the removed source
