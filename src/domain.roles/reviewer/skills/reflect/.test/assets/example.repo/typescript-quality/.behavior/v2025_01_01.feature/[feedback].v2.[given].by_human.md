# feedback on naming conventions

## context

general feedback on naming patterns seen across multiple PRs

## observations

### variable naming

seeing inconsistent naming patterns:

- `existingUser` vs `userFound`
- `currentSession` vs `sessionCurrent`

prefer [noun][adjective] ordering for autocomplete benefits:

```ts
// prefer
const userFound = await findUser({ id });
const userUpdated = await updateUser({ user: userFound, changes });

// avoid
const foundUser = await findUser({ id });
const updatedUser = await updateUser({ user: foundUser, changes });
```

### function naming

functions should follow [verb][noun] pattern:

```ts
// prefer
const setUserPhone = (input: { user: User; phone: string }) => {};
const getUserById = (input: { id: string }) => {};

// avoid
const phoneSet = (input: { user: User; phone: string }) => {};
const byIdGetUser = (input: { id: string }) => {};
```

## summary

consistent naming makes codebase more navigable and IDE autocomplete more useful.
