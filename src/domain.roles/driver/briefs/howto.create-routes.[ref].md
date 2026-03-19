# howto: create thought routes

## .what
guide for create new thought routes: directories, stones, guards, and bind commands.

## .why
enable self-serve route creation without reverse-engineer extant routes.

---

## concepts

### route
a sequence of milestones (stones) that guide a brain through a task.
directory: `.route/v$isodate.$slug/` or `.$variant/v$isodate.$slug/`

### stone
a single milestone on a route. file: `N.name.stone`
contains markdown instructions for work to be done.

### guard
optional validation gate for a stone. file: `N.name.guard` (matches stone name).
yaml with `judges:` (commands to run) and/or `reviews:` (self/peer review prompts).

---

## commands

| command | purpose |
|---------|---------|
| `rhx route.bind.set --route $path` | bind route to current branch |
| `rhx route.bind.get` | show current bound route |
| `rhx route.bind.del` | unbind route |
| `rhx route.drive` | show next stone |
| `rhx route.stone.set --stone $name --as passed` | mark stone complete |

---

## example: create minimal route

1. create directory: `mkdir .route/v2026_03_15.my-feature`
2. create wish: `echo "# wish\n\nthe goal..." > .route/v2026_03_15.my-feature/0.wish.md`
3. create stone: `echo "# do the work" > .route/v2026_03_15.my-feature/1.task.stone`
4. bind: `rhx route.bind.set --route .route/v2026_03_15.my-feature`
5. drive: `rhx route.drive`

---

## parallel stones

stones with same numeric prefix can be worked in parallel:
- `3.1.a.stone`, `3.1.b.stone` — both available simultaneously
- route advances when ALL parallel stones in prefix group are passed

---

## guard syntax

```yaml
judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route
  - rhx route.stone.judge --mechanism approved? --stone $stone --route $route

reviews:
  self:
    - slug: has-questioned-requirements
      say: |
        are there any requirements that should be questioned?
        challenge each requirement and justify why it belongs.

    - slug: has-questioned-assumptions
      say: |
        are there any hidden assumptions?
        surface all hidden assumptions and question each one.
```

---

## advanced: nested routes

when a stone's work requires its own route:
1. create sub-route in separate directory
2. rebind: `rhx route.bind.set --route .route/v$date.$subroute`
3. complete sub-route
4. rebind to parent: `rhx route.bind.set --route .route/v$date.$parent`

note: route.bind tracks one route at a time. switch via rebind.

---

## advanced: variants

- `.route/` — default variant for most routes
- `.behavior/` — behavior-driven routes
- `.$custom/` — custom variants as needed
