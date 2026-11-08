/**
 * .what = the one Stop hook entry that `learn.terms.hook enable` writes
 * .why = one source for the author, the command, and the fragment every verb matches on, so
 *        the writer and the readers can never drift apart
 *
 * .note = the author threads three rhachet read rules, the same at every version the peer floor
 *         admits (`>=1.49.2`; read at v1.49.2, v1.50.0, and v1.51.0):
 *         - it does not start with `repo=`, so neither the per-role sync (which deletes
 *           undeclared entries under exactly `repo=bhrain/role=learner`) nor the orphan prune
 *           (`^repo=.+/role=.+$`) claims it
 *         - it carries a `role=learner` segment, so the peer-actor derive keeps it for every
 *           actor that holds the learner, and drops it for every actor that does not
 * .note = the command runs behind a guard on the learner's role link: once the learner is
 *         unlinked, every toggle verb is gone too, and the guard makes the leftover entry cost
 *         one shell test per stop, exit 0, never an error or a held stop
 */
const ROLE = 'learner';
const ROLE_LINK = `.agent/repo=bhrain/role=${ROLE}`;
const FRAGMENT = 'learn.domain.terms --when hook.onStop';
const AUTHOR = `toggle=learn.terms.hook/role=${ROLE}`;
const COMMAND = `[ ! -e ${ROLE_LINK} ] || ./node_modules/.bin/rhx ${FRAGMENT}`;
const TIMEOUT_SECONDS = 5;

export const TERMS_HOOK_DECLARED = {
  event: 'Stop',
  matcher: '*',
  author: AUTHOR,
  command: COMMAND,
  fragment: FRAGMENT,
  timeoutSeconds: TIMEOUT_SECONDS,

  /**
   * .what = the inner hook object exactly as `enable` writes it
   * .why = the writer spreads it and the state read compares against it whole, so a field
   *        added here reaches both, and `current` can never drift from what was written
   */
  hook: {
    type: 'command',
    command: COMMAND,
    timeout: TIMEOUT_SECONDS,
    author: AUTHOR,
  },
} as const;
