### .tactic = funcs:arrow-only

#### .what
enforce that all procedures are declared via arrow functions
disallow use of `function` keyword for any procedure

#### .where
- applies to all exported and internal functions across codebase
- required in modules, utilities, hooks, logic, and test declarations
- exempt only for class methods or dynamic `this` bind (rare)

#### .why
- enforces lexical `this` bind for predictable behavior
- aligns code structure with uniform declaration style
- improves visual clarity and reduces syntactic noise
- simplifies use with higher-order functions, closures, and composability

#### .how

##### .rules
- use arrow syntax (`const fn = (input: { ... }) => {}`) for all functions
- never use `function` keyword for standalone or inline functions
- use object methods only when tied to a `class` or api contract
- accept input as a single object parameter with inline type annotation

##### .examples

###### .positive
```ts
export const setCustomerPhone = (input: { customer: Customer; phone: string }) => {
  return { ...input.customer, phone: input.phone };
};

const getName = (input: { name: string }) => input.name;
```


###### .negative
```ts
function setCustomerPhone(input: { customer: Customer; phone: string }) {   // 👎 function keyword
  return { ...input.customer, phone: input.phone };
}

export function doWork() {                     // 👎 export with function
  ...
}
```
