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
