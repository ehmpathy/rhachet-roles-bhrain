# when to add rapid mode to your skill

## the question

when authoring a skill that invokes claude, should you add a `--rapid` flag?

## the answer

**yes**, if your skill invokes claude-code or any llm api.

rapid mode lets callers trade quality for speed by using `haiku` instead of `sonnet`. this is valuable for:
- integration tests (run in seconds instead of minutes)
- development iteration (quick feedback loops)
- batch operations (process many items faster)
- ci pipelines (faster builds)

## how to implement

```typescript
// 1. accept rapid flag in your skill's input
export const stepMySkill = async (input: {
  // ... other inputs
  rapid?: boolean;
}): Promise<Result> => {
  const rapid = input.rapid ?? false;

  // 2. pass to claude invocation
  const { response } = await invokeClaudeCode({
    prompt,
    rapid,
  });
};
```

```typescript
// 3. in your invokeClaudeCode, switch model based on flag
const model = input.rapid ? 'haiku' : 'sonnet';
```

```bash
# 4. support --rapid in cli
npx tsx ./src/roles/.../myskill.ts --rapid true
```

## what rapid mode does

- switches from `sonnet` to `haiku` model
- keeps max-turns the same (task complexity unchanged)

## why it works

haiku is optimized for speed:
- faster inference latency per token
- lower cost per token (~10x cheaper than sonnet)
- sufficient capability for structured tasks with clear prompts

the tradeoff is reduced reasoning depth. but for well-defined tasks like rule extraction, review generation, or manifest creation, haiku performs adequately.

## why it's helpful

1. **faster integration tests** - tests complete in ~20-40s instead of ~60-120s
2. **lower cost** - run more tests without burning through api budget
3. **faster iteration** - developers get quick feedback during development
4. **ci optimization** - parallel test suites complete faster, shorter build times

## boundaries: when rapid succeeds vs fails

**rapid mode succeeds when:**
- prompts are well-structured with clear instructions
- task has explicit output format (json, markdown template)
- context is bounded and focused (not sprawling codebases)
- task is mechanical rather than creative (extraction, transformation, validation)

**rapid mode fails when:**
- task requires deep reasoning or multi-step planning
- output quality directly impacts end users
- prompt is ambiguous or underspecified
- task requires nuanced judgment calls

## integration tests vs performance tests

### integration tests: "does the skill satisfy the contract?"

the **contract** is the skill's interface and behavioral guarantees:
- given valid input, does it produce valid output?
- are files written to the correct locations?
- does the manifest parse as valid json?
- are the expected fields present in the result?

contract verification is **binary** - it works or it doesn't. output quality doesn't matter, only that shape and structure are correct.

a good integration test uses:
- small, focused test fixtures (1-2 feedback files, not 50)
- minimal context (single rule extraction, not full codebase analysis)
- clear success criteria (file exists, json valid, fields present)

haiku handles contract verification well because:
- context is small and bounded
- task is mechanical (extract, transform, write)
- prompts are explicit with clear output formats
- success is binary (worked or didn't)

### performance tests: "does the skill satisfy the metrics?"

the **metrics** are quality and scale benchmarks:
- does it extract 80%+ of rules from real feedback?
- does it complete within 60s on a 100-file codebase?
- does the output pass human review for accuracy?
- does it handle edge cases in production data?

metric verification requires **judgment** - how good is good enough? this needs sonnet or opus for deeper reasoning, and production-like test fixtures to be meaningful.

use performance tests to validate the skill works **well at scale**, not just that it works.

## when callers should use it

| context                   | use rapid? |
| ------------------------- | ---------- |
| integration tests         | yes        |
| development/debugging     | yes        |
| ci pipelines              | yes        |
| batch operations          | yes        |
| production user-facing    | no         |
| final artifact generation | no         |
