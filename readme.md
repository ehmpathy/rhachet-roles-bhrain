# rhachet-roles-bhrain

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
# 🧠 bhrain role registry

This registry defines the roles used to navigate though concept space.

---

## 🪐 Thinker

Used to navigate through concept space. See src/roles/thinker/briefs/cognition for details.

---

## 📚 Librarian

Used to curate knowledge and context. see src/roles/thinker/briefs/librarian.context and src/roles/thinker/briefs/librarian.tactics for details.

---

## 🔍 Reviewer

Used to review artifacts against declared rules. Designed to be composed into review skills for other roles.
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

reviews artifacts against rules using claude-code as the brain. designed to be composed into review skills for other roles.

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

🐢 let's review!
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
