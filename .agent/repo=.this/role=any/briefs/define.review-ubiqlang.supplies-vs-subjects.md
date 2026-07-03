# define.review-ubiqlang.supplies-vs-subjects

## .what

review operations distinguish between two types of files:

| term | what | examples |
|------|------|----------|
| **supplies** | files that inform the review | rules, refs, briefs |
| **subjects** | files under review | source code, configs |

## .why

- supplies must always load (even if gitignored)
- subjects respect gitignore (don't scan build artifacts)
- clear names prevent confusion at call sites

## .pattern

```ts
// supplies: rules and refs that inform the review
const rules = await enumFilesForReviewSupplies({ glob: '.agent/**/*.md' });

// subjects: files under review
const targets = await enumFilesForReviewSubjects({ glob: 'src/**/*.ts' });
```

## .gitignore behavior

| function | gitignore | why |
|----------|-----------|-----|
| `enumFilesForReviewSupplies` | `false` | supplies must always load, even if gitignored |
| `enumFilesForReviewSubjects` | `true` | subjects respect gitignore (avoid build artifacts, restricted dirs) |

radically different: supplies ignore gitignore entirely, subjects respect it.

## .analogy

| review term | school analogy |
|-------------|----------------|
| supplies | textbooks, rubrics |
| subjects | student papers |

you use supplies to grade the subjects.
