# S2 · the status-line init never fails `rhx init` or `rhx upgrade`

## .said

> also, can we make sure that on rhx init this does not fail? today, rhx upgrade shows failures for this init

## .settled

- a role init that cannot bind the status line degrades to a warn, never a nonzero exit that
  marks `rhx init` / `rhx upgrade` as failed

## .landed

- `src/domain.roles/driver/inits/init.claude.status-line.sh`
