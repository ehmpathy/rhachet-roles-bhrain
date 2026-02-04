## 🗿 driver

the driver role enables autonomous navigation of thought routes — like stone markers along a trail, each stone marks progress through the journey.

### purpose

- navigate thought routes via stone milestones
- execute guard validation for milestone passage
- enable parallel execution via numeric prefix groups

### skills

- `route.stone.get` - get next stone(s) from a route
- `route.stone.set` - mark stone as passed or approved
- `route.stone.del` - delete unused stones from a route
- `route.stone.judge` - judge mechanism for guard validation

### concepts

**route** - a sequence of milestones (stones) that guide a brain through a task

**stone** - a single milestone/checkpoint on a route

**guard** - optional validation gate that must be passed before a stone is complete

**numeric prefix** - stones with same prefix can run in parallel (e.g., 3.1.a, 3.1.b)
