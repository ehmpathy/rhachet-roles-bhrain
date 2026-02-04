# 🦉 rhachet-roles-bhrain

![test](https://github.com/ehmpathy/rhachet-roles-bhrain/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/rhachet-roles-bhrain/workflows/publish/badge.svg)

reliable thought concept navigation roles, briefs, and skills, via [rhachet](https://github.com/ehmpathy/rhachet)

# purpose

# install

```sh
npm install rhachet-roles-bhrain
```

# use

## `readme --registry`
```sh
npx rhachet readme --registry bhrain
```

produces

```md
# 🦉 bhrain role registry

this registry defines the roles used to navigate though concept space.

---

## 🪐 thinker

used to navigate through concept space. see src/roles/thinker/briefs/cognition for details.

---

## 📚 librarian

used to curate knowledge and context. see src/roles/thinker/briefs/librarian.context and src/roles/thinker/briefs/librarian.tactics for details.

---

## 🔍 reviewer

used to review artifacts against declared rules. designed to be composed into review skills for other roles.

---

## 🔬 architect

used to document and compare architectures of replic brains (LLMs behind REPLs).

---

## 🧠 brain

a brain.repl available for agentic tooluse

---

## 🗿 driver

used to navigate thought routes via stone milestones. enables robots to autonomously progress through structured journeys with optional guard validation.
```

## `ask -r thinker -s instantiate`

```sh
npx rhachet ask -r thinker -s instantiate \
  --attempts 3 \
  --fresh yes \
  --output 'src/jokes.v1.md' \
  --ask "
     whats your best joke about seaturtles?
  "
```


## `ask -r thinker -s catalogize`

```sh
npx rhachet ask -r thinker -s catalogize \
  --attempts 3 \
  --fresh yes \
  --output 'src/jokes.v1.md' \
  --ask "
    what are the different types of sea turtles?
  "
```


## `ask -r thinker -s articulate`

```sh
npx rhachet ask -r thinker -s articulate \
  --attempts 3 \
  --fresh yes \
  --output 'src/jokes.v1.md' \
  --ask "
    what is a sea turtle?
  "
```

## `ask -r thinker -s demonstrate`

```sh
npx rhachet ask -r thinker -s articulate \
  --attempts 3 \
  --fresh yes \
  --output 'src/jokes.v1.md' \
  --ask "
    how to identify a sea turtle?
  "
```

## `run --repo bhrain --skill review`

review artifacts against rules via claude-code as the brain. designed to compose into review skills for other roles.

```sh
npx rhachet run --repo bhrain --skill review --mode hard --diffs uptil-main --paths '!pnpm-lock.yaml'
```

produces

```
🌊 skill "review" from repo=bhrain role=reviewer

🔭 metrics.expected
   ├─ files
   │  ├─ rules: 60
   │  └─ targets: 69
   ├─ tokens
   │  ├─ estimate: 73122
   │  └─ context: 36.6%
   └─ cost
      └─ estimate: $0.3290

🪵 logs
   ├─ scope: .log/bhrain/review/2025-12-23T00-39-00-673Z/input.scope.json
   ├─ metrics: .log/bhrain/review/2025-12-23T00-39-00-673Z/metrics.expected.json
   └─ tokens: .log/bhrain/review/2025-12-23T00-39-00-673Z/tokens.expected.md

🦉 let's review!
   └─ elapsed: 85s ✓

✨ metrics.realized
   ├─ tokens
   │  ├─ input: 2
   │  ├─ cache.write: 144578
   │  ├─ cache.read: 14316
   │  └─ output: 1090
   └─ cost
      ├─ input: $0.0000
      ├─ cache.write: $0.5422
      ├─ cache.read: $0.0043
      ├─ output: $0.0164
      └─ total: $0.5629

🌊 output
   ├─ logs: .log/bhrain/review/2025-12-23T00-39-00-673Z
   └─ review: .review/bhrain/v2025-12-23T00-39-00-645Z/[feedback].[given].by_robot.md
```

## `run --repo bhrain --skill reflect`

extracts rules from feedback files and proposes them to a target directory. uses a two-step process: first proposes pure rules from feedback, then blends proposals with prior rules in the target.

```sh
npx rhachet run --repo bhrain --skill reflect --source /path/to/feedback --target ./briefs/practices
```

produces

```
🌊 skill "reflect" from repo=bhrain role=reviewer

🔭 metrics.expected
   ├─ files
   │  └─ feedback: 2
   ├─ tokens
   │  ├─ estimate: 1,102
   │  └─ context: 0.55%
   └─ cost
      └─ estimate: $0.0060

⛏️  step 1: propose pure rules from feedback...
   └─ elapsed: 38s ✓

🪨 step 2: blend proposals with prior rules...
   └─ elapsed: 30s ✓
   └─ CREATE: practices/writing.prose/rule.avoid.gerund-dominated-sentences.md
   └─ CREATE: practices/writing.prose/rule.avoid.passive-voice-overuse.md
   └─ CREATE: practices/writing.prose/rule.avoid.unclear-wordplay.md
   └─ CREATE: practices/writing.clarity/rule.require.explain-technical-terms.md
   └─ CREATE: practices/writing.structure/rule.require.one-idea-per-paragraph.md

✨ metrics.realized
   ├─ tokens
   │  ├─ input: 33
   │  └─ output: 5,001
   └─ cost
      └─ total: $0.2036

🌊 output
   ├─ draft: .draft/v2025-12-26T22-11-28-309Z
   ├─ pure: .draft/v2025-12-26T22-11-28-309Z/pure
   └─ sync: .draft/v2025-12-26T22-11-28-309Z/sync

🪨 results
   ├─ created: 5
   ├─ updated: 0
   ├─ appended: 0
   └─ omitted: 0
```

## `run --repo bhrain --role brain --skill act`

brain.repl which autonomously completes tasks via tools. supports multiple brain.atoms (anthropic, openai, qwen) with toolboxes for file operations and web access.

```sh
npx rhachet run --repo bhrain --role brain --skill act \
  --target ./output.md \
  --provider anthropic \
  --model claude-sonnet-4-20250514 \
  "research sea turtles and write a brief report"
```

produces

```
🌊 skill "act" from repo=bhrain role=brain

🧠 brain act execution log

## summary
- termination: NATURAL_COMPLETION
- iterations: 5
- tokens: 4821

## final response
[the brain's response to your task]
```

options:
- `--target` / `-t`: output file path for the result
- `--provider` / `-p`: brain.atom.provider (anthropic, openai, qwen)
- `--model` / `-m`: brain.atom.model (e.g., claude-sonnet-4-20250514, gpt-4o)
- `--system` / `-s`: path to custom system prompt file

## `run --repo bhrain --skill route.stone.get`

get the next stone(s) from a thought route. enables robots to know what milestone to work on next.

```sh
# get the next stone
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-one --route .behavior/my-feature

# get the next stone and echo its content
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-one --route .behavior/my-feature --say

# get all parallel stones (same numeric prefix)
npx rhachet run --repo bhrain --skill route.stone.get --stone @next-all --route .behavior/my-feature
```

produces

```
1.vision
```

## `run --repo bhrain --skill route.stone.set`

mark a stone as passed or approved. triggers guard validation if the stone has a guard.

```sh
# mark stone as passed (triggers guard validation)
npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as passed

# mark stone as approved (human approval gate)
npx rhachet run --repo bhrain --skill route.stone.set --stone 1.vision --route .behavior/my-feature --as approved
```

produces

```
stone 1.vision passed
```

or if guard validation fails:

```
stone 1.vision blocked: blockers exceed threshold (2 > 0)
```

## `run --repo bhrain --skill route.stone.del`

delete unused stones from a route. refuses to delete stones that have artifacts (preserves history).

```sh
# delete a specific stone
npx rhachet run --repo bhrain --skill route.stone.del --stone 3.research.templates --route .behavior/my-feature

# delete multiple stones via glob
npx rhachet run --repo bhrain --skill route.stone.del --stone "*.research.*" --route .behavior/my-feature
```

produces

```
deleted: 3.1.research.templates, 3.1.research.prior
skipped: 3.1.research.domain (artifact found)
```

# mascots

this repo houses roles for owls 🦉 — wise navigators of concept space, who carefully traverse the landscapes of thought and knowledge.

they wield:

- 🪐 planet — for thinkers — to navigate through concept space, thoroughly
- 📚 books — for librarians — to curate knowledge and context, efficiently
- 🔍 magnifier — for reviewers — to examine artifacts against declared rules, precisely
- 🔬 microscope — for architects — to document and compare brain architectures, deeply
- 🧠 brain — for brains — to complete agentic tasks via tooluse, autonomously
- 🗿 stone — for drivers — to navigate thought routes via stone milestones, methodically
