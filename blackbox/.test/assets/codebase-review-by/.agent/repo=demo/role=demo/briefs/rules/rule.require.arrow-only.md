### .tactic = funcs:arrow-only

#### .what
enforce that all procedures are declared via arrow functions
disallow use of `function` keyword for any procedure

#### .why
- enforces lexical `this` bind for predictable behavior
- aligns code structure with uniform declaration style

#### .how
- use arrow syntax (`const fn = (input: { ... }) => {}`) for all functions
- never use `function` keyword for standalone or inline functions

#### .enforcement
use of the `function` keyword = blocker
