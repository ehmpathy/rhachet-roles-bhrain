# rules collocated

## .what

collocated documents are support materials that live alongside rule files, providing examples, references, and educational content.

## collocation pattern

support documents follow the rule file name with a suffix:

```
rule.$directive.$topic.[suffix].$qualifier.md
```

- **[suffix]** = document type: `[demo]`, `[ref]`, `[lesson]`
- **$qualifier** = distinguishing name for multiple documents

## suffix types

### [demo] - examples and demonstrations

concrete examples showing the rule in action:

```
rule.forbid.error_hiding.[demo].try_catch.md
rule.prefer.early_returns.[demo].guard_clauses.md
rule.require.tests.[demo].integration.md
```

demos typically include:
- working code samples
- before/after comparisons
- annotated walkthroughs

### [ref] - reference materials

supporting documentation and external references:

```
rule.require.domain_objects.[ref].package.md
rule.prefer.dependency_injection.[ref].article.md
rule.forbid.barrel_exports.[ref].circular_deps.md
```

refs typically include:
- links to external documentation
- package usage guides
- architectural diagrams

### [lesson] - educational content

teaching materials that explain concepts in depth:

```
rule.require.narrative_flow.[lesson].code_paragraphs.md
rule.prefer.transformers.[lesson].pipelines_vs_conditionals.md
rule.require.idempotency.[lesson].findsert_upsert.md
```

lessons typically include:
- conceptual explanations
- mental models
- learning progressions

## directory layout

collocated documents appear alongside their parent rule:

```
practices/code.prod/evolvable.procedures/
├── rule.forbid.positional_args.md
├── rule.forbid.positional_args.[demo].shell.md
├── rule.forbid.positional_args.[lesson].named_args.md
├── rule.require.input_context_pattern.md
├── rule.require.input_context_pattern.[ref].package.md
└── rule.require.dependency_injection.md
```

## .when to collocate

collocate when:
- a rule benefits from concrete examples
- external resources clarify the rule
- deeper explanation aids understanding
- multiple examples illustrate different aspects

keep separate when:
- the document applies to multiple rules
- the content is general reference (put in briefs/knowledge/)
- the document is too large to be a quick supplement

## .note

- collocated documents inherit context from their parent rule
- multiple suffixed documents can exist for one rule
- qualifiers should be descriptive but concise
- load order: rule first, then demos, refs, lessons
