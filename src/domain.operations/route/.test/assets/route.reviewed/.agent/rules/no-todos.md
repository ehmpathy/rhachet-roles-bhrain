# rule: no todo comments

## .what

todo comments are forbidden in production code

## .why

- todos indicate incomplete work
- they accumulate and become technical debt
- they signal unfinished implementations

## .detection

look for:
- `// TODO`
- `// todo`
- `/* TODO */`

## .enforcement

presence of TODO comments = **BLOCKER**
