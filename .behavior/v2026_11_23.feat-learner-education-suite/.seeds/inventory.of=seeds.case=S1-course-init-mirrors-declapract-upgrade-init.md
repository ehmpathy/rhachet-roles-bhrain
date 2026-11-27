# S1: course init mirrors declapract.upgrade init

## .said

> `education.course init` should mirror declapract.upgrade init, and also, you should know that we expect education.course init to be run from within the role repo that wants to educate its roles. it would never do mods

## .settled

- the verb is a subcommand: `education.course init`, a dispatcher skill with `init` beside future subcommands, as `declapract.upgrade init|exec`
- init findserts `.route/v$date.<slug>/` with `.stone` + `.guard` files only, then binds the route to the branch
- the expected home of a course is the repo that publishes the role (its `rhachet.repo.yml` lists it); the course writes the role's source, so the education ships with the package
- the clause on mods was revised by S2

## .landed

- `1.vision.yield.md` `.what this builds`
- fulcrums F2, F6
